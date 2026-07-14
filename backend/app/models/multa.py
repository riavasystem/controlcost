import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Multa(Base):
    """Infracción a una unidad. Al registrarla se crea automáticamente un ingreso
    en Finanzas (categoría 'Multas'), para trazabilidad completa entre módulos."""

    __tablename__ = "multas"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    condominio_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("condominios.id", ondelete="CASCADE"), nullable=False
    )
    unidad_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("unidades.id", ondelete="CASCADE"), nullable=False
    )
    movimiento_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("movimientos_financieros.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    motivo: Mapped[str] = mapped_column(String(300), nullable=False)
    monto: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    fecha: Mapped[date] = mapped_column(Date, nullable=False)
    pagada: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    unidad: Mapped["Unidad"] = relationship()  # noqa: F821
