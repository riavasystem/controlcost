import uuid
from datetime import datetime

from sqlalchemy import Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Condominio(Base):
    """Raíz multi-tenant: todo lo demás cuelga de condominio_id."""

    __tablename__ = "condominios"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    rut: Mapped[str | None] = mapped_column(String(20), nullable=True)
    direccion: Mapped[str | None] = mapped_column(String(300), nullable=True)
    comuna: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ciudad: Mapped[str | None] = mapped_column(String(100), nullable=True)
    imagen_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    estacionamientos_visita: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    usuarios: Mapped[list["Usuario"]] = relationship(back_populates="condominio")  # noqa: F821
    unidades: Mapped[list["Unidad"]] = relationship(back_populates="condominio")  # noqa: F821
