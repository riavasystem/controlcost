import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Visita(Base):
    """Registro de entrada/salida de una visita a una unidad."""

    __tablename__ = "visitas"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    condominio_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("condominios.id", ondelete="CASCADE"), nullable=False
    )
    unidad_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("unidades.id", ondelete="CASCADE"), nullable=False
    )
    nombre_visitante: Mapped[str] = mapped_column(String(200), nullable=False)
    rut_visitante: Mapped[str | None] = mapped_column(String(20), nullable=True)
    hora_entrada: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    hora_salida: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    unidad: Mapped["Unidad"] = relationship()  # noqa: F821
