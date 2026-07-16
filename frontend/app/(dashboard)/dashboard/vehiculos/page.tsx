"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Unidad, Vehiculo } from "@/lib/types";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo cargar ${url}`);
  return response.json();
}

type FormState = { unidad_id: string; patente: string; marca: string; modelo: string; color: string };
const FORM_INICIAL: FormState = { unidad_id: "", patente: "", marca: "", modelo: "", color: "" };

function toPayload(f: FormState) {
  return {
    unidad_id: f.unidad_id,
    patente: f.patente,
    marca: f.marca || null,
    modelo: f.modelo || null,
    color: f.color || null,
  };
}

function camposDesdeVehiculo(v: Vehiculo): FormState {
  return {
    unidad_id: v.unidad_id,
    patente: v.patente,
    marca: v.marca ?? "",
    modelo: v.modelo ?? "",
    color: v.color ?? "",
  };
}

function useActualizarVehiculo(queryClient: ReturnType<typeof useQueryClient>, setError: (e: string | null) => void) {
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: ReturnType<typeof toPayload> }) => {
      const response = await fetch(`/api/vehiculos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error((await response.json()).detail ?? "Error al actualizar el vehículo");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehiculos"] });
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });
}

function useEliminarVehiculo(queryClient: ReturnType<typeof useQueryClient>, setError: (e: string | null) => void) {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/vehiculos/${id}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) {
        throw new Error((await response.json()).detail ?? "Error al eliminar el vehículo");
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vehiculos"] }),
    onError: (e: Error) => setError(e.message),
  });
}

function FilaVehiculo({
  vehiculo,
  unidades,
  actualizar,
  eliminar,
}: {
  vehiculo: Vehiculo;
  unidades: Unidad[] | undefined;
  actualizar: ReturnType<typeof useActualizarVehiculo>;
  eliminar: ReturnType<typeof useEliminarVehiculo>;
}) {
  const [editando, setEditando] = useState(false);
  const [campos, setCampos] = useState<FormState>(camposDesdeVehiculo(vehiculo));

  function cancelar() {
    setEditando(false);
    setCampos(camposDesdeVehiculo(vehiculo));
  }

  function guardar() {
    actualizar.mutate({ id: vehiculo.id, payload: toPayload(campos) }, { onSuccess: () => setEditando(false) });
  }

  if (!editando) {
    return (
      <tr className="border-t border-slate-100">
        <td className="px-5 py-3 font-medium text-slate-900">{vehiculo.patente}</td>
        <td className="px-5 py-3 text-slate-600">
          {vehiculo.unidad_numero}
          {vehiculo.unidad_torre ? ` (${vehiculo.unidad_torre})` : ""}
        </td>
        <td className="px-5 py-3 text-slate-600">
          {[vehiculo.marca, vehiculo.modelo].filter(Boolean).join(" ") || "—"}
        </td>
        <td className="px-5 py-3 text-slate-600">{vehiculo.color ?? "—"}</td>
        <td className="px-5 py-3 text-right">
          <button onClick={() => setEditando(true)} className="mr-3 text-slate-500 hover:text-slate-900">
            Editar
          </button>
          <button
            onClick={() => {
              if (confirm(`¿Eliminar el vehículo ${vehiculo.patente}?`)) eliminar.mutate(vehiculo.id);
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
          value={campos.patente}
          onChange={(e) => setCampos((c) => ({ ...c, patente: e.target.value.toUpperCase() }))}
          className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        />
      </td>
      <td className="px-3 py-2">
        <select
          value={campos.unidad_id}
          onChange={(e) => setCampos((c) => ({ ...c, unidad_id: e.target.value }))}
          className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        >
          {unidades?.map((u) => (
            <option key={u.id} value={u.id}>
              {u.numero}
              {u.torre ? ` (${u.torre})` : ""}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <div className="flex gap-1">
          <input
            value={campos.marca}
            onChange={(e) => setCampos((c) => ({ ...c, marca: e.target.value }))}
            placeholder="Marca"
            className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          />
          <input
            value={campos.modelo}
            onChange={(e) => setCampos((c) => ({ ...c, modelo: e.target.value }))}
            placeholder="Modelo"
            className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
      </td>
      <td className="px-3 py-2">
        <input
          value={campos.color}
          onChange={(e) => setCampos((c) => ({ ...c, color: e.target.value }))}
          className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
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

export default function VehiculosPage() {
  const queryClient = useQueryClient();
  const { data: unidades } = useQuery({ queryKey: ["unidades"], queryFn: () => fetchJson<Unidad[]>("/api/unidades") });
  const { data: vehiculos, isLoading } = useQuery({
    queryKey: ["vehiculos"],
    queryFn: () => fetchJson<Vehiculo[]>("/api/vehiculos"),
  });

  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [error, setError] = useState<string | null>(null);

  const actualizar = useActualizarVehiculo(queryClient, setError);
  const eliminar = useEliminarVehiculo(queryClient, setError);

  const crear = useMutation({
    mutationFn: async (payload: ReturnType<typeof toPayload>) => {
      const response = await fetch("/api/vehiculos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error((await response.json()).detail ?? "Error al crear el vehículo");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehiculos"] });
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
      <h1 className="text-2xl font-semibold text-slate-900">Vehículos</h1>
      <p className="mt-1 text-slate-500">Padrón maestro de vehículos vinculado a cada propiedad.</p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Propiedad</label>
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
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Patente</label>
          <input
            required
            value={form.patente}
            onChange={(e) => setForm((f) => ({ ...f, patente: e.target.value.toUpperCase() }))}
            className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Marca</label>
          <input
            value={form.marca}
            onChange={(e) => setForm((f) => ({ ...f, marca: e.target.value }))}
            className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Modelo</label>
          <input
            value={form.modelo}
            onChange={(e) => setForm((f) => ({ ...f, modelo: e.target.value }))}
            className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Color</label>
          <input
            value={form.color}
            onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
            className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={crear.isPending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          Agregar vehículo
        </button>
      </form>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3">Patente</th>
              <th className="px-5 py-3">Propiedad</th>
              <th className="px-5 py-3">Marca / Modelo</th>
              <th className="px-5 py-3">Color</th>
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
            {!isLoading && vehiculos?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-slate-400">
                  Sin vehículos registrados todavía.
                </td>
              </tr>
            )}
            {vehiculos?.map((v) => (
              <FilaVehiculo key={v.id} vehiculo={v} unidades={unidades} actualizar={actualizar} eliminar={eliminar} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
