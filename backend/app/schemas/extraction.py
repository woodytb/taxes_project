from datetime import date
from typing import Optional
from pydantic import BaseModel


class PersonExtraction(BaseModel):
    title: str = ""          # Actual German title: Geschäftsführer, Vorstand, Prokurist, etc.
    last_name: str = ""      # For legal entities: full entity name goes here
    first_name: str = ""     # Empty for legal entities
    city: str = ""
    birth_date: str = ""     # DD.MM.YYYY — empty for legal entities (GmbH, KG, etc.)
    age: int = 0             # 0 for legal entities


class CompanyExtraction(BaseModel):
    firma: str
    sitz: str = ""
    gegenstand: str = ""
    management: list[PersonExtraction] = []   # Geschäftsführer, Vorstand, Komplementär, etc.
    prokura: list[PersonExtraction] = []       # Prokuristen


class PersonOut(BaseModel):
    id: int
    role: str
    last_name: str
    first_name: str
    city: str
    birth_date: Optional[date]
    age: Optional[int]

    model_config = {"from_attributes": True}


class AttentionPerson(BaseModel):
    title: str
    first_name: str
    last_name: str
    age: int


class CompanyOut(BaseModel):
    id: int
    firma: str
    sitz: str
    gegenstand: str
    source_file: str
    extracted_at: Optional[str]
    management_count: int = 0
    prokura_count: int = 0
    needs_attention: bool = False
    attention_person: Optional[AttentionPerson] = None

    model_config = {"from_attributes": True}


class CompanyDetail(CompanyOut):
    persons: list[PersonOut] = []

    model_config = {"from_attributes": True}
