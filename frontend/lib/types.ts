export type Unidad = {
  id: string;
  condominio_id: string;
  numero: string;
  torre: string | null;
  metraje: number | null;
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
