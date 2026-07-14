import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.comunicado import PrioridadComunicado


class ComunicadoCreate(BaseModel):
    titulo: str = Field(min_length=1, max_length=200)
    contenido: str = Field(min_length=1)
    prioridad: PrioridadComunicado = PrioridadComunicado.NORMAL


class ComunicadoOut(BaseModel):
    id: uuid.UUID
    titulo: str
    contenido: str
    prioridad: PrioridadComunicado
    autor_nombre: str
    created_at: datetime

    model_config = {"from_attributes": True}
