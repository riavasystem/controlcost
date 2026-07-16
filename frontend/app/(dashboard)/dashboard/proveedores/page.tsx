"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Proveedor } from "@/lib/types";

async function fetchProveedores(): Promise<Proveedor[]> {
  const response = await fetch("/api/proveedores");
  if (!response.ok) throw new Error("No se pudieron cargar los proveedores");
  return response.json();
}

type FormState = {
  nombre_empresa: string;
  rubro: string;
  contacto_nombre: string;
  telefono: string;
  email: string;
};
const FORM_INICIAL: FormState = {
  nombre_empresa: "",
  rubro: "",
  contacto_nombre: "",
  telefono: "",
  email: "",
};

function toPayload(f: FormState) {
  return {
    nombre_empresa: f.nombre_empresa,
    rubro: f.rubro,
    contacto_nombre: f.contacto_nombre || null,
    telefono: f.telefono || null,
    email: f.email || null,
  };
}

function camposDesdeProveedor(p: Proveedor): FormState {
  return {
    nombre_empresa: p.nombre_empresa,
    rubro: p.rubro,
    contacto_nombre: p.contacto_nombre ?? "",
    telefono: p.telefono ?? "",
    email: p.email ?? "",
  };
}

function useActualizarProveedor(queryClient: ReturnType<typeof useQueryClient>, setError: (e: string | null) => void) {
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: ReturnType<typeof toPayload> }) => {
      const response = await fetch(`/api/proveedores/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error((await response.json()).detail ?? "Error al actualizar el proveedor");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proveedores"] });
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });
}

function useEliminarProveedor(queryClient: ReturnType<typeof useQueryClient>, setError: (e: string | null) => void) {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/proveedores/${id}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) {
        throw new Error((await response.json()).detail ?? "Error al eliminar el proveedor");
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["proveedores"] }),
    onError: (e: Error) => setError(e.message),
  });
}

function FilaProveedor({
  proveedor,
  actualizar,
  eliminar,
}: {
  proveedor: Proveedor;
  actualizar: ReturnType<typeof useActualizarProveedor>;
  eliminar: ReturnType<typeof useEliminarProveedor>;
}) {
  const [editando, setEditando] = useState(false);
  const [campos, setCampos] = useState<FormState>(camposDesdeProveedor(proveedor));

  function cancelar() {
    setEditando(false);
    setCampos(camposDesdeProveedor(proveedor));
  }

  function guardar() {
    actualizar.mutate({ id: proveedor.id, payload: toPayload(campos) }, { onSuccess: () => setEditando(false) });
  }

  if (!editando) {
    return (
      <tr className="border-t border-slate-100">
        <td className="px-5 py-3 font-medium text-slate-900">{proveedor.nombre_empresa}</td>
        <td className="px-5 py-3 text-slate-600">{proveedor.rubro}</td>
        <td className="px-5 py-3 text-slate-600">{proveedor.contacto_nombre ?? "—"}</td>
        <td className="px-5 py-3 text-slate-600">{proveedor.telefono ?? "—"}</td>
        <td className="px-5 py-3 text-slate-600">{proveedor.email ?? "—"}</td>
        <td className="px-5 py-3 text-right">
          <button onClick={() => setEditando(true)} className="mr-3 text-slate-500 hover:text-slate-900">
            Editar
          </button>
          <button
            onClick={() => {
              if (confirm(`¿Eliminar el proveedor ${proveedor.nombre_empresa}?`)) eliminar.mutate(proveedor.id);
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
          value={campos.nombre_empresa}
          onChange={(e) => setCampos((c) => ({ ...c, nombre_empresa: e.target.value }))}
          className="w-36 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        />
      </td>
      <td className="px-3 py-2">
        <input
          value={campos.rubro}
          onChange={(e) => setCampos((c) => ({ ...c, rubro: e.target.value }))}
          className="w-32 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        />
      </td>
      <td className="px-3 py-2">
        <input
          value={campos.contacto_nombre}
          onChange={(e) => setCampos((c) => ({ ...c, contacto_nombre: e.target.value }))}
          className="w-32 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
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

export default function ProveedoresPage() {
  const queryClient = useQueryClient();
  const { data: proveedores, isLoading } = useQuery({ queryKey: ["proveedores"], queryFn: fetchProveedores });

  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [error, setError] = useState<string | null>(null);

  const actualizar = useActualizarProveedor(queryClient, setError);
  const eliminar = useEliminarProveedor(queryClient, setError);

  const crear = useMutation({
    mutationFn: async (payload: ReturnType<typeof toPayload>) => {
      const response = await fetch("/api/proveedores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error((await response.json()).detail ?? "Error al crear el proveedor");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proveedores"] });
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
      <h1 className="text-2xl font-semibold text-slate-900">Proveedores</h1>
      <p className="mt-1 text-slate-500">Directorio de servicios externos del condominio.</p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Empresa</label>
          <input
            required
            value={form.nombre_empresa}
            onChange={(e) => setForm((f) => ({ ...f, nombre_empresa: e.target.value }))}
            className="w-44 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Rubro</label>
          <input
            required
            placeholder="Jardinería, electricidad..."
            value={form.rubro}
            onChange={(e) => setForm((f) => ({ ...f, rubro: e.target.value }))}
            className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Contacto</label>
          <input
            value={form.contacto_nombre}
            onChange={(e) => setForm((f) => ({ ...f, contacto_nombre: e.target.value }))}
            className="w-36 rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
          <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-44 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={crear.isPending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          Agregar proveedor
        </button>
      </form>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3">Empresa</th>
              <th className="px-5 py-3">Rubro</th>
              <th className="px-5 py-3">Contacto</th>
              <th className="px-5 py-3">Teléfono</th>
              <th className="px-5 py-3">Email</th>
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
            {!isLoading && proveedores?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-slate-400">
                  Sin proveedores registrados todavía.
                </td>
              </tr>
            )}
            {proveedores?.map((p) => (
              <FilaProveedor key={p.id} proveedor={p} actualizar={actualizar} eliminar={eliminar} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
