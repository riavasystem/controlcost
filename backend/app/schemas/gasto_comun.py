import uuid
from decimal import Decimal

from pydantic import BaseModel, Field


class PeriodoGastoComunCreate(BaseModel):
    anio: int = Field(ge=2020, le=2100)
    mes: int = Field(ge=1, le=12)
    tarifa_m2: Decimal = Field(gt=0)
    extraordinario: Decimal = Field(default=Decimal("0"), ge=0)
    extraordinario_torre: str | None = Field(default=None, max_length=100)
    considerar_bodega: bool = Field(default=False)
    descripcion: str | None = Field(default=None, max_length=300)


class CargoUnidadOut(BaseModel):
    id: uuid.UUID
    unidad_id: uuid.UUID
    unidad_numero: str
    unidad_torre: str | None = None
    monto_base: Decimal
    monto_extraordinario: Decimal
    monto_total: Decimal
    pagado: bool

    model_config = {"from_attributes": True}


class PeriodoGastoComunOut(BaseModel):
    id: uuid.UUID
    condominio_id: uuid.UUID
    anio: int
    mes: int
    tarifa_m2: Decimal
    extraordinario: Decimal
    extraordinario_torre: str | None
    considerar_bodega: bool
    descripcion: str | None
    total_unidades: int
    total_recaudado: Decimal
    total_pendiente: Decimal

    model_config = {"from_attributes": True}


class PeriodoGastoComunDetalleOut(PeriodoGastoComunOut):
    cargos: list[CargoUnidadOut]
