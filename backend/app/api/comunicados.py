import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.comunicado import Comunicado
from app.models.usuario import UserRole, Usuario
from app.schemas.comunicado import ComunicadoCreate, ComunicadoOut

router = APIRouter(prefix="/comunicados", tags=["comunicados"])

TODOS_LOS_ROLES = (UserRole.ADMIN, UserRole.CONTADOR, UserRole.CONSERJE, UserRole.RESIDENTE)


def _to_out(comunicado: Comunicado) -> ComunicadoOut:
    return ComunicadoOut(
        id=comunicado.id,
        titulo=comunicado.titulo,
        contenido=comunicado.contenido,
        prioridad=comunicado.prioridad,
        autor_nombre=comunicado.autor.nombre,
        created_at=comunicado.created_at,
    )


@router.get("", response_model=list[ComunicadoOut])
async def listar_comunicados(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(*TODOS_LOS_ROLES)),
) -> list[ComunicadoOut]:
    result = await db.execute(
        select(Comunicado)
        .options(joinedload(Comunicado.autor))
        .where(Comunicado.condominio_id == current_user.condominio_id)
        .order_by(Comunicado.created_at.desc())
    )
    return [_to_out(c) for c in result.unique().scalars().all()]


@router.post("", response_model=ComunicadoOut, status_code=status.HTTP_201_CREATED)
async def crear_comunicado(
    payload: ComunicadoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONSERJE)),
) -> ComunicadoOut:
    comunicado = Comunicado(
        id=uuid.uuid4(),
        condominio_id=current_user.condominio_id,
        autor_id=current_user.id,
        **payload.model_dump(),
    )
    db.add(comunicado)
    await db.commit()
    comunicado.autor = current_user
    return _to_out(comunicado)


@router.delete("/{comunicado_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_comunicado(
    comunicado_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN)),
) -> None:
    comunicado = await db.scalar(
        select(Comunicado).where(
            Comunicado.id == comunicado_id, Comunicado.condominio_id == current_user.condominio_id
        )
    )
    if comunicado is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comunicado no encontrado")
    await db.delete(comunicado)
    await db.commit()
