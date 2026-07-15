import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.proveedor import Proveedor
from app.models.usuario import UserRole, Usuario
from app.schemas.proveedor import ProveedorCreate, ProveedorOut, ProveedorUpdate

router = APIRouter(prefix="/proveedores", tags=["proveedores"])


@router.get("", response_model=list[ProveedorOut])
async def listar_proveedores(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONTADOR, UserRole.CONSERJE)),
) -> list[ProveedorOut]:
    result = await db.execute(
        select(Proveedor)
        .where(Proveedor.condominio_id == current_user.condominio_id)
        .order_by(Proveedor.nombre_empresa)
    )
    return list(result.scalars().all())


@router.post("", response_model=ProveedorOut, status_code=status.HTTP_201_CREATED)
async def crear_proveedor(
    payload: ProveedorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN)),
) -> ProveedorOut:
    proveedor = Proveedor(id=uuid.uuid4(), condominio_id=current_user.condominio_id, **payload.model_dump())
    db.add(proveedor)
    await db.commit()
    await db.refresh(proveedor)
    return proveedor


async def _get_proveedor_o_404(db: AsyncSession, proveedor_id: uuid.UUID, condominio_id: uuid.UUID) -> Proveedor:
    proveedor = await db.scalar(
        select(Proveedor).where(Proveedor.id == proveedor_id, Proveedor.condominio_id == condominio_id)
    )
    if proveedor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proveedor no encontrado")
    return proveedor


@router.put("/{proveedor_id}", response_model=ProveedorOut)
async def actualizar_proveedor(
    proveedor_id: uuid.UUID,
    payload: ProveedorUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN)),
) -> ProveedorOut:
    proveedor = await _get_proveedor_o_404(db, proveedor_id, current_user.condominio_id)
    for field, value in payload.model_dump().items():
        setattr(proveedor, field, value)
    await db.commit()
    await db.refresh(proveedor)
    return proveedor


@router.delete("/{proveedor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_proveedor(
    proveedor_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN)),
) -> None:
    proveedor = await _get_proveedor_o_404(db, proveedor_id, current_user.condominio_id)
    await db.delete(proveedor)
    await db.commit()
