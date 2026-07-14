"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Comunicado, PrioridadComunicado } from "@/lib/types";

async function fetchComunicados(): Promise<Comunicado[]> {
  const response = await fetch("/api/comunicados");
  if (!response.ok) throw new Error("No se pudieron cargar los comunicados");
  return response.json();
}

const PRIORIDAD_ESTILO: Record<PrioridadComunicado, string> = {
  normal: "bg-slate-100 text-slate-600",
  importante: "bg-amber-50 text-amber-700",
  urgente: "bg-red-50 text-red-700",
};

const PRIORIDAD_LABEL: Record<PrioridadComunicado, string> = {
  normal: "Normal",
  importante: "Importante",
  urgente: "Urgente",
};

type FormState = { titulo: string; contenido: string; prioridad: PrioridadComunicado };
const FORM_INICIAL: FormState = { titulo: "", contenido: "", prioridad: "normal" };

export default function ComunicadosPage() {
  const queryClient = useQueryClient();
  const { data: comunicados, isLoading } = useQuery({ queryKey: ["comunicados"], queryFn: fetchComunicados });

  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [error, setError] = useState<string | null>(null);

  const crear = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/comunicados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error((await response.json()).detail ?? "Error al publicar el comunicado");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comunicados"] });
      setForm(FORM_INICIAL);
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  const eliminar = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/comunicados/${id}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) {
        throw new Error((await response.json()).detail ?? "Error al eliminar el comunicado");
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comunicados"] }),
    onError: (e: Error) => setError(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    crear.mutate();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Comunicados</h1>
      <p className="mt-1 text-slate-500">Publica avisos para los residentes, con nivel de prioridad.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-50 flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">Título</label>
            <input
              required
              value={form.titulo}
              onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Prioridad</label>
            <select
              value={form.prioridad}
              onChange={(e) => setForm((f) => ({ ...f, prioridad: e.target.value as PrioridadComunicado }))}
              className="w-36 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="normal">Normal</option>
              <option value="importante">Importante</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Contenido</label>
          <textarea
            required
            rows={3}
            value={form.contenido}
            onChange={(e) => setForm((f) => ({ ...f, contenido: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={crear.isPending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          Publicar comunicado
        </button>
      </form>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 space-y-3">
        {isLoading && <p className="text-sm text-slate-400">Cargando...</p>}
        {!isLoading && comunicados?.length === 0 && (
          <p className="text-sm text-slate-400">Aún no hay comunicados publicados.</p>
        )}
        {comunicados?.map((c) => (
          <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">{c.titulo}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORIDAD_ESTILO[c.prioridad]}`}>
                    {PRIORIDAD_LABEL[c.prioridad]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {c.autor_nombre} · {new Date(c.created_at).toLocaleString("es-CL")}
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm(`¿Eliminar el comunicado "${c.titulo}"?`)) eliminar.mutate(c.id);
                }}
                className="shrink-0 text-red-500 hover:text-red-700"
              >
                Eliminar
              </button>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{c.contenido}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
