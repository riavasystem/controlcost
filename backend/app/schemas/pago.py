import uuid
from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.pago import MetodoPago


class PagoCreate(BaseModel):
    cargo_id: uuid.UUID
    monto: Decimal = Field(gt=0)
    metodo: MetodoPago
    fecha_pago: date


class PagoOut(BaseModel):
    id: uuid.UUID
    cargo_id: uuid.UUID
    unidad_numero: str
    unidad_torre: str | None = None
    periodo_anio: int
    periodo_mes: int
    monto: Decimal
    metodo: MetodoPago
    fecha_pago: date
    reversado: bool

    model_config = {"from_attributes": True}


class CargoPendienteOut(BaseModel):
    id: uuid.UUID
    periodo_id: uuid.UUID
    periodo_anio: int
    periodo_mes: int
    unidad_id: uuid.UUID
    unidad_numero: str
    unidad_torre: str | None = None
    monto_total: Decimal

    model_config = {"from_attributes": True}
