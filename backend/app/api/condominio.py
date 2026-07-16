import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.condominio import Condominio
from app.models.usuario import UserRole, Usuario
from app.schemas.condominio import CondominioOut

router = APIRouter(prefix="/condominio", tags=["condominio"])

EXTENSIONES_PERMITIDAS = {".jpg", ".jpeg", ".png", ".webp"}


@router.get("", response_model=CondominioOut)
async def obtener_condominio(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONTADOR, UserRole.CONSERJE)),
) -> Condominio:
    condominio = await db.get(Condominio, current_user.condominio_id)
    if condominio is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Condominio no encontrado")
    return condominio


@router.put("", response_model=CondominioOut)
async def actualizar_condominio(
    nombre: str = Form(..., min_length=1, max_length=200),
    rut: str | None = Form(default=None),
    direccion: str | None = Form(default=None),
    comuna: str | None = Form(default=None),
    ciudad: str | None = Form(default=None),
    estacionamientos_visita: int | None = Form(default=None),
    estacionamientos_discapacitados: int | None = Form(default=None),
    imagen: UploadFile | None = File(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN)),
) -> Condominio:
    condominio = await db.get(Condominio, current_user.condominio_id)
    if condominio is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Condominio no encontrado")

    condominio.nombre = nombre
    condominio.rut = rut or None
    condominio.direccion = direccion or None
    condominio.comuna = comuna or None
    condominio.ciudad = ciudad or None
    condominio.estacionamientos_visita = estacionamientos_visita
    condominio.estacionamientos_discapacitados = estacionamientos_discapacitados

    if imagen is not None and imagen.filename:
        extension = Path(imagen.filename).suffix.lower()
        if extension not in EXTENSIONES_PERMITIDAS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Formato de imagen no soportado. Usa JPG, PNG o WEBP.",
            )
        destino_dir = Path(settings.uploads_dir) / "condominio"
        destino_dir.mkdir(parents=True, exist_ok=True)
        nombre_archivo = f"{uuid.uuid4()}{extension}"
        contenido = await imagen.read()
        (destino_dir / nombre_archivo).write_bytes(contenido)
        condominio.imagen_url = f"/uploads/condominio/{nombre_archivo}"

    await db.commit()
    await db.refresh(condominio)
    return condominio
