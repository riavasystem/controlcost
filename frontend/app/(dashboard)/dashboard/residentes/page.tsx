"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Residente, TipoResidente, Unidad } from "@/lib/types";

async function fetchResidentes(): Promise<Residente[]> {
  const response = await fetch("/api/residentes");
  if (!response.ok) throw new Error("No se pudieron cargar los residentes");
  return response.json();
}

async function fetchUnidades(): Promise<Unidad[]> {
  const response = await fetch("/api/unidades");
  if (!response.ok) throw new Error("No se pudieron cargar las propiedades");
  return response.json();
}

type FormState = {
  unidad_id: string;
  nombre: string;
  apellido: string;
  rut: string;
  telefono: string;
  email: string;
  numero_estacionamiento: string;
  tipo: TipoResidente;
};
const FORM_INICIAL: FormState = {
  unidad_id: "",
  nombre: "",
  apellido: "",
  rut: "",
  telefono: "",
  email: "",
  numero_estacionamiento: "",
  tipo: "propietario",
};

function toPayload(f: FormState) {
  return {
    unidad_id: f.unidad_id,
    nombre: f.nombre,
    apellido: f.apellido || null,
    rut: f.rut || null,
    telefono: f.telefono || null,
    email: f.email || null,
    numero_estacionamiento: f.numero_estacionamiento || null,
    tipo: f.tipo,
  };
}

function camposDesdeResidente(residente: Residente): FormState {
  return {
    unidad_id: residente.unidad_id,
    nombre: residente.nombre,
    apellido: residente.apellido ?? "",
    rut: residente.rut ?? "",
    telefono: residente.telefono ?? "",
    email: residente.email ?? "",
    numero_estacionamiento: residente.numero_estacionamiento ?? "",
    tipo: residente.tipo,
  };
}

function useActualizarResidente(queryClient: ReturnType<typeof useQueryClient>, setError: (e: string | null) => void) {
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: ReturnType<typeof toPayload> }) => {
      const response = await fetch(`/api/residentes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error((await response.json()).detail ?? "Error al actualizar el residente");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["residentes"] });
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });
}

function useEliminarResidente(queryClient: ReturnType<typeof useQueryClient>, setError: (e: string | null) => void) {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/residentes/${id}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) {
        throw new Error((await response.json()).detail ?? "Error al eliminar el residente");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["residentes"] });
      queryClient.invalidateQueries({ queryKey: ["unidades"] });
    },
    onError: (e: Error) => setError(e.message),
  });
}

function FilaResidente({
  residente,
  unidades,
  actualizar,
  eliminar,
}: {
  residente: Residente;
  unidades: Unidad[] | undefined;
  actualizar: ReturnType<typeof useActualizarResidente>;
  eliminar: ReturnType<typeof useEliminarResidente>;
}) {
  const [editando, setEditando] = useState(false);
  const [campos, setCampos] = useState<FormState>(camposDesdeResidente(residente));

  function cancelar() {
    setEditando(false);
    setCampos(camposDesdeResidente(residente));
  }

  function guardar() {
    actualizar.mutate({ id: residente.id, payload: toPayload(campos) }, { onSuccess: () => setEditando(false) });
  }

  if (!editando) {
    return (
      <tr className="border-t border-slate-100">
        <td className="px-5 py-3 font-medium text-slate-900">{residente.nombre}</td>
        <td className="px-5 py-3 text-slate-600">{residente.apellido ?? "—"}</td>
        <td className="px-5 py-3 text-slate-600">
          {residente.unidad_torre ? `${residente.unidad_torre} - ` : ""}
          {residente.unidad_numero ?? "—"}
        </td>
        <td className="px-5 py-3 text-slate-600">{residente.rut ?? "—"}</td>
        <td className="px-5 py-3 text-slate-600">{residente.telefono ?? "—"}</td>
        <td className="px-5 py-3 text-slate-600">{residente.email ?? "—"}</td>
        <td className="px-5 py-3 text-slate-600">{residente.numero_estacionamiento ?? "—"}</td>
        <td className="px-5 py-3 text-slate-600">{residente.unidad_numero_bodega ?? "—"}</td>
        <td className="px-5 py-3 text-slate-600 capitalize">{residente.tipo}</td>
        <td className="px-5 py-3 text-right">
          <button onClick={() => setEditando(true)} className="mr-3 text-slate-500 hover:text-slate-900">
            Editar
          </button>
          <button
            onClick={() => {
              if (confirm(`¿Eliminar a ${residente.nombre}?`)) eliminar.mutate(residente.id);
            }}
            className="text-red-500 hover:text-red-700"
          >
            Eliminar
          </button>
        </td>
      </tr>
    );
  }

  const bodegaUnidad = unidades?.find((u) => u.id === campos.unidad_id)?.numero_bodega ?? "—";

  return (
    <tr className="border-t border-slate-100 bg-slate-50">
      <td className="px-3 py-2">
        <input
          value={campos.nombre}
          onChange={(e) => setCampos((c) => ({ ...c, nombre: e.target.value }))}
          className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        />
      </td>
      <td className="px-3 py-2">
        <input
          value={campos.apellido}
          onChange={(e) => setCampos((c) => ({ ...c, apellido: e.target.value }))}
          className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
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
              {u.torre ? `${u.torre} - ` : ""}
              {u.numero}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[11px] text-slate-400">Bodega: {bodegaUnidad}</p>
      </td>
      <td className="px-3 py-2">
        <input
          value={campos.rut}
          onChange={(e) => setCampos((c) => ({ ...c, rut: e.target.value }))}
          className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        />
      </td>
      <td className="px-3 py-2">
        <input
          value={campos.telefono}
          onChange={(e) => setCampos((c) => ({ ...c, telefono: e.target.value }))}
          className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="email"
          value={campos.email}
          onChange={(e) => setCampos((c) => ({ ...c, email: e.target.value }))}
          className="w-40 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        />
      </td>
      <td className="px-3 py-2">
        <input
          value={campos.numero_estacionamiento}
          onChange={(e) => setCampos((c) => ({ ...c, numero_estacionamiento: e.target.value }))}
          className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        />
      </td>
      <td className="px-5 py-3 text-slate-600">{residente.unidad_numero_bodega ?? "—"}</td>
      <td className="px-3 py-2">
        <select
          value={campos.tipo}
          onChange={(e) => setCampos((c) => ({ ...c, tipo: e.target.value as TipoResidente }))}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="propietario">Propietario</option>
          <option value="arrendatario">Arrendatario</option>
        </select>
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

export default function ResidentesPage() {
  const queryClient = useQueryClient();
  const { data: residentes, isLoading } = useQuery({ queryKey: ["residentes"], queryFn: fetchResidentes });
  const { data: unidades } = useQuery({ queryKey: ["unidades"], queryFn: fetchUnidades });

  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [error, setError] = useState<string | null>(null);

  const actualizar = useActualizarResidente(queryClient, setError);
  const eliminar = useEliminarResidente(queryClient, setError);

  const crear = useMutation({
    mutationFn: async (payload: ReturnType<typeof toPayload>) => {
      const response = await fetch("/api/residentes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error((await response.json()).detail ?? "Error al crear el residente");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["residentes"] });
      queryClient.invalidateQueries({ queryKey: ["unidades"] });
      setForm(FORM_INICIAL);
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.unidad_id) {
      setError("Selecciona una propiedad");
      return;
    }
    crear.mutate(toPayload(form));
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Residentes</h1>
      <p className="mt-1 text-slate-500">Personas asociadas a una propiedad del condominio.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Propiedad</label>
          <select
            required
            value={form.unidad_id}
            onChange={(e) => setForm((f) => ({ ...f, unidad_id: e.target.value }))}
            className="w-36 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Selecciona...</option>
            {unidades?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.torre ? `${u.torre} - ` : ""}
                {u.numero}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">N° Bodega</label>
          <div className="flex h-9 w-24 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
            {unidades?.find((u) => u.id === form.unidad_id)?.numero_bodega ?? "—"}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Nombre</label>
          <input
            required
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Apellido</label>
          <input
            value={form.apellido}
            onChange={(e) => setForm((f) => ({ ...f, apellido: e.target.value }))}
            className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">RUT</label>
          <input
            value={form.rut}
            onChange={(e) => setForm((f) => ({ ...f, rut: e.target.value }))}
            className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Teléfono</label>
          <input
            value={form.telefono}
            onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
            className="w-36 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Correo</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="para enviar información"
            className="w-52 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">N° Estacionamiento</label>
          <input
            value={form.numero_estacionamiento}
            onChange={(e) => setForm((f) => ({ ...f, numero_estacionamiento: e.target.value }))}
            className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Tipo</label>
          <select
            value={form.tipo}
            onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as TipoResidente }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="propietario">Propietario</option>
            <option value="arrendatario">Arrendatario</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={crear.isPending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          Agregar residente
        </button>
      </form>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3">Nombre</th>
              <th className="px-5 py-3">Apellido</th>
              <th className="px-5 py-3">Propiedad</th>
              <th className="px-5 py-3">RUT</th>
              <th className="px-5 py-3">Teléfono</th>
              <th className="px-5 py-3">Correo</th>
              <th className="px-5 py-3">N° Estac.</th>
              <th className="px-5 py-3">N° Bodega</th>
              <th className="px-5 py-3">Tipo</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={10} className="px-5 py-6 text-center text-slate-400">Cargando...</td>
              </tr>
            )}
            {!isLoading && residentes?.length === 0 && (
              <tr>
                <td colSpan={10} className="px-5 py-6 text-center text-slate-400">Sin residentes registrados todavía.</td>
              </tr>
            )}
            {residentes?.map((r) => (
              <FilaResidente key={r.id} residente={r} unidades={unidades} actualizar={actualizar} eliminar={eliminar} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
