from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import date, datetime
from uuid import UUID, uuid4
import re

class CINData(BaseModel):
    numero_cin: str = Field(..., description="12 chiffres", examples=["101234567890"])
    nom: str
    prenoms: str
    date_naissance: date
    lieu_naissance: str
    sexe: Literal["M", "F"] = "M"
    adresse: str
    date_emission: date
    lieu_emission: str
    profession: Optional[str] = None

    def normalized_cin(self) -> str:
        return re.sub(r'\s+', '', self.numero_cin)

class CINConfidence(BaseModel):
    numero_cin: float = Field(ge=0, le=1)
    nom: float = Field(ge=0, le=1)
    prenoms: float = Field(ge=0, le=1)
    date_naissance: float = Field(ge=0, le=1)
    lieu_naissance: float = Field(ge=0, le=1)
    adresse: float = Field(ge=0, le=1)
    global_score: float = Field(ge=0, le=1, alias="global")

    class Config:
        populate_by_name = True

class CINExtractionResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    lh_id: str
    data: CINData
    confidence: CINConfidence
    raw_text: str
    duplicate_of: Optional[str] = None
    duplicate_score: Optional[float] = None
    image_url: Optional[str] = None
    qr_data: str
    qr_image_base64: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CINCreateRequest(BaseModel):
    # Pour validation manuelle après OCR
    data: CINData
    image_url: Optional[str] = None
    raw_text: Optional[str] = None

class CINRecord(BaseModel):
    id: UUID
    lh_id: str
    data: CINData
    statut: Literal["pending", "validated", "duplicate", "archived"] = "pending"
    confidence: Optional[CINConfidence] = None
    image_front_url: Optional[str] = None
    qr_code_url: Optional[str] = None
    agent_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class DuplicateCheckResult(BaseModel):
    is_duplicate: bool
    score: float
    existing_id: Optional[str] = None
    existing_lh_id: Optional[str] = None
    message: str
