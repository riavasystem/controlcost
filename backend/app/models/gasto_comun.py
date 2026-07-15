import uuid
from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class PeriodoGastoComun(Base):
    """Un cobro mensual de gastos comunes: tarifa por m² + extraordinario plano por unidad."""

    __tablename__ = "periodos_gasto_comun"
    __table_args__ = (UniqueConstraint("condominio_id", "anio", "mes", name="uq_periodo_condominio_anio_mes"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    condominio_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("condominios.id", ondelete="CASCADE"), nullable=False
    )
    anio: Mapped[int] = mapped_column(Integer, nullable=False)
    mes: Mapped[int] = mapped_column(Integer, nullable=False)
    tarifa_m2: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    extraordinario: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    extraordinario_torre: Mapped[str | None] = mapped_column(String(100), nullable=True)
    descripcion: Mapped[str | None] = mapped_column(String(300), nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    cargos: Mapped[list["CargoUnidad"]] = relationship(
        back_populates="periodo", cascade="all, delete-orphan", order_by="CargoUnidad.id"
    )


class CargoUnidad(Base):
    """Línea de cobro de un período de gasto común para una unidad específica."""

    __tablename__ = "cargos_unidad"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    periodo_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("periodos_gasto_comun.id", ondelete="CASCADE"), nullable=False
    )
    unidad_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("unidades.id", ondelete="CASCADE"), nullable=False
    )
    monto_base: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    monto_extraordinario: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    monto_total: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    pagado: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    periodo: Mapped["PeriodoGastoComun"] = relationship(back_populates="cargos")
    unidad: Mapped["Unidad"] = relationship()  # noqa: F821
