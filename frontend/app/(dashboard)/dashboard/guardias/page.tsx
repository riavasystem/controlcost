"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { DiaSemana, TurnoGuardia } from "@/lib/types";

async function fetchTurnos(): Promise<TurnoGuardia[]> {
  const response = await fetch("/api/guardias");
  if (!response.ok) throw new Error("No se pudieron cargar los turnos");
  return response.json();
}

const DIAS: { value: DiaSemana; label: string }[] = [
  { value: "lunes", label: "Lunes" },
  { value: "martes", label: "Martes" },
  { value: "miercoles", label: "Miércoles" },
  { value: "jueves", label: "Jueves" },
  { value: "viernes", label: "Viernes" },
  { value: "sabado", label: "Sábado" },
  { value: "domingo", label: "Domingo" },
];

type FormState = {
  nombre_guardia: string;
  telefono: string;
  dia_semana: DiaSemana;
  hora_inicio: string;
  hora_fin: string;
};
const FORM_INICIAL: FormState = {
  nombre_guardia: "",
  telefono: "",
  dia_semana: "lunes",
  hora_inicio: "08:00",
  hora_fin: "20:00",
};

function toPayload(f: FormState) {
  return {
    nombre_guardia: f.nombre_guardia,
    telefono: f.telefono || null,
    dia_semana: f.dia_semana,
    hora_inicio: f.hora_inicio,
    hora_fin: f.hora_fin,
  };
}

function camposDesdeTurno(t: TurnoGuardia): FormState {
  return {
    nombre_guardia: t.nombre_guardia,
    telefono: t.telefono ?? "",
    dia_semana: t.dia_semana,
    hora_inicio: t.hora_inicio.slice(0, 5),
    hora_fin: t.hora_fin.slice(0, 5),
  };
}

function useActualizarTurno(queryClient: ReturnType<typeof useQueryClient>, setError: (e: string | null) => void) {
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: ReturnType<typeof toPayload> }) => {
      const response = await fetch(`/api/guardias/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error((await response.json()).detail ?? "Error al actualizar el turno");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guardias"] });
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });
}

function useEliminarTurno(queryClient: ReturnType<typeof useQueryClient>, setError: (e: string | null) => void) {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/guardias/${id}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) {
        throw new Error((await response.json()).detail ?? "Error al eliminar el turno");
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["guardias"] }),
    onError: (e: Error) => setError(e.message),
  });
}

function FilaTurno({
  turno,
  actualizar,
  eliminar,
}: {
  turno: TurnoGuardia;
  actualizar: ReturnType<typeof useActualizarTurno>;
  eliminar: ReturnType<typeof useEliminarTurno>;
}) {
  const [editando, setEditando] = useState(false);
  const [campos, setCampos] = useState<FormState>(camposDesdeTurno(turno));

  function cancelar() {
    setEditando(false);
    setCampos(camposDesdeTurno(turno));
  }

  function guardar() {
    actualizar.mutate({ id: turno.id, payload: toPayload(campos) }, { onSuccess: () => setEditando(false) });
  }

  if (!editando) {
    return (
      <tr className="border-t border-slate-100">
        <td className="px-5 py-3 font-medium text-slate-900">{turno.nombre_guardia}</td>
        <td className="px-5 py-3 text-slate-600 capitalize">{turno.dia_semana}</td>
        <td className="px-5 py-3 text-slate-600">
          {turno.hora_inicio.slice(0, 5)} – {turno.hora_fin.slice(0, 5)}
        </td>
        <td className="px-5 py-3 text-slate-600">{turno.telefono ?? "—"}</td>
        <td className="px-5 py-3 text-right">
          <button onClick={() => setEditando(true)} className="mr-3 text-slate-500 hover:text-slate-900">
            Editar
          </button>
          <button
            onClick={() => {
              if (confirm(`¿Eliminar el turno de ${turno.nombre_guardia}?`)) eliminar.mutate(turno.id);
            }}
            className="text-red-500 hover:text-red-700"
          >
            Eliminar
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-slate-100 bg-slate-50">
      <td className="px-3 py-2">
        <input
          value={campos.nombre_guardia}
          onChange={(e) => setCampos((c) => ({ ...c, nombre_guardia: e.target.value }))}
          className="w-32 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        />
      </td>
      <td className="px-3 py-2">
        <select
          value={campos.dia_semana}
          onChange={(e) => setCampos((c) => ({ ...c, dia_semana: e.target.value as DiaSemana }))}
          className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        >
          {DIAS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <input
            type="time"
            value={campos.hora_inicio}
            onChange={(e) => setCampos((c) => ({ ...c, hora_inicio: e.target.value }))}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          />
          <span className="text-slate-400">–</span>
          <input
            type="time"
            value={campos.hora_fin}
            onChange={(e) => setCampos((c) => ({ ...c, hora_fin: e.target.value }))}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
      </td>
      <td className="px-3 py-2">
        <input
          value={campos.telefono}
          onChange={(e) => setCampos((c) => ({ ...c, telefono: e.target.value }))}
          className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        />
      </td>
      <td className="px-3 py-2 text-right">
        <button
          onClick={guardar}
          disabled={actualizar.isPending}
          className="mr-3 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          Guardar
        </button>
        <button onClick={cancelar} className="text-xs text-slate-500 hover:text-slate-900">
          Cancelar
        </button>
      </td>
    </tr>
  );
}

export default function GuardiasPage() {
  const queryClient = useQueryClient();
  const { data: turnos, isLoading } = useQuery({ queryKey: ["guardias"], queryFn: fetchTurnos });

  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [error, setError] = useState<string | null>(null);

  const actualizar = useActualizarTurno(queryClient, setError);
  const eliminar = useEliminarTurno(queryClient, setError);

  const crear = useMutation({
    mutationFn: async (payload: ReturnType<typeof toPayload>) => {
      const response = await fetch("/api/guardias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error((await response.json()).detail ?? "Error al crear el turno");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guardias"] });
      setForm(FORM_INICIAL);
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    crear.mutate(toPayload(form));
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Guardias</h1>
      <p className="mt-1 text-slate-500">Turnos y horarios recurrentes del personal de seguridad.</p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Nombre</label>
          <input
            required
            value={form.nombre_guardia}
            onChange={(e) => setForm((f) => ({ ...f, nombre_guardia: e.target.value }))}
            className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Teléfono</label>
          <input
            value={form.telefono}
            onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
            className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Día</label>
          <select
            value={form.dia_semana}
            onChange={(e) => setForm((f) => ({ ...f, dia_semana: e.target.value as DiaSemana }))}
            className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {DIAS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Hora inicio</label>
          <input
            type="time"
            required
            value={form.hora_inicio}
            onChange={(e) => setForm((f) => ({ ...f, hora_inicio: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Hora fin</label>
          <input
            type="time"
            required
            value={form.hora_fin}
            onChange={(e) => setForm((f) => ({ ...f, hora_fin: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={crear.isPending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          Agregar turno
        </button>
      </form>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3">Guardia</th>
              <th className="px-5 py-3">Día</th>
              <th className="px-5 py-3">Horario</th>
              <th className="px-5 py-3">Teléfono</th>
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
            {!isLoading && turnos?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-slate-400">
                  Sin turnos registrados todavía.
                </td>
              </tr>
            )}
            {turnos?.map((t) => (
              <FilaTurno key={t.id} turno={t} actualizar={actualizar} eliminar={eliminar} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
