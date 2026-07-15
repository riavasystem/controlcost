import uuid

from pydantic import BaseModel, Field


class ProveedorBase(BaseModel):
    nombre_empresa: str = Field(min_length=1, max_length=200)
    rubro: str = Field(min_length=1, max_length=100)
    contacto_nombre: str | None = Field(default=None, max_length=200)
    telefono: str | None = Field(default=None, max_length=30)
    email: str | None = Field(default=None, max_length=255)


class ProveedorCreate(ProveedorBase):
    pass


class ProveedorUpdate(ProveedorBase):
    pass


class ProveedorOut(ProveedorBase):
    id: uuid.UUID

    model_config = {"from_attributes": True}
