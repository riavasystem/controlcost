import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.unidad import Unidad
from app.models.usuario import UserRole, Usuario
from app.models.visita import Visita
from app.schemas.visita import VisitaCreate, VisitaOut

router = APIRouter(prefix="/visitas", tags=["visitas"])

LIMITE_ALERTA = timedelta(hours=8)


def _to_out(visita: Visita) -> VisitaOut:
    referencia = visita.hora_salida or datetime.utcnow()
    alerta = (referencia - visita.hora_entrada) > LIMITE_ALERTA
    return VisitaOut(
        id=visita.id,
        unidad_id=visita.unidad_id,
        unidad_numero=visita.unidad.numero,
        unidad_torre=visita.unidad.torre,
        nombre_visitante=visita.nombre_visitante,
        rut_visitante=visita.rut_visitante,
        numero_estacionamiento=visita.numero_estacionamiento,
        hora_entrada=visita.hora_entrada,
        hora_salida=visita.hora_salida,
        alerta=alerta,
    )


@router.get("", response_model=list[VisitaOut])
async def listar_visitas(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONSERJE)),
) -> list[VisitaOut]:
    result = await db.execute(
        select(Visita)
        .options(joinedload(Visita.unidad))
        .where(Visita.condominio_id == current_user.condominio_id)
        .order_by(Visita.hora_entrada.desc())
    )
    return [_to_out(v) for v in result.unique().scalars().all()]


async def _get_unidad_o_400(db: AsyncSession, unidad_id: uuid.UUID, condominio_id: uuid.UUID) -> Unidad:
    unidad = await db.scalar(select(Unidad).where(Unidad.id == unidad_id, Unidad.condominio_id == condominio_id))
    if unidad is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La unidad indicada no existe")
    return unidad


@router.post("", response_model=VisitaOut, status_code=status.HTTP_201_CREATED)
async def registrar_entrada(
    payload: VisitaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONSERJE)),
) -> VisitaOut:
    unidad = await _get_unidad_o_400(db, payload.unidad_id, current_user.condominio_id)

    visita = Visita(
        id=uuid.uuid4(),
        condominio_id=current_user.condominio_id,
        unidad_id=unidad.id,
        nombre_visitante=payload.nombre_visitante,
        rut_visitante=payload.rut_visitante,
        numero_estacionamiento=payload.numero_estacionamiento,
    )
    db.add(visita)
    await db.commit()
    await db.refresh(visita)
    visita.unidad = unidad
    return _to_out(visita)


async def _get_visita_o_404(db: AsyncSession, visita_id: uuid.UUID, condominio_id: uuid.UUID) -> Visita:
    result = await db.execute(
        select(Visita)
        .options(joinedload(Visita.unidad))
        .where(Visita.id == visita_id, Visita.condominio_id == condominio_id)
    )
    visita = result.unique().scalar_one_or_none()
    if visita is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visita no encontrada")
    return visita


@router.patch("/{visita_id}/salida", response_model=VisitaOut)
async def registrar_salida(
    visita_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONSERJE)),
) -> VisitaOut:
    visita = await _get_visita_o_404(db, visita_id, current_user.condominio_id)
    if visita.hora_salida is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Esta visita ya registró su salida")

    visita.hora_salida = datetime.utcnow()
    await db.commit()
    return _to_out(await _get_visita_o_404(db, visita_id, current_user.condominio_id))


@router.delete("/{visita_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_visita(
    visita_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN)),
) -> None:
    visita = await _get_visita_o_404(db, visita_id, current_user.condominio_id)
    await db.delete(visita)
    await db.commit()
