"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Encomienda, Unidad } from "@/lib/types";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo cargar ${url}`);
  return response.json();
}

function formatFecha(valor: string) {
  return new Date(valor).toLocaleString("es-CL");
}

type FormState = { unidad_id: string; descripcion: string };
const FORM_INICIAL: FormState = { unidad_id: "", descripcion: "" };

export default function EncomiendasPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [error, setError] = useState<string | null>(null);

  const { data: unidades } = useQuery({ queryKey: ["unidades"], queryFn: () => fetchJson<Unidad[]>("/api/unidades") });
  const { data: encomiendas, isLoading } = useQuery({
    queryKey: ["encomiendas"],
    queryFn: () => fetchJson<Encomienda[]>("/api/encomiendas"),
  });

  const registrarLlegada = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/encomiendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error((await response.json()).detail ?? "Error al registrar la encomienda");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["encomiendas"] });
      setForm(FORM_INICIAL);
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  const registrarRetiro = useMutation({
    mutationFn: async (id: string) => {
      const retiradoPor = prompt("¿Quién retira la encomienda? (opcional)") ?? "";
      const query = retiradoPor ? `?retirado_por=${encodeURIComponent(retiradoPor)}` : "";
      const response = await fetch(`/api/encomiendas/${id}/retiro${query}`, { method: "PATCH" });
      if (!response.ok) throw new Error((await response.json()).detail ?? "Error al registrar el retiro");
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["encomiendas"] }),
    onError: (e: Error) => setError(e.message),
  });

  const eliminar = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/encomiendas/${id}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) {
        throw new Error((await response.json()).detail ?? "Error al eliminar el registro");
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["encomiendas"] }),
    onError: (e: Error) => setError(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    registrarLlegada.mutate();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Encomiendas</h1>
      <p className="mt-1 text-slate-500">Ciclo llegada → notificación → retiro para cada unidad.</p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Propiedad destino</label>
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
          <label className="mb-1 block text-xs font-medium text-slate-600">Descripción</label>
          <input
            required
            placeholder="Paquete Amazon, sobre certificado..."
            value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={registrarLlegada.isPending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          Registrar llegada
        </button>
      </form>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3">Propiedad</th>
              <th className="px-5 py-3">Descripción</th>
              <th className="px-5 py-3">Llegada</th>
              <th className="px-5 py-3">Estado</th>
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
            {!isLoading && encomiendas?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-slate-400">
                  Aún no hay encomiendas registradas.
                </td>
              </tr>
            )}
            {encomiendas?.map((enc) => (
              <tr key={enc.id} className="border-t border-slate-100">
                <td className="px-5 py-3 font-medium text-slate-900">
                  {enc.unidad_numero}
                  {enc.unidad_torre ? ` (${enc.unidad_torre})` : ""}
                </td>
                <td className="px-5 py-3 text-slate-600">{enc.descripcion}</td>
                <td className="px-5 py-3 text-slate-600">{formatFecha(enc.fecha_llegada)}</td>
                <td className="px-5 py-3">
                  {enc.estado === "retirado" ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      Retirado{enc.retirado_por ? ` por ${enc.retirado_por}` : ""}
                    </span>
                  ) : (
                    <button
                      onClick={() => registrarRetiro.mutate(enc.id)}
                      className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
                    >
                      Pendiente — marcar retiro
                    </button>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar el registro de "${enc.descripcion}"?`)) eliminar.mutate(enc.id);
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
