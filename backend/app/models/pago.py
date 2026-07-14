import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, Enum, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class MetodoPago(str, enum.Enum):
    TRANSFERENCIA = "transferencia"
    EFECTIVO = "efectivo"
    WEBPAY = "webpay"


class Pago(Base):
    """Registro de pago de un cargo de gasto común, con reversión inteligente:
    revertir un pago vuelve el cargo asociado a estado pendiente automáticamente."""

    __tablename__ = "pagos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    condominio_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("condominios.id", ondelete="CASCADE"), nullable=False
    )
    cargo_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cargos_unidad.id", ondelete="CASCADE"), nullable=False
    )
    monto: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    metodo: Mapped[MetodoPago] = mapped_column(Enum(MetodoPago, name="metodo_pago"), nullable=False)
    fecha_pago: Mapped[date] = mapped_column(Date, nullable=False)
    reversado: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    cargo: Mapped["CargoUnidad"] = relationship()  # noqa: F821
