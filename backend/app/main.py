import logging
import os
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import engine
from app.models import company as company_models
from app.routers import companies, process

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    company_models.Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Handelsregister Extractor", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(companies.router)
app.include_router(process.router)


@app.get("/api/health")
async def health():
    db_ok = False
    ollama_ok = False

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        pass

    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{os.environ.get('OLLAMA_BASE_URL', 'http://ollama:11434')}/api/tags",
                timeout=5.0,
            )
            ollama_ok = r.status_code == 200
    except Exception:
        pass

    return {"status": "ok", "db": db_ok, "ollama": ollama_ok}
