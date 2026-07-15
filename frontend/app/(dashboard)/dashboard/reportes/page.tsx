"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { PeriodoGastoComun } from "@/lib/types";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

async function fetchPeriodos(): Promise<PeriodoGastoComun[]> {
  const response = await fetch("/api/gastos-comunes");
  if (!response.ok) throw new Error("No se pudieron cargar los períodos");
  return response.json();
}

export default function ReportesPage() {
  const { data: periodos } = useQuery({ queryKey: ["gastos-comunes"], queryFn: fetchPeriodos });
  const [periodoId, setPeriodoId] = useState("");

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Reportes</h1>
      <p className="mt-1 text-slate-500">Informes descargables para presentar en la junta de copropietarios.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Gastos comunes por período</h2>
          <p className="mt-1 text-xs text-slate-500">
            Detalle de cobro por unidad (monto base, extraordinario, total y estado) en formato CSV.
          </p>
          <div className="mt-4 flex items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Período</label>
              <select
                value={periodoId}
                onChange={(e) => setPeriodoId(e.target.value)}
                className="w-44 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="" disabled>
                  Elegir
                </option>
                {periodos?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {MESES[p.mes - 1]} {p.anio}
                  </option>
                ))}
              </select>
            </div>
            <a
              href={periodoId ? `/api/reportes/gastos-comunes/${periodoId}` : undefined}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                periodoId ? "bg-slate-900 hover:bg-slate-700" : "pointer-events-none bg-slate-300"
              }`}
            >
              Descargar CSV
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Rendición financiera</h2>
          <p className="mt-1 text-xs text-slate-500">
            Todos los ingresos y egresos manuales registrados en Finanzas, en formato CSV.
          </p>
          <div className="mt-4">
            <a
              href="/api/reportes/financiero"
              className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Descargar CSV
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
