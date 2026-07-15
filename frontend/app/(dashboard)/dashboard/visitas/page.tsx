"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Unidad, Visita } from "@/lib/types";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo cargar ${url}`);
  return response.json();
}

function formatHora(valor: string) {
  return new Date(valor).toLocaleString("es-CL");
}

type FormState = { unidad_id: string; nombre_visitante: string; rut_visitante: string };
const FORM_INICIAL: FormState = { unidad_id: "", nombre_visitante: "", rut_visitante: "" };

export default function VisitasPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [error, setError] = useState<string | null>(null);

  const { data: unidades } = useQuery({ queryKey: ["unidades"], queryFn: () => fetchJson<Unidad[]>("/api/unidades") });
  const { data: visitas, isLoading } = useQuery({
    queryKey: ["visitas"],
    queryFn: () => fetchJson<Visita[]>("/api/visitas"),
    refetchInterval: 60_000,
  });

  const registrarEntrada = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/visitas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unidad_id: form.unidad_id,
          nombre_visitante: form.nombre_visitante,
          rut_visitante: form.rut_visitante || null,
        }),
      });
      if (!response.ok) throw new Error((await response.json()).detail ?? "Error al registrar la entrada");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visitas"] });
      setForm(FORM_INICIAL);
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  const registrarSalida = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/visitas/${id}/salida`, { method: "PATCH" });
      if (!response.ok) throw new Error((await response.json()).detail ?? "Error al registrar la salida");
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["visitas"] }),
    onError: (e: Error) => setError(e.message),
  });

  const eliminar = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/visitas/${id}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) {
        throw new Error((await response.json()).detail ?? "Error al eliminar el registro");
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["visitas"] }),
    onError: (e: Error) => setError(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    registrarEntrada.mutate();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Control Visitas</h1>
      <p className="mt-1 text-slate-500">
        Registra la entrada y salida de visitas. Una visita sin salida por más de 8 horas se marca con
        alerta.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Unidad destino</label>
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
          <label className="mb-1 block text-xs font-medium text-slate-600">Nombre visitante</label>
          <input
            required
            value={form.nombre_visitante}
            onChange={(e) => setForm((f) => ({ ...f, nombre_visitante: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">RUT (opcional)</label>
          <input
            value={form.rut_visitante}
            onChange={(e) => setForm((f) => ({ ...f, rut_visitante: e.target.value }))}
            className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={registrarEntrada.isPending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          Registrar entrada
        </button>
      </form>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3">Visitante</th>
              <th className="px-5 py-3">Unidad</th>
              <th className="px-5 py-3">Entrada</th>
              <th className="px-5 py-3">Salida</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-slate-400">
                  Cargando...
                </td>
              </tr>
            )}
            {!isLoading && visitas?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-slate-400">
                  Aún no hay visitas registradas.
                </td>
              </tr>
            )}
            {visitas?.map((v) => (
              <tr key={v.id} className={`border-t border-slate-100 ${v.alerta ? "bg-red-50/50" : ""}`}>
                <td className="px-5 py-3 font-medium text-slate-900">
                  {v.nombre_visitante}
                  {v.alerta && (
                    <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
                      +8 horas
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-slate-600">
                  {v.unidad_numero}
                  {v.unidad_torre ? ` (${v.unidad_torre})` : ""}
                </td>
                <td className="px-5 py-3 text-slate-600">{formatHora(v.hora_entrada)}</td>
                <td className="px-5 py-3 text-slate-600">
                  {v.hora_salida ? (
                    formatHora(v.hora_salida)
                  ) : (
                    <button
                      onClick={() => registrarSalida.mutate(v.id)}
                      className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
                    >
                      Registrar salida
                    </button>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar el registro de "${v.nombre_visitante}"?`)) eliminar.mutate(v.id);
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
