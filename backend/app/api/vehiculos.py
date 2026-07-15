import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.unidad import Unidad
from app.models.usuario import UserRole, Usuario
from app.models.vehiculo import Vehiculo
from app.schemas.vehiculo import VehiculoCreate, VehiculoOut, VehiculoUpdate

router = APIRouter(prefix="/vehiculos", tags=["vehiculos"])


def _to_out(vehiculo: Vehiculo) -> VehiculoOut:
    return VehiculoOut(
        id=vehiculo.id,
        unidad_id=vehiculo.unidad_id,
        unidad_numero=vehiculo.unidad.numero,
        unidad_torre=vehiculo.unidad.torre,
        patente=vehiculo.patente,
        marca=vehiculo.marca,
        modelo=vehiculo.modelo,
        color=vehiculo.color,
    )


async def _get_unidad_o_400(db: AsyncSession, unidad_id: uuid.UUID, condominio_id: uuid.UUID) -> Unidad:
    unidad = await db.scalar(select(Unidad).where(Unidad.id == unidad_id, Unidad.condominio_id == condominio_id))
    if unidad is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La unidad indicada no existe")
    return unidad


@router.get("", response_model=list[VehiculoOut])
async def listar_vehiculos(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONTADOR, UserRole.CONSERJE)),
) -> list[VehiculoOut]:
    result = await db.execute(
        select(Vehiculo)
        .options(joinedload(Vehiculo.unidad))
        .where(Vehiculo.condominio_id == current_user.condominio_id)
        .order_by(Vehiculo.patente)
    )
    return [_to_out(v) for v in result.unique().scalars().all()]


@router.post("", response_model=VehiculoOut, status_code=status.HTTP_201_CREATED)
async def crear_vehiculo(
    payload: VehiculoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONSERJE)),
) -> VehiculoOut:
    unidad = await _get_unidad_o_400(db, payload.unidad_id, current_user.condominio_id)

    existente = await db.scalar(
        select(Vehiculo).where(
            Vehiculo.condominio_id == current_user.condominio_id, Vehiculo.patente == payload.patente
        )
    )
    if existente is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ya existe un vehículo con esa patente")

    vehiculo = Vehiculo(id=uuid.uuid4(), condominio_id=current_user.condominio_id, **payload.model_dump())
    db.add(vehiculo)
    await db.commit()
    vehiculo.unidad = unidad
    return _to_out(vehiculo)


async def _get_vehiculo_o_404(db: AsyncSession, vehiculo_id: uuid.UUID, condominio_id: uuid.UUID) -> Vehiculo:
    result = await db.execute(
        select(Vehiculo)
        .options(joinedload(Vehiculo.unidad))
        .where(Vehiculo.id == vehiculo_id, Vehiculo.condominio_id == condominio_id)
    )
    vehiculo = result.unique().scalar_one_or_none()
    if vehiculo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehículo no encontrado")
    return vehiculo


@router.put("/{vehiculo_id}", response_model=VehiculoOut)
async def actualizar_vehiculo(
    vehiculo_id: uuid.UUID,
    payload: VehiculoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONSERJE)),
) -> VehiculoOut:
    vehiculo = await _get_vehiculo_o_404(db, vehiculo_id, current_user.condominio_id)
    unidad = await _get_unidad_o_400(db, payload.unidad_id, current_user.condominio_id)

    for field, value in payload.model_dump().items():
        setattr(vehiculo, field, value)

    await db.commit()
    vehiculo.unidad = unidad
    return _to_out(vehiculo)


@router.delete("/{vehiculo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_vehiculo(
    vehiculo_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONSERJE)),
) -> None:
    vehiculo = await _get_vehiculo_o_404(db, vehiculo_id, current_user.condominio_id)
    await db.delete(vehiculo)
    await db.commit()
