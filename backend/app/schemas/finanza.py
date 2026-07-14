import uuid
from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.finanza import TipoMovimiento


class MovimientoFinancieroCreate(BaseModel):
    tipo: TipoMovimiento
    categoria: str = Field(min_length=1, max_length=100)
    monto: Decimal = Field(gt=0)
    descripcion: str | None = Field(default=None, max_length=300)
    fecha: date


class MovimientoFinancieroOut(BaseModel):
    id: uuid.UUID
    tipo: TipoMovimiento
    categoria: str
    monto: Decimal
    descripcion: str | None
    fecha: date

    model_config = {"from_attributes": True}


class ResumenFinancieroOut(BaseModel):
    total_recaudado_gastos_comunes: Decimal
    total_ingresos_manuales: Decimal
    total_egresos: Decimal
    balance: Decimal
