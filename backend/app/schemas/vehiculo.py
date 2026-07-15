import uuid

from pydantic import BaseModel, Field


class VehiculoBase(BaseModel):
    unidad_id: uuid.UUID
    patente: str = Field(min_length=1, max_length=15)
    marca: str | None = Field(default=None, max_length=100)
    modelo: str | None = Field(default=None, max_length=100)
    color: str | None = Field(default=None, max_length=50)


class VehiculoCreate(VehiculoBase):
    pass


class VehiculoUpdate(VehiculoBase):
    pass


class VehiculoOut(BaseModel):
    id: uuid.UUID
    unidad_id: uuid.UUID
    unidad_numero: str
    unidad_torre: str | None = None
    patente: str
    marca: str | None
    modelo: str | None
    color: str | None

    model_config = {"from_attributes": True}
