from decimal import Decimal

from pydantic import BaseModel


class ResumenLey21442Out(BaseModel):
    total_residentes: int
    total_unidades: int
    periodos_gasto_comun: int
    total_recaudado_historico: Decimal
    total_pendiente_historico: Decimal
    balance_financiero: Decimal
    total_visitas_registradas: int
    total_vehiculos_registrados: int
    total_proveedores_registrados: int
    total_turnos_guardia: int
