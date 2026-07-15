from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.finanza import MovimientoFinanciero, TipoMovimiento
from app.models.gasto_comun import CargoUnidad, PeriodoGastoComun
from app.models.guardia import TurnoGuardia
from app.models.pago import Pago
from app.models.proveedor import Proveedor
from app.models.residente import Residente
from app.models.unidad import Unidad
from app.models.usuario import UserRole, Usuario
from app.models.vehiculo import Vehiculo
from app.models.visita import Visita
from app.schemas.ley21442 import ResumenLey21442Out

router = APIRouter(prefix="/ley21442", tags=["ley21442"])


async def _count(db: AsyncSession, model, condominio_id) -> int:
    return await db.scalar(select(func.count()).select_from(model).where(model.condominio_id == condominio_id)) or 0


@router.get("/resumen", response_model=ResumenLey21442Out)
async def resumen_cumplimiento(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONTADOR)),
) -> ResumenLey21442Out:
    cero = Decimal("0.00")
    condominio_id = current_user.condominio_id

    total_residentes = await db.scalar(
        select(func.count())
        .select_from(Residente)
        .join(Unidad)
        .where(Unidad.condominio_id == condominio_id)
    ) or 0
    total_unidades = await _count(db, Unidad, condominio_id)
    periodos_gasto_comun = await _count(db, PeriodoGastoComun, condominio_id)

    result_recaudado = await db.execute(
        select(CargoUnidad.monto_total)
        .join(PeriodoGastoComun)
        .where(PeriodoGastoComun.condominio_id == condominio_id, CargoUnidad.pagado.is_(True))
    )
    total_recaudado = sum((m for m in result_recaudado.scalars().all()), cero)

    result_pendiente = await db.execute(
        select(CargoUnidad.monto_total)
        .join(PeriodoGastoComun)
        .where(PeriodoGastoComun.condominio_id == condominio_id, CargoUnidad.pagado.is_(False))
    )
    total_pendiente = sum((m for m in result_pendiente.scalars().all()), cero)

    result_pagos = await db.execute(
        select(Pago.monto).where(Pago.condominio_id == condominio_id, Pago.reversado.is_(False))
    )
    recaudado_pagos = sum((m for m in result_pagos.scalars().all()), cero)

    result_ingresos = await db.execute(
        select(MovimientoFinanciero.monto).where(
            MovimientoFinanciero.condominio_id == condominio_id, MovimientoFinanciero.tipo == TipoMovimiento.INGRESO
        )
    )
    total_ingresos = sum((m for m in result_ingresos.scalars().all()), cero)

    result_egresos = await db.execute(
        select(MovimientoFinanciero.monto).where(
            MovimientoFinanciero.condominio_id == condominio_id, MovimientoFinanciero.tipo == TipoMovimiento.EGRESO
        )
    )
    total_egresos = sum((m for m in result_egresos.scalars().all()), cero)

    balance = recaudado_pagos + total_ingresos - total_egresos

    total_visitas = await _count(db, Visita, condominio_id)
    total_vehiculos = await _count(db, Vehiculo, condominio_id)
    total_proveedores = await _count(db, Proveedor, condominio_id)
    total_turnos = await _count(db, TurnoGuardia, condominio_id)

    return ResumenLey21442Out(
        total_residentes=total_residentes,
        total_unidades=total_unidades,
        periodos_gasto_comun=periodos_gasto_comun,
        total_recaudado_historico=total_recaudado.quantize(Decimal("0.01")),
        total_pendiente_historico=total_pendiente.quantize(Decimal("0.01")),
        balance_financiero=balance.quantize(Decimal("0.01")),
        total_visitas_registradas=total_visitas,
        total_vehiculos_registrados=total_vehiculos,
        total_proveedores_registrados=total_proveedores,
        total_turnos_guardia=total_turnos,
    )
