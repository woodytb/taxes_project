import asyncio
import logging
import os
from datetime import date, datetime
from pathlib import Path

from sqlalchemy.orm import Session

from app.models.company import Company, Person
from app.services import pdf_service, llm_service

logger = logging.getLogger(__name__)

# task_id -> asyncio.Queue for WebSocket progress updates
progress_queues: dict[str, asyncio.Queue] = {}

PDF_DIR = os.environ.get("PDF_DIR", "/app/pdfs")


def _get_pdf_files() -> list[Path]:
    pdf_dir = Path(PDF_DIR)
    if not pdf_dir.exists():
        return []
    return sorted(pdf_dir.glob("*.pdf"))


def _hash_exists(db: Session, text_hash: str) -> bool:
    return db.query(Company).filter(Company.raw_text_hash == text_hash).first() is not None


def _save_company(db: Session, extraction, source_file: str, text_hash: str) -> Company:
    company = Company(
        firma=extraction.firma,
        sitz=extraction.sitz,
        gegenstand=extraction.gegenstand,
        source_file=source_file,
        raw_text_hash=text_hash,
        extracted_at=datetime.utcnow(),
    )
    db.add(company)
    db.flush()

    for p in extraction.management:
        birth_date = _parse_date(p.birth_date) if p.birth_date else None
        db.add(Person(
            company_id=company.id,
            role=p.title or "Geschäftsführer",
            last_name=p.last_name,
            first_name=p.first_name,
            city=p.city,
            birth_date=birth_date,
            age=p.age if p.birth_date else None,
        ))

    for p in extraction.prokura:
        birth_date = _parse_date(p.birth_date) if p.birth_date else None
        db.add(Person(
            company_id=company.id,
            role=p.title or "Prokura",
            last_name=p.last_name,
            first_name=p.first_name,
            city=p.city,
            birth_date=birth_date,
            age=p.age if p.birth_date else None,
        ))

    db.commit()
    return company


def _parse_date(date_str: str):
    try:
        day, month, year = date_str.split(".")
        return date(int(year), int(month), int(day))
    except Exception:
        return None


async def _push(task_id: str, message: dict):
    q = progress_queues.get(task_id)
    if q:
        await q.put(message)


def process_all_pdfs_sync(task_id: str, db: Session, loop: asyncio.AbstractEventLoop):
    pdf_files = _get_pdf_files()

    asyncio.run_coroutine_threadsafe(
        _push(task_id, {"status": "started", "total": len(pdf_files)}), loop
    )

    if not pdf_files:
        asyncio.run_coroutine_threadsafe(
            _push(task_id, {"status": "done", "processed": 0, "skipped": 0}), loop
        )
        return

    processed = 0
    skipped = 0

    for i, pdf_path in enumerate(pdf_files):
        filename = pdf_path.name
        asyncio.run_coroutine_threadsafe(
            _push(task_id, {
                "status": "processing",
                "file": filename,
                "progress": i,
                "total": len(pdf_files),
            }),
            loop,
        )

        try:
            text_hash = pdf_service.compute_hash(str(pdf_path))
            if _hash_exists(db, text_hash):
                logger.info(f"Skipping {filename} (already processed)")
                skipped += 1
                continue

            sections = pdf_service.extract_sections(str(pdf_path))
            extraction = llm_service.extract_with_llm(sections)
            _save_company(db, extraction, filename, text_hash)
            processed += 1
            logger.info(f"Processed {filename}: {extraction.firma}")
            asyncio.run_coroutine_threadsafe(
                _push(task_id, {
                    "status": "file_done",
                    "file": filename,
                    "firma": extraction.firma,
                    "progress": i + 1,
                    "total": len(pdf_files),
                }),
                loop,
            )

        except Exception as e:
            logger.error(f"Error processing {filename}: {e}")
            asyncio.run_coroutine_threadsafe(
                _push(task_id, {"status": "error", "file": filename, "detail": str(e)}), loop
            )

    asyncio.run_coroutine_threadsafe(
        _push(task_id, {
            "status": "done",
            "processed": processed,
            "skipped": skipped,
            "total": len(pdf_files),
        }),
        loop,
    )
