import enum
import uuid

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TipoResidente(str, enum.Enum):
    PROPIETARIO = "propietario"
    ARRENDATARIO = "arrendatario"


class Residente(Base):
    __tablename__ = "residentes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    unidad_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("unidades.id", ondelete="CASCADE"), nullable=False
    )
    usuario_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, unique=True
    )
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    rut: Mapped[str | None] = mapped_column(String(20), nullable=True)
    telefono: Mapped[str | None] = mapped_column(String(30), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    tipo: Mapped[TipoResidente] = mapped_column(Enum(TipoResidente, name="tipo_residente"), nullable=False)

    unidad: Mapped["Unidad"] = relationship(back_populates="residentes")  # noqa: F821
    usuario: Mapped["Usuario | None"] = relationship(back_populates="residente")  # noqa: F821
