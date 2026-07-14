import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.finanza import MovimientoFinanciero, TipoMovimiento
from app.models.multa import Multa
from app.models.unidad import Unidad
from app.models.usuario import UserRole, Usuario
from app.schemas.multa import MultaCreate, MultaOut

router = APIRouter(prefix="/multas", tags=["multas"])


def _to_out(multa: Multa) -> MultaOut:
    return MultaOut(
        id=multa.id,
        unidad_id=multa.unidad_id,
        unidad_numero=multa.unidad.numero,
        unidad_torre=multa.unidad.torre,
        motivo=multa.motivo,
        monto=multa.monto,
        fecha=multa.fecha,
        pagada=multa.pagada,
    )


@router.get("", response_model=list[MultaOut])
async def listar_multas(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONTADOR, UserRole.CONSERJE)),
) -> list[MultaOut]:
    result = await db.execute(
        select(Multa)
        .options(joinedload(Multa.unidad))
        .where(Multa.condominio_id == current_user.condominio_id)
        .order_by(Multa.fecha.desc(), Multa.created_at.desc())
    )
    return [_to_out(m) for m in result.unique().scalars().all()]


async def _get_unidad_o_400(db: AsyncSession, unidad_id: uuid.UUID, condominio_id: uuid.UUID) -> Unidad:
    unidad = await db.scalar(select(Unidad).where(Unidad.id == unidad_id, Unidad.condominio_id == condominio_id))
    if unidad is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La unidad indicada no existe")
    return unidad


@router.post("", response_model=MultaOut, status_code=status.HTTP_201_CREATED)
async def crear_multa(
    payload: MultaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONSERJE)),
) -> MultaOut:
    unidad = await _get_unidad_o_400(db, payload.unidad_id, current_user.condominio_id)

    movimiento = MovimientoFinanciero(
        id=uuid.uuid4(),
        condominio_id=current_user.condominio_id,
        tipo=TipoMovimiento.INGRESO,
        categoria="Multas",
        monto=payload.monto,
        descripcion=f"Multa unidad {unidad.numero}: {payload.motivo}",
        fecha=payload.fecha,
    )
    db.add(movimiento)
    await db.flush()

    multa = Multa(
        id=uuid.uuid4(),
        condominio_id=current_user.condominio_id,
        unidad_id=unidad.id,
        movimiento_id=movimiento.id,
        motivo=payload.motivo,
        monto=payload.monto,
        fecha=payload.fecha,
        pagada=False,
    )
    db.add(multa)
    await db.commit()
    multa.unidad = unidad
    return _to_out(multa)


async def _get_multa_o_404(db: AsyncSession, multa_id: uuid.UUID, condominio_id: uuid.UUID) -> Multa:
    result = await db.execute(
        select(Multa)
        .options(joinedload(Multa.unidad))
        .where(Multa.id == multa_id, Multa.condominio_id == condominio_id)
    )
    multa = result.unique().scalar_one_or_none()
    if multa is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Multa no encontrada")
    return multa


@router.patch("/{multa_id}", response_model=MultaOut)
async def actualizar_estado_multa(
    multa_id: uuid.UUID,
    pagada: bool,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONTADOR)),
) -> MultaOut:
    multa = await _get_multa_o_404(db, multa_id, current_user.condominio_id)
    multa.pagada = pagada
    await db.commit()
    return _to_out(await _get_multa_o_404(db, multa_id, current_user.condominio_id))


@router.delete("/{multa_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_multa(
    multa_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN)),
) -> None:
    multa = await _get_multa_o_404(db, multa_id, current_user.condominio_id)
    movimiento = await db.get(MovimientoFinanciero, multa.movimiento_id)
    if movimiento is not None:
        await db.delete(movimiento)
    else:
        await db.delete(multa)
    await db.commit()
