import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.finanza import MovimientoFinanciero, TipoMovimiento
from app.models.pago import Pago
from app.models.usuario import UserRole, Usuario
from app.schemas.finanza import MovimientoFinancieroCreate, MovimientoFinancieroOut, ResumenFinancieroOut

router = APIRouter(prefix="/finanzas", tags=["finanzas"])


@router.get("/movimientos", response_model=list[MovimientoFinancieroOut])
async def listar_movimientos(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONTADOR)),
) -> list[MovimientoFinancieroOut]:
    result = await db.execute(
        select(MovimientoFinanciero)
        .where(MovimientoFinanciero.condominio_id == current_user.condominio_id)
        .order_by(MovimientoFinanciero.fecha.desc(), MovimientoFinanciero.created_at.desc())
    )
    return list(result.scalars().all())


@router.post("/movimientos", response_model=MovimientoFinancieroOut, status_code=status.HTTP_201_CREATED)
async def crear_movimiento(
    payload: MovimientoFinancieroCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONTADOR)),
) -> MovimientoFinancieroOut:
    movimiento = MovimientoFinanciero(
        id=uuid.uuid4(), condominio_id=current_user.condominio_id, **payload.model_dump()
    )
    db.add(movimiento)
    await db.commit()
    await db.refresh(movimiento)
    return movimiento


async def _get_movimiento_o_404(
    db: AsyncSession, movimiento_id: uuid.UUID, condominio_id: uuid.UUID
) -> MovimientoFinanciero:
    movimiento = await db.scalar(
        select(MovimientoFinanciero).where(
            MovimientoFinanciero.id == movimiento_id, MovimientoFinanciero.condominio_id == condominio_id
        )
    )
    if movimiento is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movimiento no encontrado")
    return movimiento


@router.delete("/movimientos/{movimiento_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_movimiento(
    movimiento_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN)),
) -> None:
    movimiento = await _get_movimiento_o_404(db, movimiento_id, current_user.condominio_id)
    await db.delete(movimiento)
    await db.commit()


@router.get("/resumen", response_model=ResumenFinancieroOut)
async def resumen_financiero(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONTADOR)),
) -> ResumenFinancieroOut:
    cero = Decimal("0.00")

    result_pagos = await db.execute(
        select(Pago.monto).where(Pago.condominio_id == current_user.condominio_id, Pago.reversado.is_(False))
    )
    total_recaudado = sum((m for m in result_pagos.scalars().all()), cero)

    result_ingresos = await db.execute(
        select(MovimientoFinanciero.monto).where(
            MovimientoFinanciero.condominio_id == current_user.condominio_id,
            MovimientoFinanciero.tipo == TipoMovimiento.INGRESO,
        )
    )
    total_ingresos = sum((m for m in result_ingresos.scalars().all()), cero)

    result_egresos = await db.execute(
        select(MovimientoFinanciero.monto).where(
            MovimientoFinanciero.condominio_id == current_user.condominio_id,
            MovimientoFinanciero.tipo == TipoMovimiento.EGRESO,
        )
    )
    total_egresos = sum((m for m in result_egresos.scalars().all()), cero)

    balance = total_recaudado + total_ingresos - total_egresos

    return ResumenFinancieroOut(
        total_recaudado_gastos_comunes=total_recaudado.quantize(Decimal("0.01")),
        total_ingresos_manuales=total_ingresos.quantize(Decimal("0.01")),
        total_egresos=total_egresos.quantize(Decimal("0.01")),
        balance=balance.quantize(Decimal("0.01")),
    )
