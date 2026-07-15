import uuid
from datetime import time

from pydantic import BaseModel, Field

from app.models.guardia import DiaSemana


class TurnoGuardiaBase(BaseModel):
    nombre_guardia: str = Field(min_length=1, max_length=200)
    telefono: str | None = Field(default=None, max_length=30)
    dia_semana: DiaSemana
    hora_inicio: time
    hora_fin: time


class TurnoGuardiaCreate(TurnoGuardiaBase):
    pass


class TurnoGuardiaUpdate(TurnoGuardiaBase):
    pass


class TurnoGuardiaOut(TurnoGuardiaBase):
    id: uuid.UUID

    model_config = {"from_attributes": True}
