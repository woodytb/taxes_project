from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.company import Company, Person
from app.schemas.extraction import CompanyOut, CompanyDetail, PersonOut, AttentionPerson

router = APIRouter(prefix="/api/companies", tags=["companies"])

ATTENTION_AGE = 60


def _is_prokura(role: str) -> bool:
    return "prokur" in (role or "").lower()


def _attention_check(persons: list) -> tuple[bool, AttentionPerson | None]:
    management = [p for p in persons if not _is_prokura(p.role)]
    prokura = [p for p in persons if _is_prokura(p.role)]

    if (
        len(management) == 1
        and len(prokura) == 0
        and management[0].age is not None
        and management[0].age > ATTENTION_AGE
    ):
        p = management[0]
        return True, AttentionPerson(
            title=p.role or "Geschäftsführer",
            first_name=p.first_name or "",
            last_name=p.last_name or "",
            age=p.age,
        )
    return False, None


def _company_to_out(company: Company) -> CompanyOut:
    persons = company.persons
    needs_attention, attention_person = _attention_check(persons)
    return CompanyOut(
        id=company.id,
        firma=company.firma,
        sitz=company.sitz or "",
        gegenstand=company.gegenstand or "",
        source_file=company.source_file,
        extracted_at=company.extracted_at.isoformat() if company.extracted_at else None,
        management_count=sum(1 for p in persons if not _is_prokura(p.role)),
        prokura_count=sum(1 for p in persons if _is_prokura(p.role)),
        needs_attention=needs_attention,
        attention_person=attention_person,
    )


@router.get("", response_model=list[CompanyOut])
def list_companies(
    page: int = 1,
    size: int = 50,
    db: Session = Depends(get_db),
):
    offset = (page - 1) * size
    companies = (
        db.query(Company)
        .order_by(Company.firma)
        .offset(offset)
        .limit(size)
        .all()
    )
    return [_company_to_out(c) for c in companies]


@router.get("/{company_id}", response_model=CompanyDetail)
def get_company(company_id: int, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    persons_out = [
        PersonOut(
            id=p.id,
            role=p.role or "",
            last_name=p.last_name or "",
            first_name=p.first_name or "",
            city=p.city or "",
            birth_date=p.birth_date,
            age=p.age,
        )
        for p in company.persons
    ]

    base = _company_to_out(company)
    return CompanyDetail(**base.model_dump(), persons=persons_out)
