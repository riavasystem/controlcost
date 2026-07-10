"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Unidad } from "@/lib/types";

async function fetchUnidades(): Promise<Unidad[]> {
  const response = await fetch("/api/unidades");
  if (!response.ok) throw new Error("No se pudieron cargar las unidades");
  return response.json();
}

type FormState = { numero: string; torre: string; metraje: string };
const FORM_INICIAL: FormState = { numero: "", torre: "", metraje: "" };

export default function UnidadesPage() {
  const queryClient = useQueryClient();
  const { data: unidades, isLoading } = useQuery({ queryKey: ["unidades"], queryFn: fetchUnidades });

  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toPayload(f: FormState) {
    return {
      numero: f.numero,
      torre: f.torre || null,
      metraje: f.metraje ? Number(f.metraje) : null,
    };
  }

  const crear = useMutation({
    mutationFn: async (payload: ReturnType<typeof toPayload>) => {
      const response = await fetch("/api/unidades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error((await response.json()).detail ?? "Error al crear la unidad");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unidades"] });
      setForm(FORM_INICIAL);
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  const actualizar = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: ReturnType<typeof toPayload> }) => {
      const response = await fetch(`/api/unidades/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error((await response.json()).detail ?? "Error al actualizar la unidad");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unidades"] });
      setForm(FORM_INICIAL);
      setEditandoId(null);
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  const eliminar = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/unidades/${id}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) {
        throw new Error((await response.json()).detail ?? "Error al eliminar la unidad");
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["unidades"] }),
    onError: (e: Error) => setError(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = toPayload(form);
    if (editandoId) {
      actualizar.mutate({ id: editandoId, payload });
    } else {
      crear.mutate(payload);
    }
  }

  function editar(unidad: Unidad) {
    setEditandoId(unidad.id);
    setForm({ numero: unidad.numero, torre: unidad.torre ?? "", metraje: unidad.metraje != null ? String(unidad.metraje) : "" });
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setForm(FORM_INICIAL);
    setError(null);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Unidades</h1>
      <p className="mt-1 text-slate-500">Departamentos o casas del condominio.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Número</label>
          <input
            required
            value={form.numero}
            onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))}
            className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Torre / Sector</label>
          <input
            value={form.torre}
            onChange={(e) => setForm((f) => ({ ...f, torre: e.target.value }))}
            className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Metraje (m²)</label>
          <input
            type="number"
            step="0.01"
            value={form.metraje}
            onChange={(e) => setForm((f) => ({ ...f, metraje: e.target.value }))}
            className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={crear.isPending || actualizar.isPending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {editandoId ? "Guardar cambios" : "Agregar unidad"}
        </button>
        {editandoId && (
          <button type="button" onClick={cancelarEdicion} className="rounded-lg px-4 py-2 text-sm text-slate-500 hover:bg-slate-100">
            Cancelar
          </button>
        )}
      </form>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3">Número</th>
              <th className="px-5 py-3">Torre</th>
              <th className="px-5 py-3">Metraje</th>
              <th className="px-5 py-3">Residentes</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-slate-400">Cargando...</td>
              </tr>
            )}
            {!isLoading && unidades?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-slate-400">Sin unidades registradas todavía.</td>
              </tr>
            )}
            {unidades?.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-5 py-3 font-medium text-slate-900">{u.numero}</td>
                <td className="px-5 py-3 text-slate-600">{u.torre ?? "—"}</td>
                <td className="px-5 py-3 text-slate-600">{u.metraje ? `${u.metraje} m²` : "—"}</td>
                <td className="px-5 py-3 text-slate-600">{u.total_residentes}</td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => editar(u)} className="mr-3 text-slate-500 hover:text-slate-900">
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar la unidad ${u.numero}?`)) eliminar.mutate(u.id);
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
