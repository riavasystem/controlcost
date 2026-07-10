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
