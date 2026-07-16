import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.residente import Residente
from app.models.unidad import Unidad
from app.models.usuario import UserRole, Usuario
from app.schemas.unidad import UnidadCreate, UnidadOut, UnidadUpdate

router = APIRouter(prefix="/unidades", tags=["unidades"])


async def _to_out(db: AsyncSession, unidad: Unidad) -> UnidadOut:
    count = await db.scalar(select(func.count()).select_from(Residente).where(Residente.unidad_id == unidad.id))
    return UnidadOut(
        id=unidad.id,
        condominio_id=unidad.condominio_id,
        numero=unidad.numero,
        torre=unidad.torre,
        metraje=unidad.metraje,
        numero_bodega=unidad.numero_bodega,
        metraje_bodega=unidad.metraje_bodega,
        total_residentes=count or 0,
    )


@router.get("", response_model=list[UnidadOut])
async def listar_unidades(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONTADOR, UserRole.CONSERJE)),
) -> list[UnidadOut]:
    result = await db.execute(
        select(Unidad).where(Unidad.condominio_id == current_user.condominio_id).order_by(Unidad.numero)
    )
    unidades = result.scalars().all()
    return [await _to_out(db, u) for u in unidades]


@router.post("", response_model=UnidadOut, status_code=status.HTTP_201_CREATED)
async def crear_unidad(
    payload: UnidadCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN)),
) -> UnidadOut:
    existente = await db.scalar(
        select(Unidad).where(Unidad.condominio_id == current_user.condominio_id, Unidad.numero == payload.numero)
    )
    if existente is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ya existe una unidad con ese número")

    unidad = Unidad(id=uuid.uuid4(), condominio_id=current_user.condominio_id, **payload.model_dump())
    db.add(unidad)
    await db.commit()
    await db.refresh(unidad)
    return await _to_out(db, unidad)


async def _get_unidad_o_404(db: AsyncSession, unidad_id: uuid.UUID, condominio_id: uuid.UUID) -> Unidad:
    unidad = await db.scalar(select(Unidad).where(Unidad.id == unidad_id, Unidad.condominio_id == condominio_id))
    if unidad is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unidad no encontrada")
    return unidad


@router.put("/{unidad_id}", response_model=UnidadOut)
async def actualizar_unidad(
    unidad_id: uuid.UUID,
    payload: UnidadUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN)),
) -> UnidadOut:
    unidad = await _get_unidad_o_404(db, unidad_id, current_user.condominio_id)
    for field, value in payload.model_dump().items():
        setattr(unidad, field, value)
    await db.commit()
    await db.refresh(unidad)
    return await _to_out(db, unidad)


@router.delete("/{unidad_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_unidad(
    unidad_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN)),
) -> None:
    unidad = await _get_unidad_o_404(db, unidad_id, current_user.condominio_id)

    tiene_residentes = await db.scalar(
        select(func.count()).select_from(Residente).where(Residente.unidad_id == unidad.id)
    )
    if tiene_residentes:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se puede eliminar una unidad que tiene residentes asignados",
        )

    await db.delete(unidad)
    await db.commit()
