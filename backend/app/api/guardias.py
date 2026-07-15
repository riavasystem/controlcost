import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.guardia import TurnoGuardia
from app.models.usuario import UserRole, Usuario
from app.schemas.guardia import TurnoGuardiaCreate, TurnoGuardiaOut, TurnoGuardiaUpdate

router = APIRouter(prefix="/guardias", tags=["guardias"])

ORDEN_DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]


@router.get("", response_model=list[TurnoGuardiaOut])
async def listar_turnos(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONTADOR, UserRole.CONSERJE)),
) -> list[TurnoGuardiaOut]:
    result = await db.execute(
        select(TurnoGuardia).where(TurnoGuardia.condominio_id == current_user.condominio_id)
    )
    turnos = list(result.scalars().all())
    turnos.sort(key=lambda t: (ORDEN_DIAS.index(t.dia_semana.value), t.hora_inicio))
    return turnos


@router.post("", response_model=TurnoGuardiaOut, status_code=status.HTTP_201_CREATED)
async def crear_turno(
    payload: TurnoGuardiaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONSERJE)),
) -> TurnoGuardiaOut:
    turno = TurnoGuardia(id=uuid.uuid4(), condominio_id=current_user.condominio_id, **payload.model_dump())
    db.add(turno)
    await db.commit()
    await db.refresh(turno)
    return turno


async def _get_turno_o_404(db: AsyncSession, turno_id: uuid.UUID, condominio_id: uuid.UUID) -> TurnoGuardia:
    turno = await db.scalar(
        select(TurnoGuardia).where(TurnoGuardia.id == turno_id, TurnoGuardia.condominio_id == condominio_id)
    )
    if turno is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turno no encontrado")
    return turno


@router.put("/{turno_id}", response_model=TurnoGuardiaOut)
async def actualizar_turno(
    turno_id: uuid.UUID,
    payload: TurnoGuardiaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONSERJE)),
) -> TurnoGuardiaOut:
    turno = await _get_turno_o_404(db, turno_id, current_user.condominio_id)
    for field, value in payload.model_dump().items():
        setattr(turno, field, value)
    await db.commit()
    await db.refresh(turno)
    return turno


@router.delete("/{turno_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_turno(
    turno_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONSERJE)),
) -> None:
    turno = await _get_turno_o_404(db, turno_id, current_user.condominio_id)
    await db.delete(turno)
    await db.commit()
