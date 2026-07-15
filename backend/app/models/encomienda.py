import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class EstadoEncomienda(str, enum.Enum):
    PENDIENTE = "pendiente"
    RETIRADO = "retirado"


class Encomienda(Base):
    """Ciclo llegada → notificación → retiro de una encomienda para una unidad."""

    __tablename__ = "encomiendas"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    condominio_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("condominios.id", ondelete="CASCADE"), nullable=False
    )
    unidad_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("unidades.id", ondelete="CASCADE"), nullable=False
    )
    descripcion: Mapped[str] = mapped_column(String(300), nullable=False)
    estado: Mapped[EstadoEncomienda] = mapped_column(
        Enum(EstadoEncomienda, name="estado_encomienda"), nullable=False, default=EstadoEncomienda.PENDIENTE
    )
    fecha_llegada: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    fecha_retiro: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    retirado_por: Mapped[str | None] = mapped_column(String(200), nullable=True)

    unidad: Mapped["Unidad"] = relationship()  # noqa: F821
