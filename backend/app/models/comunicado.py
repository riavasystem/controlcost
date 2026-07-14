import enum
import uuid
from datetime import datetime

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class PrioridadComunicado(str, enum.Enum):
    NORMAL = "normal"
    IMPORTANTE = "importante"
    URGENTE = "urgente"


class Comunicado(Base):
    """Aviso publicado por la administración, con nivel de prioridad."""

    __tablename__ = "comunicados"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    condominio_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("condominios.id", ondelete="CASCADE"), nullable=False
    )
    autor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False
    )
    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    contenido: Mapped[str] = mapped_column(Text, nullable=False)
    prioridad: Mapped[PrioridadComunicado] = mapped_column(
        Enum(PrioridadComunicado, name="prioridad_comunicado"), nullable=False, default=PrioridadComunicado.NORMAL
    )
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    autor: Mapped["Usuario"] = relationship()  # noqa: F821
