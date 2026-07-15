export type Unidad = {
  id: string;
  condominio_id: string;
  numero: string;
  torre: string | null;
  /** FastAPI serializa Decimal como string (ej. "55.50"), no como number. */
  metraje: string | null;
  total_residentes: number;
};

export type TipoResidente = "propietario" | "arrendatario";

export type Residente = {
  id: string;
  unidad_id: string;
  nombre: string;
  rut: string | null;
  telefono: string | null;
  tipo: TipoResidente;
  unidad_numero: string | null;
  unidad_torre: string | null;
};

export type CargoUnidad = {
  id: string;
  unidad_id: string;
  unidad_numero: string;
  unidad_torre: string | null;
  monto_base: string;
  monto_extraordinario: string;
  monto_total: string;
  pagado: boolean;
};

export type PeriodoGastoComun = {
  id: string;
  condominio_id: string;
  anio: number;
  mes: number;
  tarifa_m2: string;
  extraordinario: string;
  extraordinario_torre: string | null;
  descripcion: string | null;
  total_unidades: number;
  total_recaudado: string;
  total_pendiente: string;
};

export type PeriodoGastoComunDetalle = PeriodoGastoComun & {
  cargos: CargoUnidad[];
};

export type MetodoPago = "transferencia" | "efectivo" | "webpay";

export type CargoPendiente = {
  id: string;
  periodo_id: string;
  periodo_anio: number;
  periodo_mes: number;
  unidad_id: string;
  unidad_numero: string;
  unidad_torre: string | null;
  monto_total: string;
};

export type Pago = {
  id: string;
  cargo_id: string;
  unidad_numero: string;
  unidad_torre: string | null;
  periodo_anio: number;
  periodo_mes: number;
  monto: string;
  metodo: MetodoPago;
  fecha_pago: string;
  reversado: boolean;
};

export type TipoMovimiento = "ingreso" | "egreso";

export type MovimientoFinanciero = {
  id: string;
  tipo: TipoMovimiento;
  categoria: string;
  monto: string;
  descripcion: string | null;
  fecha: string;
};

export type ResumenFinanciero = {
  total_recaudado_gastos_comunes: string;
  total_ingresos_manuales: string;
  total_egresos: string;
  balance: string;
};

export type Multa = {
  id: string;
  unidad_id: string;
  unidad_numero: string;
  unidad_torre: string | null;
  motivo: string;
  monto: string;
  fecha: string;
  pagada: boolean;
};

export type PrioridadComunicado = "normal" | "importante" | "urgente";

export type Comunicado = {
  id: string;
  titulo: string;
  contenido: string;
  prioridad: PrioridadComunicado;
  autor_nombre: string;
  created_at: string;
};

export type Visita = {
  id: string;
  unidad_id: string;
  unidad_numero: string;
  unidad_torre: string | null;
  nombre_visitante: string;
  rut_visitante: string | null;
  hora_entrada: string;
  hora_salida: string | null;
  alerta: boolean;
};

export type Vehiculo = {
  id: string;
  unidad_id: string;
  unidad_numero: string;
  unidad_torre: string | null;
  patente: string;
  marca: string | null;
  modelo: string | null;
  color: string | null;
};

export type EstadoEncomienda = "pendiente" | "retirado";

export type Encomienda = {
  id: string;
  unidad_id: string;
  unidad_numero: string;
  unidad_torre: string | null;
  descripcion: string;
  estado: EstadoEncomienda;
  fecha_llegada: string;
  fecha_retiro: string | null;
  retirado_por: string | null;
};

export type DiaSemana =
  | "lunes"
  | "martes"
  | "miercoles"
  | "jueves"
  | "viernes"
  | "sabado"
  | "domingo";

export type TurnoGuardia = {
  id: string;
  nombre_guardia: string;
  telefono: string | null;
  dia_semana: DiaSemana;
  hora_inicio: string;
  hora_fin: string;
};

export type Proveedor = {
  id: string;
  nombre_empresa: string;
  rubro: string;
  contacto_nombre: string | null;
  telefono: string | null;
  email: string | null;
};

export type ResumenLey21442 = {
  total_residentes: number;
  total_unidades: number;
  periodos_gasto_comun: number;
  total_recaudado_historico: string;
  total_pendiente_historico: string;
  balance_financiero: string;
  total_visitas_registradas: number;
  total_vehiculos_registrados: number;
  total_proveedores_registrados: number;
  total_turnos_guardia: number;
};
