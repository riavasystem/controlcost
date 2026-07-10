import uuid

from pydantic import BaseModel, Field

from app.models.residente import TipoResidente


class ResidenteBase(BaseModel):
    nombre: str = Field(min_length=1, max_length=200)
    rut: str | None = Field(default=None, max_length=20)
    telefono: str | None = Field(default=None, max_length=30)
    tipo: TipoResidente


class ResidenteCreate(ResidenteBase):
    unidad_id: uuid.UUID


class ResidenteUpdate(ResidenteBase):
    unidad_id: uuid.UUID


class ResidenteOut(ResidenteBase):
    id: uuid.UUID
    unidad_id: uuid.UUID
    unidad_numero: str | None = None
    unidad_torre: str | None = None

    model_config = {"from_attributes": True}
