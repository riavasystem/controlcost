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
