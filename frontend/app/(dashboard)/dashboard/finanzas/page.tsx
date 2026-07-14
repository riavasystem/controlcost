"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { MovimientoFinanciero, ResumenFinanciero, TipoMovimiento } from "@/lib/types";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo cargar ${url}`);
  return response.json();
}

function formatMonto(valor: string) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(Number(valor));
}

type FormState = { tipo: TipoMovimiento; categoria: string; monto: string; fecha: string; descripcion: string };
const FORM_INICIAL: FormState = {
  tipo: "egreso",
  categoria: "",
  monto: "",
  fecha: new Date().toISOString().slice(0, 10),
  descripcion: "",
};

export default function FinanzasPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [error, setError] = useState<string | null>(null);

  const { data: resumen } = useQuery({
    queryKey: ["finanzas", "resumen"],
    queryFn: () => fetchJson<ResumenFinanciero>("/api/finanzas/resumen"),
  });

  const { data: movimientos, isLoading } = useQuery({
    queryKey: ["finanzas", "movimientos"],
    queryFn: () => fetchJson<MovimientoFinanciero[]>("/api/finanzas/movimientos"),
  });

  function invalidar() {
    queryClient.invalidateQueries({ queryKey: ["finanzas"] });
  }

  const crear = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/finanzas/movimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: form.tipo,
          categoria: form.categoria,
          monto: Number(form.monto),
          fecha: form.fecha,
          descripcion: form.descripcion || null,
        }),
      });
      if (!response.ok) throw new Error((await response.json()).detail ?? "Error al crear el movimiento");
      return response.json();
    },
    onSuccess: () => {
      invalidar();
      setForm(FORM_INICIAL);
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  const eliminar = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/finanzas/movimientos/${id}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) {
        throw new Error((await response.json()).detail ?? "Error al eliminar el movimiento");
      }
    },
    onSuccess: () => invalidar(),
    onError: (e: Error) => setError(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    crear.mutate();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Finanzas</h1>
      <p className="mt-1 text-slate-500">
        Ingresos y egresos manuales del condominio, combinados con lo recaudado en Gastos Comunes para un
        balance con trazabilidad completa.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Recaudado gastos comunes</p>
          <p className="mt-2 text-xl font-semibold text-emerald-700">
            {resumen ? formatMonto(resumen.total_recaudado_gastos_comunes) : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Otros ingresos</p>
          <p className="mt-2 text-xl font-semibold text-emerald-700">
            {resumen ? formatMonto(resumen.total_ingresos_manuales) : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Egresos</p>
          <p className="mt-2 text-xl font-semibold text-red-700">
            {resumen ? formatMonto(resumen.total_egresos) : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Balance</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{resumen ? formatMonto(resumen.balance) : "—"}</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Tipo</label>
          <select
            value={form.tipo}
            onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as TipoMovimiento }))}
            className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="ingreso">Ingreso</option>
            <option value="egreso">Egreso</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Categoría</label>
          <input
            required
            placeholder="Mantención, sueldos..."
            value={form.categoria}
            onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
            className="w-44 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Monto ($)</label>
          <input
            type="number"
            step="0.01"
            required
            value={form.monto}
            onChange={(e) => setForm((f) => ({ ...f, monto: e.target.value }))}
            className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Fecha</label>
          <input
            type="date"
            required
            value={form.fecha}
            onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="min-w-50 flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600">Descripción (opcional)</label>
          <input
            value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={crear.isPending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          Registrar movimiento
        </button>
      </form>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3">Fecha</th>
              <th className="px-5 py-3">Tipo</th>
              <th className="px-5 py-3">Categoría</th>
              <th className="px-5 py-3">Descripción</th>
              <th className="px-5 py-3">Monto</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-slate-400">
                  Cargando...
                </td>
              </tr>
            )}
            {!isLoading && movimientos?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-slate-400">
                  Aún no hay movimientos registrados.
                </td>
              </tr>
            )}
            {movimientos?.map((m) => (
              <tr key={m.id} className="border-t border-slate-100">
                <td className="px-5 py-3 text-slate-600">{m.fecha}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      m.tipo === "ingreso" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    }`}
                  >
                    {m.tipo === "ingreso" ? "Ingreso" : "Egreso"}
                  </span>
                </td>
                <td className="px-5 py-3 font-medium text-slate-900">{m.categoria}</td>
                <td className="px-5 py-3 text-slate-500">{m.descripcion ?? "—"}</td>
                <td className={`px-5 py-3 ${m.tipo === "ingreso" ? "text-emerald-700" : "text-red-700"}`}>
                  {formatMonto(m.monto)}
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar el movimiento "${m.categoria}"?`)) eliminar.mutate(m.id);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
