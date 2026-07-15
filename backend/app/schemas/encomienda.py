import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.encomienda import EstadoEncomienda


class EncomiendaCreate(BaseModel):
    unidad_id: uuid.UUID
    descripcion: str = Field(min_length=1, max_length=300)


class EncomiendaOut(BaseModel):
    id: uuid.UUID
    unidad_id: uuid.UUID
    unidad_numero: str
    unidad_torre: str | None = None
    descripcion: str
    estado: EstadoEncomienda
    fecha_llegada: datetime
    fecha_retiro: datetime | None
    retirado_por: str | None

    model_config = {"from_attributes": True}
