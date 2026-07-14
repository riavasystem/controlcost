"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Multa, Unidad } from "@/lib/types";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo cargar ${url}`);
  return response.json();
}

function formatMonto(valor: string) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(Number(valor));
}

type FormState = { unidad_id: string; motivo: string; monto: string; fecha: string };
const FORM_INICIAL: FormState = {
  unidad_id: "",
  motivo: "",
  monto: "",
  fecha: new Date().toISOString().slice(0, 10),
};

export default function MultasPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [error, setError] = useState<string | null>(null);

  const { data: unidades } = useQuery({ queryKey: ["unidades"], queryFn: () => fetchJson<Unidad[]>("/api/unidades") });
  const { data: multas, isLoading } = useQuery({ queryKey: ["multas"], queryFn: () => fetchJson<Multa[]>("/api/multas") });

  function invalidar() {
    queryClient.invalidateQueries({ queryKey: ["multas"] });
    queryClient.invalidateQueries({ queryKey: ["finanzas"] });
  }

  const crear = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/multas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unidad_id: form.unidad_id,
          motivo: form.motivo,
          monto: Number(form.monto),
          fecha: form.fecha,
        }),
      });
      if (!response.ok) throw new Error((await response.json()).detail ?? "Error al registrar la multa");
      return response.json();
    },
    onSuccess: () => {
      invalidar();
      setForm(FORM_INICIAL);
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  const togglePagada = useMutation({
    mutationFn: async ({ id, pagada }: { id: string; pagada: boolean }) => {
      const response = await fetch(`/api/multas/${id}?pagada=${pagada}`, { method: "PATCH" });
      if (!response.ok) throw new Error((await response.json()).detail ?? "Error al actualizar la multa");
      return response.json();
    },
    onSuccess: () => invalidar(),
    onError: (e: Error) => setError(e.message),
  });

  const eliminar = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/multas/${id}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) {
        throw new Error((await response.json()).detail ?? "Error al eliminar la multa");
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
      <h1 className="text-2xl font-semibold text-slate-900">Multas</h1>
      <p className="mt-1 text-slate-500">
        Registra una infracción a una unidad. Se crea automáticamente un ingreso en Finanzas (categoría
        &quot;Multas&quot;) al momento de registrarla.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Unidad</label>
          <select
            required
            value={form.unidad_id}
            onChange={(e) => setForm((f) => ({ ...f, unidad_id: e.target.value }))}
            className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Elegir
            </option>
            {unidades?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.numero}
                {u.torre ? ` (${u.torre})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-50 flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600">Motivo</label>
          <input
            required
            placeholder="Ruidos molestos, estacionamiento indebido..."
            value={form.motivo}
            onChange={(e) => setForm((f) => ({ ...f, motivo: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
        <button
          type="submit"
          disabled={crear.isPending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          Registrar multa
        </button>
      </form>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3">Unidad</th>
              <th className="px-5 py-3">Motivo</th>
              <th className="px-5 py-3">Fecha</th>
              <th className="px-5 py-3">Monto</th>
              <th className="px-5 py-3">Estado</th>
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
            {!isLoading && multas?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-slate-400">
                  Aún no hay multas registradas.
                </td>
              </tr>
            )}
            {multas?.map((m) => (
              <tr key={m.id} className="border-t border-slate-100">
                <td className="px-5 py-3 font-medium text-slate-900">
                  {m.unidad_numero}
                  {m.unidad_torre ? ` (${m.unidad_torre})` : ""}
                </td>
                <td className="px-5 py-3 text-slate-600">{m.motivo}</td>
                <td className="px-5 py-3 text-slate-600">{m.fecha}</td>
                <td className="px-5 py-3 text-slate-600">{formatMonto(m.monto)}</td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => togglePagada.mutate({ id: m.id, pagada: !m.pagada })}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      m.pagada ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {m.pagada ? "Pagada" : "Pendiente"}
                  </button>
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar la multa de ${m.unidad_numero}? También se borra el ingreso asociado en Finanzas.`))
                        eliminar.mutate(m.id);
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
