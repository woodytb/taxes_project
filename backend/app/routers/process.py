import asyncio
import json
import uuid
from concurrent.futures import ThreadPoolExecutor

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.services.processing_service import process_all_pdfs_sync, progress_queues

router = APIRouter(tags=["process"])
_executor = ThreadPoolExecutor(max_workers=1)


@router.post("/api/process")
async def trigger_processing(db: Session = Depends(get_db)):
    task_id = str(uuid.uuid4())
    q: asyncio.Queue = asyncio.Queue()
    progress_queues[task_id] = q

    loop = asyncio.get_event_loop()
    thread_db = SessionLocal()

    def run():
        try:
            process_all_pdfs_sync(task_id, thread_db, loop)
        finally:
            thread_db.close()
            progress_queues.pop(task_id, None)

    loop.run_in_executor(_executor, run)
    return {"task_id": task_id}


@router.websocket("/ws/progress/{task_id}")
async def ws_progress(websocket: WebSocket, task_id: str):
    await websocket.accept()

    if task_id not in progress_queues:
        await websocket.send_text(json.dumps({"status": "not_found"}))
        await websocket.close()
        return

    q = progress_queues[task_id]
    try:
        while True:
            message = await asyncio.wait_for(q.get(), timeout=300.0)
            await websocket.send_text(json.dumps(message))
            if message.get("status") in ("done", "error"):
                break
    except asyncio.TimeoutError:
        await websocket.send_text(json.dumps({"status": "timeout"}))
    except WebSocketDisconnect:
        pass
    finally:
        await websocket.close()
