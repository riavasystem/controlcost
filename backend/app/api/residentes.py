import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.residente import Residente
from app.models.unidad import Unidad
from app.models.usuario import UserRole, Usuario
from app.schemas.residente import ResidenteCreate, ResidenteOut, ResidenteUpdate

router = APIRouter(prefix="/residentes", tags=["residentes"])


def _to_out(residente: Residente) -> ResidenteOut:
    return ResidenteOut(
        id=residente.id,
        unidad_id=residente.unidad_id,
        nombre=residente.nombre,
        apellido=residente.apellido,
        rut=residente.rut,
        telefono=residente.telefono,
        email=residente.email,
        numero_estacionamiento=residente.numero_estacionamiento,
        tipo=residente.tipo,
        unidad_numero=residente.unidad.numero if residente.unidad else None,
        unidad_torre=residente.unidad.torre if residente.unidad else None,
        unidad_numero_bodega=residente.unidad.numero_bodega if residente.unidad else None,
    )


async def _get_unidad_del_condominio(db: AsyncSession, unidad_id: uuid.UUID, condominio_id: uuid.UUID) -> Unidad:
    unidad = await db.scalar(select(Unidad).where(Unidad.id == unidad_id, Unidad.condominio_id == condominio_id))
    if unidad is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La unidad indicada no existe")
    return unidad


@router.get("", response_model=list[ResidenteOut])
async def listar_residentes(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONTADOR, UserRole.CONSERJE)),
) -> list[ResidenteOut]:
    result = await db.execute(
        select(Residente)
        .join(Unidad)
        .options(joinedload(Residente.unidad))
        .where(Unidad.condominio_id == current_user.condominio_id)
        .order_by(Unidad.numero, Residente.nombre)
    )
    return [_to_out(r) for r in result.scalars().unique().all()]


@router.post("", response_model=ResidenteOut, status_code=status.HTTP_201_CREATED)
async def crear_residente(
    payload: ResidenteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN)),
) -> ResidenteOut:
    unidad = await _get_unidad_del_condominio(db, payload.unidad_id, current_user.condominio_id)

    residente = Residente(id=uuid.uuid4(), **payload.model_dump())
    db.add(residente)
    await db.commit()
    residente.unidad = unidad
    return _to_out(residente)


async def _get_residente_o_404(db: AsyncSession, residente_id: uuid.UUID, condominio_id: uuid.UUID) -> Residente:
    result = await db.execute(
        select(Residente)
        .join(Unidad)
        .options(joinedload(Residente.unidad))
        .where(Residente.id == residente_id, Unidad.condominio_id == condominio_id)
    )
    residente = result.unique().scalar_one_or_none()
    if residente is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Residente no encontrado")
    return residente


@router.put("/{residente_id}", response_model=ResidenteOut)
async def actualizar_residente(
    residente_id: uuid.UUID,
    payload: ResidenteUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN)),
) -> ResidenteOut:
    residente = await _get_residente_o_404(db, residente_id, current_user.condominio_id)
    unidad = await _get_unidad_del_condominio(db, payload.unidad_id, current_user.condominio_id)

    for field, value in payload.model_dump().items():
        setattr(residente, field, value)

    await db.commit()
    residente.unidad = unidad
    return _to_out(residente)


@router.delete("/{residente_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_residente(
    residente_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN)),
) -> None:
    residente = await _get_residente_o_404(db, residente_id, current_user.condominio_id)
    await db.delete(residente)
    await db.commit()
