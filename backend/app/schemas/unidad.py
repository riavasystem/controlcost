import uuid
from decimal import Decimal

from pydantic import BaseModel, Field


class UnidadBase(BaseModel):
    numero: str = Field(min_length=1, max_length=20)
    torre: str | None = Field(default=None, max_length=100)
    metraje: Decimal | None = Field(default=None, gt=0)
    numero_bodega: str | None = Field(default=None, max_length=50)
    metraje_bodega: Decimal | None = Field(default=None, gt=0)


class UnidadCreate(UnidadBase):
    pass


class UnidadUpdate(UnidadBase):
    pass


class UnidadOut(UnidadBase):
    id: uuid.UUID
    condominio_id: uuid.UUID
    total_residentes: int = 0

    model_config = {"from_attributes": True}
