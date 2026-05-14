# Handelsregister Extraktor

A Dockerized full-stack application that automatically extracts structured data from German Handelsregister (commercial registry) PDF documents and displays it in a searchable, filterable table.

---

## What it does

Upload Handelsregister PDFs (HRB, HRA, GnR) into the `pdfs/` folder, click a button, and the app extracts:

| Field | Description |
|---|---|
| **Firma** | Company name |
| **Sitz** | Registered office location |
| **Gegenstand** | Business purpose (2–3 sentence summary) |
| **Geschäftsführung** | Managing directors / board members with exact age |
| **Prokura** | Authorized signatories with exact age |

Extraction is done by a **local LLM (qwen2.5:7b via Ollama)** — no data ever leaves your machine.

---

## Nachfolge-Erkennung (Succession Risk)

The app automatically flags companies where:
- There is **only one** managing director / board member
- That person is **older than 60**
- There is **no Prokura** appointed

These entries are highlighted in green with a **"Keine Nachfolge"** badge. For each flagged company you can open a pre-filled email in your mail client (Outlook, Apple Mail, etc.) with a standardized German succession planning template.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Backend | FastAPI (Python) |
| LLM | Ollama · qwen2.5:7b (runs fully locally) |
| Database | PostgreSQL |
| PDF extraction | pdfplumber |
| Deployment | Docker Compose |

---

## Getting started

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/handelsregister-extractor.git
cd handelsregister-extractor
```

### 2. Configure environment
```bash
cp .env.example .env
```
Edit `.env` and set a secure database password if needed.

### 3. Add your PDFs
Copy your Handelsregister PDFs into the `pdfs/` folder:
```bash
cp /path/to/your/pdfs/*.pdf pdfs/
```

### 4. Start the application
```bash
docker compose up --build
```

> **First run:** The LLM model (qwen2.5:7b, ~4.7 GB) is downloaded automatically. This takes a few minutes depending on your internet connection. Subsequent starts are instant.

### 5. Open the app
Open **http://localhost:3000** in Chrome or Safari.

> Use Chrome or Safari — not VS Code's built-in browser — for the email buttons to work correctly.

### 6. Process PDFs
Click **"PDFs verarbeiten"**. The table fills up in real time as each document is processed (~15–30 seconds per PDF on CPU).

---

## Features

- **Real-time progress** — table updates after each PDF is extracted, not just at the end
- **Deduplication** — re-clicking "PDFs verarbeiten" skips already-processed files (SHA256 hash check)
- **Filters** — search by name/location, filter by register type (HRB/HRA/GnR), filter by Geschäftsführung/Prokura, show only "Keine Nachfolge" entries
- **Expandable rows** — click any row to see the full person list with names, cities, birth dates and ages
- **Email integration** — per-company email button + "Alle anschreiben" bulk button, opens your default mail app with a pre-filled German template
- **Fully offline** — the LLM runs locally via Ollama, no API keys required, no data sent to external services

---

## Project structure

```
├── docker-compose.yml
├── .env.example
├── pdfs/                    ← Place your PDF files here
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py
│       ├── database.py
│       ├── models/          ← SQLAlchemy ORM models
│       ├── routers/         ← FastAPI route handlers
│       ├── schemas/         ← Pydantic schemas
│       └── services/
│           ├── pdf_service.py        ← PDF text extraction
│           ├── llm_service.py        ← Ollama LLM integration
│           └── processing_service.py ← Orchestration + WebSocket
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    └── src/
        ├── components/      ← React components
        ├── hooks/           ← useProgress WebSocket hook
        ├── api/             ← Axios API client
        ├── utils/           ← Email generation
        └── types/           ← TypeScript interfaces
```

---

## Useful commands

```bash
# Start (after first build)
docker compose up

# Rebuild after code changes
docker compose up --build

# Stop
docker compose down

# Wipe database and reprocess all PDFs
docker compose exec postgres psql -U pguser -d handelsregister -c "TRUNCATE companies CASCADE;"

# View backend logs
docker compose logs backend -f

# View LLM logs
docker compose logs ollama -f
```

## How to use
Prerequisites: Docker Desktop — nothing else needed, no Python, no Node.js.

Steps:


# 1. Clone the repo
git clone https://github.com/woodytb/taxes_project.git
cd handelsregister-extractor

# 2. Create the env file
cp .env.example .env

# 3. Add PDFs
cp /path/to/pdfs/*.pdf pdfs/

# 4. Start everything
docker compose up --build
Then open http://localhost:3000 in Chrome or Safari.

First run takes ~5–10 minutes because Docker downloads:

The qwen2.5:7b model (~4.7 GB)
The Python, Node, Postgres, and Nginx images (~1–2 GB total)
After that first download everything is cached locally and subsequent starts take ~30 seconds.

The only gotcha: open the app in Chrome or Safari, not VS Code's built-in browser, otherwise the email buttons won't open Outlook.
