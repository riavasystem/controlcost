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
  if (!response.ok) throw new Error("No se pudieron cargar las unidades");
  return response.json();
}

type FormState = {
  unidad_id: string;
  nombre: string;
  rut: string;
  telefono: string;
  email: string;
  numero_estacionamiento: string;
  numero_bodega: string;
  tipo: TipoResidente;
};
const FORM_INICIAL: FormState = {
  unidad_id: "",
  nombre: "",
  rut: "",
  telefono: "",
  email: "",
  numero_estacionamiento: "",
  numero_bodega: "",
  tipo: "propietario",
};

export default function ResidentesPage() {
  const queryClient = useQueryClient();
  const { data: residentes, isLoading } = useQuery({ queryKey: ["residentes"], queryFn: fetchResidentes });
  const { data: unidades } = useQuery({ queryKey: ["unidades"], queryFn: fetchUnidades });

  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toPayload(f: FormState) {
    return {
      unidad_id: f.unidad_id,
      nombre: f.nombre,
      rut: f.rut || null,
      telefono: f.telefono || null,
      email: f.email || null,
      numero_estacionamiento: f.numero_estacionamiento || null,
      numero_bodega: f.numero_bodega || null,
      tipo: f.tipo,
    };
  }

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

  const actualizar = useMutation({
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
      setForm(FORM_INICIAL);
      setEditandoId(null);
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  const eliminar = useMutation({
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.unidad_id) {
      setError("Selecciona una unidad");
      return;
    }
    const payload = toPayload(form);
    if (editandoId) {
      actualizar.mutate({ id: editandoId, payload });
    } else {
      crear.mutate(payload);
    }
  }

  function editar(residente: Residente) {
    setEditandoId(residente.id);
    setForm({
      unidad_id: residente.unidad_id,
      nombre: residente.nombre,
      rut: residente.rut ?? "",
      telefono: residente.telefono ?? "",
      email: residente.email ?? "",
      numero_estacionamiento: residente.numero_estacionamiento ?? "",
      numero_bodega: residente.numero_bodega ?? "",
      tipo: residente.tipo,
    });
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setForm(FORM_INICIAL);
    setError(null);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Residentes</h1>
      <p className="mt-1 text-slate-500">Personas asociadas a una unidad del condominio.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Unidad</label>
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
          <label className="mb-1 block text-xs font-medium text-slate-600">Nombre</label>
          <input
            required
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            className="w-48 rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
            placeholder="para enviar el gasto común"
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
          <label className="mb-1 block text-xs font-medium text-slate-600">N° Bodega</label>
          <input
            value={form.numero_bodega}
            onChange={(e) => setForm((f) => ({ ...f, numero_bodega: e.target.value }))}
            className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
          disabled={crear.isPending || actualizar.isPending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {editandoId ? "Guardar cambios" : "Agregar residente"}
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
              <th className="px-5 py-3">Nombre</th>
              <th className="px-5 py-3">Unidad</th>
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
                <td colSpan={9} className="px-5 py-6 text-center text-slate-400">Cargando...</td>
              </tr>
            )}
            {!isLoading && residentes?.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-6 text-center text-slate-400">Sin residentes registrados todavía.</td>
              </tr>
            )}
            {residentes?.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-5 py-3 font-medium text-slate-900">{r.nombre}</td>
                <td className="px-5 py-3 text-slate-600">
                  {r.unidad_torre ? `${r.unidad_torre} - ` : ""}
                  {r.unidad_numero ?? "—"}
                </td>
                <td className="px-5 py-3 text-slate-600">{r.rut ?? "—"}</td>
                <td className="px-5 py-3 text-slate-600">{r.telefono ?? "—"}</td>
                <td className="px-5 py-3 text-slate-600">{r.email ?? "—"}</td>
                <td className="px-5 py-3 text-slate-600">{r.numero_estacionamiento ?? "—"}</td>
                <td className="px-5 py-3 text-slate-600">{r.numero_bodega ?? "—"}</td>
                <td className="px-5 py-3 text-slate-600 capitalize">{r.tipo}</td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => editar(r)} className="mr-3 text-slate-500 hover:text-slate-900">
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar a ${r.nombre}?`)) eliminar.mutate(r.id);
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
