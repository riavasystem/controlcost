import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.gasto_comun import CargoUnidad, PeriodoGastoComun
from app.models.pago import Pago
from app.models.usuario import UserRole, Usuario
from app.schemas.pago import CargoPendienteOut, PagoCreate, PagoOut

router = APIRouter(prefix="/pagos", tags=["pagos"])


def _pago_to_out(pago: Pago) -> PagoOut:
    return PagoOut(
        id=pago.id,
        cargo_id=pago.cargo_id,
        unidad_numero=pago.cargo.unidad.numero,
        unidad_torre=pago.cargo.unidad.torre,
        periodo_anio=pago.cargo.periodo.anio,
        periodo_mes=pago.cargo.periodo.mes,
        monto=pago.monto,
        metodo=pago.metodo,
        fecha_pago=pago.fecha_pago,
        reversado=pago.reversado,
    )


def _cargo_to_pendiente_out(cargo: CargoUnidad) -> CargoPendienteOut:
    return CargoPendienteOut(
        id=cargo.id,
        periodo_id=cargo.periodo_id,
        periodo_anio=cargo.periodo.anio,
        periodo_mes=cargo.periodo.mes,
        unidad_id=cargo.unidad_id,
        unidad_numero=cargo.unidad.numero,
        unidad_torre=cargo.unidad.torre,
        monto_total=cargo.monto_total,
    )


@router.get("/cargos-pendientes", response_model=list[CargoPendienteOut])
async def listar_cargos_pendientes(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONTADOR)),
) -> list[CargoPendienteOut]:
    result = await db.execute(
        select(CargoUnidad)
        .join(PeriodoGastoComun)
        .options(joinedload(CargoUnidad.unidad), joinedload(CargoUnidad.periodo))
        .where(PeriodoGastoComun.condominio_id == current_user.condominio_id, CargoUnidad.pagado.is_(False))
        .order_by(PeriodoGastoComun.anio.desc(), PeriodoGastoComun.mes.desc(), CargoUnidad.id)
    )
    cargos = result.unique().scalars().all()
    return [_cargo_to_pendiente_out(c) for c in cargos]


@router.get("", response_model=list[PagoOut])
async def listar_pagos(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONTADOR)),
) -> list[PagoOut]:
    result = await db.execute(
        select(Pago)
        .options(
            joinedload(Pago.cargo).joinedload(CargoUnidad.unidad),
            joinedload(Pago.cargo).joinedload(CargoUnidad.periodo),
        )
        .where(Pago.condominio_id == current_user.condominio_id)
        .order_by(Pago.created_at.desc())
    )
    pagos = result.unique().scalars().all()
    return [_pago_to_out(p) for p in pagos]


async def _get_cargo_o_400(db: AsyncSession, cargo_id: uuid.UUID, condominio_id: uuid.UUID) -> CargoUnidad:
    result = await db.execute(
        select(CargoUnidad)
        .join(PeriodoGastoComun)
        .options(joinedload(CargoUnidad.unidad), joinedload(CargoUnidad.periodo))
        .where(CargoUnidad.id == cargo_id, PeriodoGastoComun.condominio_id == condominio_id)
    )
    cargo = result.unique().scalar_one_or_none()
    if cargo is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El cargo indicado no existe")
    return cargo


@router.post("", response_model=PagoOut, status_code=status.HTTP_201_CREATED)
async def registrar_pago(
    payload: PagoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONTADOR)),
) -> PagoOut:
    cargo = await _get_cargo_o_400(db, payload.cargo_id, current_user.condominio_id)
    if cargo.pagado:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Este cargo ya fue pagado")

    pago = Pago(
        id=uuid.uuid4(),
        condominio_id=current_user.condominio_id,
        cargo_id=cargo.id,
        monto=payload.monto,
        metodo=payload.metodo,
        fecha_pago=payload.fecha_pago,
        reversado=False,
    )
    db.add(pago)
    cargo.pagado = True

    await db.commit()
    pago.cargo = cargo
    return _pago_to_out(pago)


async def _get_pago_o_404(db: AsyncSession, pago_id: uuid.UUID, condominio_id: uuid.UUID) -> Pago:
    result = await db.execute(
        select(Pago)
        .options(
            joinedload(Pago.cargo).joinedload(CargoUnidad.unidad),
            joinedload(Pago.cargo).joinedload(CargoUnidad.periodo),
        )
        .where(Pago.id == pago_id, Pago.condominio_id == condominio_id)
    )
    pago = result.unique().scalar_one_or_none()
    if pago is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pago no encontrado")
    return pago


@router.post("/{pago_id}/revertir", response_model=PagoOut)
async def revertir_pago(
    pago_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN)),
) -> PagoOut:
    pago = await _get_pago_o_404(db, pago_id, current_user.condominio_id)
    if pago.reversado:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Este pago ya fue reversado")

    pago.reversado = True
    pago.cargo.pagado = False
    await db.commit()

    pago = await _get_pago_o_404(db, pago_id, current_user.condominio_id)
    return _pago_to_out(pago)
