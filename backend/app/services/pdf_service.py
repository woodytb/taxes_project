import hashlib
import re
import pdfplumber


def extract_text(pdf_path: str) -> str:
    pages = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text(layout=True) or ""
            pages.append(text)
    return "\n\n".join(pages)


def clean_text(text: str) -> str:
    text = re.sub(r"Seite \d+ von \d+.*?\n", "", text)
    text = re.sub(r"Wiedergabe des aktuellen Registerinhalts.*?\n", "", text)
    text = re.sub(r"Abruf vom.*?\n", "", text)
    text = re.sub(r" {2,}", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _find_section(text: str, start_pattern: str, end_patterns: list[str]) -> str:
    start_match = re.search(start_pattern, text, re.IGNORECASE | re.MULTILINE)
    if not start_match:
        return ""
    start_pos = start_match.end()
    end_pos = len(text)
    for ep in end_patterns:
        end_match = re.search(ep, text[start_pos:], re.IGNORECASE | re.MULTILINE)
        if end_match:
            end_pos = min(end_pos, start_pos + end_match.start())
    return text[start_pos:end_pos].strip()


def _extract_person_blocks(text: str) -> str:
    """
    Collect lines with birth dates (*DD.MM.YYYY) plus 6 lines of context before each.
    Catches natural persons regardless of document type or section numbering.
    """
    lines = text.split("\n")
    collected: set[int] = set()

    for i, line in enumerate(lines):
        if re.search(r"\*\s*\d{2}\.\d{2}\.\d{4}", line):
            for j in range(max(0, i - 6), i + 1):
                collected.add(j)

    if not collected:
        return ""

    result: list[str] = []
    prev: int | None = None
    for idx in sorted(collected):
        if prev is not None and idx > prev + 1:
            result.append("---")
        result.append(lines[idx])
        prev = idx

    return "\n".join(result)


def extract_sections(pdf_path: str) -> dict[str, str]:
    raw = extract_text(pdf_path)
    text = clean_text(raw)

    sections: dict[str, str] = {}

    sections["firma"] = _find_section(
        text, r"\b2\s*[.)]?\s*a\b", [r"\b2\s*[.)]?\s*b\b", r"\b3\b"]
    )
    sections["sitz"] = _find_section(
        text, r"\b2\s*[.)]?\s*b\b", [r"\b2\s*[.)]?\s*c\b", r"\b3\b"]
    )
    sections["gegenstand"] = _find_section(
        text, r"\b2\s*[.)]?\s*c\b", [r"\b3\b", r"\b4\b"]
    )

    # Natural persons (birth date pattern) — works for HRB, GnR
    sections["personen"] = _extract_person_blocks(text)

    # Section 3b: HRA documents (KG) list management here — may include
    # legal entities as partners (no birth date), e.g. "persönlich haftender Gesellschafter"
    sections["abschnitt_3b"] = _find_section(
        text,
        r"\b3\s*[.)]?\s*b\b",
        [r"\b3\s*[.)]?\s*c\b", r"\b4\b"],
    )

    return sections


def compute_hash(pdf_path: str) -> str:
    with pdfplumber.open(pdf_path) as pdf:
        pages = [page.extract_text() or "" for page in pdf.pages]
    full_text = "\n".join(pages)
    return hashlib.sha256(full_text.encode("utf-8")).hexdigest()
