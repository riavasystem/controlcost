import uuid

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Vehiculo(Base):
    """Padrón maestro de vehículos, vinculado a una unidad."""

    __tablename__ = "vehiculos"
    __table_args__ = (UniqueConstraint("condominio_id", "patente", name="uq_vehiculo_condominio_patente"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    condominio_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("condominios.id", ondelete="CASCADE"), nullable=False
    )
    unidad_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("unidades.id", ondelete="CASCADE"), nullable=False
    )
    patente: Mapped[str] = mapped_column(String(15), nullable=False)
    marca: Mapped[str | None] = mapped_column(String(100), nullable=True)
    modelo: Mapped[str | None] = mapped_column(String(100), nullable=True)
    color: Mapped[str | None] = mapped_column(String(50), nullable=True)

    unidad: Mapped["Unidad"] = relationship()  # noqa: F821
