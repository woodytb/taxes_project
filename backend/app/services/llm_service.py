import json
import logging
import os
from datetime import date

import httpx

from app.schemas.extraction import CompanyExtraction, PersonExtraction

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://ollama:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen2.5:7b")


def calculate_age(birth_date_str: str) -> int:
    try:
        day, month, year = birth_date_str.split(".")
        born = date(int(year), int(month), int(day))
        today = date.today()
        age = today.year - born.year
        if (today.month, today.day) < (born.month, born.day):
            age -= 1
        return max(0, age)
    except Exception:
        return 0


def _build_prompt(sections: dict[str, str]) -> str:
    today = date.today().strftime("%d.%m.%Y")

    schema = json.dumps(
        {
            "firma": "Firmenname als String",
            "sitz": "Ort als String",
            "gegenstand": "2-3 Sätze Zusammenfassung des Unternehmensgegenstands auf Deutsch",
            "management": [
                {
                    "title": "Genaue Berufsbezeichnung z.B. Geschäftsführer / Vorstand / Komplementär",
                    "last_name": "Nachname",
                    "first_name": "Vorname",
                    "city": "Wohnort",
                    "birth_date": "TT.MM.JJJJ",
                    "age": 0,
                }
            ],
            "prokura": [
                {
                    "title": "Genaue Berufsbezeichnung z.B. Prokurist / Gesamtprokurist",
                    "last_name": "Nachname",
                    "first_name": "Vorname",
                    "city": "Wohnort",
                    "birth_date": "TT.MM.JJJJ",
                    "age": 0,
                }
            ],
        },
        ensure_ascii=False,
        indent=2,
    )

    sections_text = "\n\n".join(
        f"=== {name.upper()} ===\n{text}" for name, text in sections.items() if text
    )

    return f"""Du bist ein Experte für deutsche Handelsregisterdokumente. Heute ist der {today}.
Extrahiere die folgenden Felder aus dem Handelsregistereintrag und gib NUR gültiges JSON zurück.

{sections_text}

Gib exakt dieses JSON-Schema zurück (keine Erklärungen, kein Markdown, nur JSON):
{schema}

Wichtige Regeln:
- Geburtsdaten stehen nach einem * Zeichen im Format TT.MM.JJJJ
- Berechne das genaue Alter in vollen Jahren zum heutigen Datum ({today})
- "management" enthält ALLE leitenden Personen und Gesellschafter:
  * Natürliche Personen: Geschäftsführer, Vorstand, Inhaber, Komplementär, Vertretungsberechtigte
  * Auch aus Abschnitt 3b: Inhaber, persönlich haftende Gesellschafter
  * Juristische Personen als Gesellschafter (z.B. "Seitz Spedition Verwaltungs GmbH"):
    last_name = vollständiger Firmenname, first_name = "", birth_date = "", age = 0
- "prokura" enthält alle Personen mit Prokura (Prokurist, Gesamtprokurist, Einzelprokurist usw.)
- Das Feld "title" muss die GENAUE Bezeichnung aus dem Dokument enthalten
  (z.B. "Geschäftsführer", "Vorstand", "Persönlich haftender Gesellschafter", "Inhaber")
- Bei fehlenden Abschnitten: leeres Array []
- Bewahre deutsche Umlaute (ä, ö, ü, ß)
- Beim Gegenstand: fasse die Liste in 2-3 Sätzen zusammen
"""


def extract_with_llm(sections: dict[str, str]) -> CompanyExtraction:
    prompt = _build_prompt(sections)
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": {"temperature": 0.1, "num_ctx": 4096},
    }

    last_exc: Exception = RuntimeError("No attempts made")
    for attempt in range(3):
        try:
            response = httpx.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json=payload,
                timeout=300.0,  # 5 min — model load on first call can be slow
            )
            response.raise_for_status()
            raw_json = response.json().get("response", "{}")
            data = json.loads(raw_json)
            extraction = CompanyExtraction(**data)
            for person in extraction.management + extraction.prokura:
                if person.birth_date:
                    person.age = calculate_age(person.birth_date)
            return extraction
        except Exception as e:
            last_exc = e
            logging.getLogger(__name__).warning(f"LLM attempt {attempt + 1} failed: {e}")

    raise last_exc
