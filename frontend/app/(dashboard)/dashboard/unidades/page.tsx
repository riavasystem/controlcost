"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Condominio, Unidad } from "@/lib/types";

async function fetchUnidades(): Promise<Unidad[]> {
  const response = await fetch("/api/unidades");
  if (!response.ok) throw new Error("No se pudieron cargar las unidades");
  return response.json();
}

async function fetchCondominio(): Promise<Condominio> {
  const response = await fetch("/api/condominio");
  if (!response.ok) throw new Error("No se pudo cargar el condominio");
  return response.json();
}

function imagenSrc(imagenUrl: string | null): string | null {
  if (!imagenUrl) return null;
  return `/api/uploads/${imagenUrl.replace(/^\/uploads\//, "")}`;
}

function CondominioForm() {
  const queryClient = useQueryClient();
  const { data: condominio } = useQuery({ queryKey: ["condominio"], queryFn: fetchCondominio });

  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [comuna, setComuna] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [estacionamientosVisita, setEstacionamientosVisita] = useState("");
  const [imagen, setImagen] = useState<File | null>(null);
  const [inicializado, setInicializado] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    if (!condominio || inicializado) return;
    setNombre(condominio.nombre);
    setDireccion(condominio.direccion ?? "");
    setComuna(condominio.comuna ?? "");
    setCiudad(condominio.ciudad ?? "");
    setEstacionamientosVisita(condominio.estacionamientos_visita?.toString() ?? "");
    setInicializado(true);
  }, [condominio, inicializado]);

  const guardar = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.set("nombre", nombre);
      formData.set("direccion", direccion);
      formData.set("comuna", comuna);
      formData.set("ciudad", ciudad);
      if (estacionamientosVisita) formData.set("estacionamientos_visita", estacionamientosVisita);
      if (imagen) formData.set("imagen", imagen);

      const response = await fetch("/api/condominio", { method: "PUT", body: formData });
      if (!response.ok) throw new Error((await response.json()).detail ?? "Error al guardar el condominio");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["condominio"] });
      setImagen(null);
      setMensaje("Datos del condominio guardados.");
    },
    onError: (e: Error) => setMensaje(e.message),
  });

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-900">Datos del Condominio</h2>
      <p className="mt-1 text-xs text-slate-500">
        Esta información aparece en el encabezado del PDF de Gasto Común y en los documentos del condominio.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          guardar.mutate();
        }}
        className="mt-4 flex flex-wrap items-end gap-3"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Nombre</label>
          <input
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-48 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Dirección</label>
          <input
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            className="w-56 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Comuna</label>
          <input
            value={comuna}
            onChange={(e) => setComuna(e.target.value)}
            className="w-36 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Ciudad</label>
          <input
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            className="w-36 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Estacionamientos de visita</label>
          <input
            type="number"
            min={0}
            value={estacionamientosVisita}
            onChange={(e) => setEstacionamientosVisita(e.target.value)}
            className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Imagen del condominio</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setImagen(e.target.files?.[0] ?? null)}
            className="w-56 rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
          />
        </div>
        <button
          type="submit"
          disabled={guardar.isPending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {guardar.isPending ? "Guardando..." : "Guardar"}
        </button>
      </form>
      {mensaje && <p className="mt-3 rounded-lg bg-sky-50 px-3 py-2 text-xs text-slate-700">{mensaje}</p>}
      {condominio && imagenSrc(condominio.imagen_url) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imagenSrc(condominio.imagen_url)!}
          alt={condominio.nombre}
          className="mt-4 h-28 w-auto rounded-lg border border-slate-200 object-cover"
        />
      )}
    </div>
  );
}

type FormState = {
  numero: string;
  torre: string;
  metraje: string;
  numero_bodega: string;
  metraje_bodega: string;
};
const FORM_INICIAL: FormState = {
  numero: "",
  torre: "",
  metraje: "",
  numero_bodega: "",
  metraje_bodega: "",
};

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
      numero_bodega: f.numero_bodega || null,
      metraje_bodega: f.metraje_bodega ? Number(f.metraje_bodega) : null,
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
    setForm({
      numero: unidad.numero,
      torre: unidad.torre ?? "",
      metraje: unidad.metraje ?? "",
      numero_bodega: unidad.numero_bodega ?? "",
      metraje_bodega: unidad.metraje_bodega ?? "",
    });
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

      <div className="mt-6">
        <CondominioForm />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5">
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
          <label className="mb-1 block text-xs font-medium text-slate-600">Metraje Prop. (m²)</label>
          <input
            type="number"
            step="0.01"
            value={form.metraje}
            onChange={(e) => setForm((f) => ({ ...f, metraje: e.target.value }))}
            className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Metraje Bodega (m²)</label>
          <input
            type="number"
            step="0.01"
            value={form.metraje_bodega}
            onChange={(e) => setForm((f) => ({ ...f, metraje_bodega: e.target.value }))}
            className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">N° Bodega</label>
          <input
            value={form.numero_bodega}
            onChange={(e) => setForm((f) => ({ ...f, numero_bodega: e.target.value }))}
            className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
              <th className="px-5 py-3">Metraje Prop.</th>
              <th className="px-5 py-3">N° Bodega</th>
              <th className="px-5 py-3">Metraje Bodega</th>
              <th className="px-5 py-3">Residentes</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-5 py-6 text-center text-slate-400">Cargando...</td>
              </tr>
            )}
            {!isLoading && unidades?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-6 text-center text-slate-400">Sin unidades registradas todavía.</td>
              </tr>
            )}
            {unidades?.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-5 py-3 font-medium text-slate-900">{u.numero}</td>
                <td className="px-5 py-3 text-slate-600">{u.torre ?? "—"}</td>
                <td className="px-5 py-3 text-slate-600">{u.metraje ? `${u.metraje} m²` : "—"}</td>
                <td className="px-5 py-3 text-slate-600">{u.numero_bodega ?? "—"}</td>
                <td className="px-5 py-3 text-slate-600">{u.metraje_bodega ? `${u.metraje_bodega} m²` : "—"}</td>
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
