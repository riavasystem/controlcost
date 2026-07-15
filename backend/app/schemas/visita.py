import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class VisitaCreate(BaseModel):
    unidad_id: uuid.UUID
    nombre_visitante: str = Field(min_length=1, max_length=200)
    rut_visitante: str | None = Field(default=None, max_length=20)


class VisitaOut(BaseModel):
    id: uuid.UUID
    unidad_id: uuid.UUID
    unidad_numero: str
    unidad_torre: str | None = None
    nombre_visitante: str
    rut_visitante: str | None
    hora_entrada: datetime
    hora_salida: datetime | None
    alerta: bool

    model_config = {"from_attributes": True}
