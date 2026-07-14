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
