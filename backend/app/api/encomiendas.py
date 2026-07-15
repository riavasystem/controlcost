import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.encomienda import Encomienda, EstadoEncomienda
from app.models.unidad import Unidad
from app.models.usuario import UserRole, Usuario
from app.schemas.encomienda import EncomiendaCreate, EncomiendaOut

router = APIRouter(prefix="/encomiendas", tags=["encomiendas"])


def _to_out(encomienda: Encomienda) -> EncomiendaOut:
    return EncomiendaOut(
        id=encomienda.id,
        unidad_id=encomienda.unidad_id,
        unidad_numero=encomienda.unidad.numero,
        unidad_torre=encomienda.unidad.torre,
        descripcion=encomienda.descripcion,
        estado=encomienda.estado,
        fecha_llegada=encomienda.fecha_llegada,
        fecha_retiro=encomienda.fecha_retiro,
        retirado_por=encomienda.retirado_por,
    )


@router.get("", response_model=list[EncomiendaOut])
async def listar_encomiendas(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONSERJE)),
) -> list[EncomiendaOut]:
    result = await db.execute(
        select(Encomienda)
        .options(joinedload(Encomienda.unidad))
        .where(Encomienda.condominio_id == current_user.condominio_id)
        .order_by(Encomienda.fecha_llegada.desc())
    )
    return [_to_out(e) for e in result.unique().scalars().all()]


async def _get_unidad_o_400(db: AsyncSession, unidad_id: uuid.UUID, condominio_id: uuid.UUID) -> Unidad:
    unidad = await db.scalar(select(Unidad).where(Unidad.id == unidad_id, Unidad.condominio_id == condominio_id))
    if unidad is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La unidad indicada no existe")
    return unidad


@router.post("", response_model=EncomiendaOut, status_code=status.HTTP_201_CREATED)
async def registrar_llegada(
    payload: EncomiendaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONSERJE)),
) -> EncomiendaOut:
    unidad = await _get_unidad_o_400(db, payload.unidad_id, current_user.condominio_id)

    encomienda = Encomienda(
        id=uuid.uuid4(),
        condominio_id=current_user.condominio_id,
        unidad_id=unidad.id,
        descripcion=payload.descripcion,
    )
    db.add(encomienda)
    await db.commit()
    await db.refresh(encomienda)
    encomienda.unidad = unidad
    return _to_out(encomienda)


async def _get_encomienda_o_404(db: AsyncSession, encomienda_id: uuid.UUID, condominio_id: uuid.UUID) -> Encomienda:
    result = await db.execute(
        select(Encomienda)
        .options(joinedload(Encomienda.unidad))
        .where(Encomienda.id == encomienda_id, Encomienda.condominio_id == condominio_id)
    )
    encomienda = result.unique().scalar_one_or_none()
    if encomienda is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Encomienda no encontrada")
    return encomienda


@router.patch("/{encomienda_id}/retiro", response_model=EncomiendaOut)
async def registrar_retiro(
    encomienda_id: uuid.UUID,
    retirado_por: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONSERJE)),
) -> EncomiendaOut:
    encomienda = await _get_encomienda_o_404(db, encomienda_id, current_user.condominio_id)
    if encomienda.estado == EstadoEncomienda.RETIRADO:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Esta encomienda ya fue retirada")

    encomienda.estado = EstadoEncomienda.RETIRADO
    encomienda.fecha_retiro = datetime.utcnow()
    encomienda.retirado_por = retirado_por
    await db.commit()
    return _to_out(await _get_encomienda_o_404(db, encomienda_id, current_user.condominio_id))


@router.delete("/{encomienda_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_encomienda(
    encomienda_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN)),
) -> None:
    encomienda = await _get_encomienda_o_404(db, encomienda_id, current_user.condominio_id)
    await db.delete(encomienda)
    await db.commit()
