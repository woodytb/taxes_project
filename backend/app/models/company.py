from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    firma = Column(String(500), nullable=False)
    sitz = Column(String(255))
    gegenstand = Column(Text)
    source_file = Column(String(500), nullable=False)
    raw_text_hash = Column(String(64), unique=True, nullable=False)
    extracted_at = Column(DateTime(timezone=True), server_default=func.now())

    persons = relationship("Person", back_populates="company", cascade="all, delete-orphan")


class Person(Base):
    __tablename__ = "persons"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), nullable=False)  # 'vorstand' or 'prokura'
    last_name = Column(String(255))
    first_name = Column(String(255))
    city = Column(String(255))
    birth_date = Column(Date)
    age = Column(Integer)

    company = relationship("Company", back_populates="persons")
