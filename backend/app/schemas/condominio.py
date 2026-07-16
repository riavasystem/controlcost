import uuid

from pydantic import BaseModel, Field


class CondominioUpdate(BaseModel):
    nombre: str = Field(min_length=1, max_length=200)
    rut: str | None = Field(default=None, max_length=20)
    direccion: str | None = Field(default=None, max_length=300)
    comuna: str | None = Field(default=None, max_length=100)
    ciudad: str | None = Field(default=None, max_length=100)
    estacionamientos_visita: int | None = Field(default=None, ge=0)
    estacionamientos_discapacitados: int | None = Field(default=None, ge=0)


class CondominioOut(BaseModel):
    id: uuid.UUID
    nombre: str
    rut: str | None
    direccion: str | None
    comuna: str | None
    ciudad: str | None
    imagen_url: str | None
    estacionamientos_visita: int | None
    estacionamientos_discapacitados: int | None

    model_config = {"from_attributes": True}
