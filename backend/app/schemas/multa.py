import uuid
from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field


class MultaCreate(BaseModel):
    unidad_id: uuid.UUID
    motivo: str = Field(min_length=1, max_length=300)
    monto: Decimal = Field(gt=0)
    fecha: date


class MultaOut(BaseModel):
    id: uuid.UUID
    unidad_id: uuid.UUID
    unidad_numero: str
    unidad_torre: str | None = None
    motivo: str
    monto: Decimal
    fecha: date
    pagada: bool

    model_config = {"from_attributes": True}
