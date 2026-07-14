import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.gasto_comun import CargoUnidad, PeriodoGastoComun
from app.models.unidad import Unidad
from app.models.usuario import UserRole, Usuario
from app.schemas.gasto_comun import (
    CargoUnidadOut,
    PeriodoGastoComunCreate,
    PeriodoGastoComunDetalleOut,
    PeriodoGastoComunOut,
)

router = APIRouter(prefix="/gastos-comunes", tags=["gastos-comunes"])


def _cargo_to_out(cargo: CargoUnidad) -> CargoUnidadOut:
    return CargoUnidadOut(
        id=cargo.id,
        unidad_id=cargo.unidad_id,
        unidad_numero=cargo.unidad.numero,
        unidad_torre=cargo.unidad.torre,
        monto_base=cargo.monto_base,
        monto_extraordinario=cargo.monto_extraordinario,
        monto_total=cargo.monto_total,
        pagado=cargo.pagado,
    )


def _periodo_to_out(periodo: PeriodoGastoComun) -> PeriodoGastoComunOut:
    cero = Decimal("0.00")
    total_recaudado = sum((c.monto_total for c in periodo.cargos if c.pagado), cero).quantize(Decimal("0.01"))
    total_pendiente = sum((c.monto_total for c in periodo.cargos if not c.pagado), cero).quantize(Decimal("0.01"))
    return PeriodoGastoComunOut(
        id=periodo.id,
        condominio_id=periodo.condominio_id,
        anio=periodo.anio,
        mes=periodo.mes,
        tarifa_m2=periodo.tarifa_m2,
        extraordinario=periodo.extraordinario,
        descripcion=periodo.descripcion,
        total_unidades=len(periodo.cargos),
        total_recaudado=total_recaudado,
        total_pendiente=total_pendiente,
    )


async def _get_periodo_o_404(db: AsyncSession, periodo_id: uuid.UUID, condominio_id: uuid.UUID) -> PeriodoGastoComun:
    result = await db.execute(
        select(PeriodoGastoComun)
        .options(joinedload(PeriodoGastoComun.cargos).joinedload(CargoUnidad.unidad))
        .where(PeriodoGastoComun.id == periodo_id, PeriodoGastoComun.condominio_id == condominio_id)
    )
    periodo = result.unique().scalar_one_or_none()
    if periodo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Período no encontrado")
    return periodo


@router.get("", response_model=list[PeriodoGastoComunOut])
async def listar_periodos(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONTADOR)),
) -> list[PeriodoGastoComunOut]:
    result = await db.execute(
        select(PeriodoGastoComun)
        .options(joinedload(PeriodoGastoComun.cargos))
        .where(PeriodoGastoComun.condominio_id == current_user.condominio_id)
        .order_by(PeriodoGastoComun.anio.desc(), PeriodoGastoComun.mes.desc())
    )
    periodos = result.unique().scalars().all()
    return [_periodo_to_out(p) for p in periodos]


@router.post("", response_model=PeriodoGastoComunDetalleOut, status_code=status.HTTP_201_CREATED)
async def crear_periodo(
    payload: PeriodoGastoComunCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN)),
) -> PeriodoGastoComunDetalleOut:
    existente = await db.scalar(
        select(PeriodoGastoComun).where(
            PeriodoGastoComun.condominio_id == current_user.condominio_id,
            PeriodoGastoComun.anio == payload.anio,
            PeriodoGastoComun.mes == payload.mes,
        )
    )
    if existente is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ya existe un período para ese mes/año")

    unidades = (
        (
            await db.execute(
                select(Unidad).where(Unidad.condominio_id == current_user.condominio_id).order_by(Unidad.numero)
            )
        )
        .scalars()
        .all()
    )
    if not unidades:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay unidades registradas para generar los cargos",
        )

    periodo = PeriodoGastoComun(
        id=uuid.uuid4(),
        condominio_id=current_user.condominio_id,
        anio=payload.anio,
        mes=payload.mes,
        tarifa_m2=payload.tarifa_m2,
        extraordinario=payload.extraordinario,
        descripcion=payload.descripcion,
    )
    db.add(periodo)

    for unidad in unidades:
        metraje = unidad.metraje or Decimal("0")
        monto_base = (payload.tarifa_m2 * Decimal(metraje)).quantize(Decimal("0.01"))
        monto_total = monto_base + payload.extraordinario
        db.add(
            CargoUnidad(
                id=uuid.uuid4(),
                periodo_id=periodo.id,
                unidad_id=unidad.id,
                monto_base=monto_base,
                monto_extraordinario=payload.extraordinario,
                monto_total=monto_total,
                pagado=False,
            )
        )

    await db.commit()
    creado = await _get_periodo_o_404(db, periodo.id, current_user.condominio_id)
    base = _periodo_to_out(creado)
    return PeriodoGastoComunDetalleOut(**base.model_dump(), cargos=_cargos_detalle(creado))


def _cargos_detalle(periodo: PeriodoGastoComun) -> list[CargoUnidadOut]:
    return [_cargo_to_out(c) for c in periodo.cargos]


@router.get("/{periodo_id}", response_model=PeriodoGastoComunDetalleOut)
async def obtener_periodo(
    periodo_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONTADOR)),
) -> PeriodoGastoComunDetalleOut:
    periodo = await _get_periodo_o_404(db, periodo_id, current_user.condominio_id)
    base = _periodo_to_out(periodo)
    return PeriodoGastoComunDetalleOut(**base.model_dump(), cargos=_cargos_detalle(periodo))


@router.delete("/{periodo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_periodo(
    periodo_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN)),
) -> None:
    periodo = await _get_periodo_o_404(db, periodo_id, current_user.condominio_id)
    if any(c.pagado for c in periodo.cargos):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se puede eliminar un período que tiene cargos pagados",
        )
    await db.delete(periodo)
    await db.commit()


@router.patch("/{periodo_id}/cargos/{cargo_id}", response_model=CargoUnidadOut)
async def actualizar_estado_cargo(
    periodo_id: uuid.UUID,
    cargo_id: uuid.UUID,
    pagado: bool,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONTADOR)),
) -> CargoUnidadOut:
    periodo = await _get_periodo_o_404(db, periodo_id, current_user.condominio_id)
    cargo = next((c for c in periodo.cargos if c.id == cargo_id), None)
    if cargo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cargo no encontrado")

    cargo.pagado = pagado
    await db.commit()

    periodo = await _get_periodo_o_404(db, periodo_id, current_user.condominio_id)
    cargo = next(c for c in periodo.cargos if c.id == cargo_id)
    return _cargo_to_out(cargo)
