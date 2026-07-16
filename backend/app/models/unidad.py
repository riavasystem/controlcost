import uuid

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Unidad(Base):
    """Unidad física (depto/casa), separada de la persona que la habita (Residente)."""

    __tablename__ = "unidades"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    condominio_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("condominios.id", ondelete="CASCADE"), nullable=False
    )
    numero: Mapped[str] = mapped_column(String(20), nullable=False)
    torre: Mapped[str | None] = mapped_column(String(100), nullable=True)
    metraje: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    numero_bodega: Mapped[str | None] = mapped_column(String(50), nullable=True)
    metraje_bodega: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    estacionamiento_discapacitados: Mapped[str | None] = mapped_column(String(50), nullable=True)

    condominio: Mapped["Condominio"] = relationship(back_populates="unidades")  # noqa: F821
    residentes: Mapped[list["Residente"]] = relationship(back_populates="unidad")  # noqa: F821
