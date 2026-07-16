"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { PeriodoGastoComun, PeriodoGastoComunDetalle, Unidad } from "@/lib/types";

function InfoTooltip({ texto }: { texto: string }) {
  return (
    <span className="group relative inline-flex">
      <span className="flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full bg-slate-300 text-[10px] font-bold leading-none text-white">
        i
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 w-48 -translate-x-1/2 rounded-lg bg-slate-900 px-2.5 py-1.5 text-center text-[11px] font-normal normal-case leading-snug text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {texto}
      </span>
    </span>
  );
}

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

async function fetchPeriodos(): Promise<PeriodoGastoComun[]> {
  const response = await fetch("/api/gastos-comunes");
  if (!response.ok) throw new Error("No se pudieron cargar los períodos de gasto común");
  return response.json();
}

async function fetchPeriodo(id: string): Promise<PeriodoGastoComunDetalle> {
  const response = await fetch(`/api/gastos-comunes/${id}`);
  if (!response.ok) throw new Error("No se pudo cargar el período");
  return response.json();
}

async function fetchUnidades(): Promise<Unidad[]> {
  const response = await fetch("/api/unidades");
  if (!response.ok) throw new Error("No se pudieron cargar las unidades");
  return response.json();
}

const TODAS_LAS_TORRES = "__todas__";

const hoy = new Date();
type FormState = {
  anio: string;
  mes: string;
  tarifa_m2: string;
  extraordinario: string;
  extraordinario_torre: string;
  considerar_bodega: "si" | "no";
  descripcion: string;
};
const FORM_INICIAL: FormState = {
  anio: String(hoy.getFullYear()),
  mes: String(hoy.getMonth() + 1),
  tarifa_m2: "",
  extraordinario: "0",
  extraordinario_torre: TODAS_LAS_TORRES,
  considerar_bodega: "no",
  descripcion: "",
};

function formatMonto(valor: string) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(Number(valor));
}

export default function GastosComunesPage() {
  const queryClient = useQueryClient();
  const { data: periodos, isLoading } = useQuery({ queryKey: ["gastos-comunes"], queryFn: fetchPeriodos });
  const { data: unidades } = useQuery({ queryKey: ["unidades"], queryFn: fetchUnidades });

  const torres = useMemo(() => {
    const set = new Set<string>();
    for (const u of unidades ?? []) {
      if (u.torre) set.add(u.torre);
    }
    return Array.from(set).sort();
  }, [unidades]);

  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [error, setError] = useState<string | null>(null);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [mensajeEnvio, setMensajeEnvio] = useState<string | null>(null);

  const { data: detalle, isLoading: cargandoDetalle } = useQuery({
    queryKey: ["gastos-comunes", seleccionado],
    queryFn: () => fetchPeriodo(seleccionado as string),
    enabled: !!seleccionado,
  });

  const crear = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await fetch("/api/gastos-comunes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error((await response.json()).detail ?? "Error al crear el período");
      return response.json();
    },
    onSuccess: (creado: PeriodoGastoComunDetalle) => {
      queryClient.invalidateQueries({ queryKey: ["gastos-comunes"] });
      setForm(FORM_INICIAL);
      setError(null);
      setSeleccionado(creado.id);
    },
    onError: (e: Error) => setError(e.message),
  });

  const enviarAPropietarios = useMutation({
    mutationFn: async (periodo: PeriodoGastoComunDetalle) => {
      const response = await fetch(`/api/gastos-comunes/${periodo.id}/pdf`);
      if (!response.ok) throw new Error("No se pudo generar el PDF del período");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `gasto-comun-${periodo.anio}-${String(periodo.mes).padStart(2, "0")}.pdf`;
      enlace.click();
      URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      setMensajeEnvio(
        "Se generó el Gasto Común correspondiente en PDF (se descargó en tu equipo). Aún no tenemos un correo " +
          "configurado, así que todavía no se envía automáticamente a los propietarios — puedes reenviarles el PDF " +
          "manualmente mientras tanto.",
      );
    },
    onError: () => setMensajeEnvio("No se pudo generar el PDF del período. Intenta nuevamente."),
  });

  const eliminar = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/gastos-comunes/${id}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) {
        throw new Error((await response.json()).detail ?? "Error al eliminar el período");
      }
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["gastos-comunes"] });
      if (seleccionado === id) setSeleccionado(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  const togglePagado = useMutation({
    mutationFn: async ({ cargoId, pagado }: { cargoId: string; pagado: boolean }) => {
      const response = await fetch(`/api/gastos-comunes/${seleccionado}/cargos/${cargoId}?pagado=${pagado}`, {
        method: "PATCH",
      });
      if (!response.ok) throw new Error((await response.json()).detail ?? "Error al actualizar el cargo");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gastos-comunes"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    crear.mutate({
      anio: Number(form.anio),
      mes: Number(form.mes),
      tarifa_m2: Number(form.tarifa_m2),
      extraordinario: Number(form.extraordinario || 0),
      extraordinario_torre: form.extraordinario_torre === TODAS_LAS_TORRES ? null : form.extraordinario_torre,
      considerar_bodega: form.considerar_bodega === "si",
      descripcion: form.descripcion || null,
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Gastos Comunes</h1>
      <p className="mt-1 text-slate-500">
        Genera el cobro mensual por m² más extraordinarios. El sistema crea automáticamente un cargo por
        cada unidad del condominio.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Mes</label>
          <select
            value={form.mes}
            onChange={(e) => setForm((f) => ({ ...f, mes: e.target.value }))}
            className="w-36 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {MESES.map((nombre, i) => (
              <option key={nombre} value={i + 1}>
                {nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Año</label>
          <input
            type="number"
            required
            value={form.anio}
            onChange={(e) => setForm((f) => ({ ...f, anio: e.target.value }))}
            className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Tarifa $/m²</label>
          <input
            type="number"
            step="0.01"
            required
            value={form.tarifa_m2}
            onChange={(e) => setForm((f) => ({ ...f, tarifa_m2: e.target.value }))}
            className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-600">
            Cobro Extra ($)
            <InfoTooltip texto="Cobro puntual ej: reparación portón" />
          </label>
          <input
            type="number"
            step="0.01"
            value={form.extraordinario}
            onChange={(e) => setForm((f) => ({ ...f, extraordinario: e.target.value }))}
            className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Torre / Sector</label>
          <select
            value={form.extraordinario_torre}
            onChange={(e) => setForm((f) => ({ ...f, extraordinario_torre: e.target.value }))}
            className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value={TODAS_LAS_TORRES}>Aplicar a todos</option>
            {torres.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-600">
            Considerar Bodega
            <InfoTooltip texto="¿Considerar el cobro del metraje de bodega en el Gasto Común?" />
          </label>
          <select
            value={form.considerar_bodega}
            onChange={(e) => setForm((f) => ({ ...f, considerar_bodega: e.target.value as "si" | "no" }))}
            className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="no">No</option>
            <option value="si">Si</option>
          </select>
        </div>
        <div className="min-w-50 flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600">Descripción (opcional)</label>
          <input
            value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={crear.isPending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          Generar período
        </button>
      </form>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">¿Cómo se calcula el cobro de cada unidad?</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <span className="font-medium">Monto base</span> = Tarifa $/m² × metraje de la unidad. Por eso unidades
            más grandes pagan un gasto común base más alto.
          </li>
          <li>
            <span className="font-medium">Considerar Bodega</span> (Si/No) suma el metraje de la bodega de la
            unidad al cálculo del monto base. Si se deja en No, la bodega no se cobra.
          </li>
          <li>
            <span className="font-medium">Cobro Extra</span> = un monto fijo (no se prorratea por m²) para cobros
            puntuales aprobados en asamblea que no son parte del gasto común habitual: reparaciones mayores, fondo
            de reserva, obras, etc. Si el período no tiene ningún cobro extra, se deja en $0.
          </li>
          <li>
            <span className="font-medium">Torre / Sector</span> define a quién se le aplica ese Cobro Extra:
            puedes elegir una torre/sector específico (ej. solo Torre 1, porque solo esta torre tiene ascensor) o
            &quot;Aplicar a todos&quot; para cobrárselo a todas las unidades del condominio, ej: reparación del portón.
          </li>
          <li>
            <span className="font-medium">Total a pagar</span> = Monto base + Cobro Extra (si corresponde a esa
            unidad).
          </li>
        </ul>
        <p className="mt-3">
          <span className="font-medium">NOTA:</span> Si se selecciona un cobro extra a una (Torre / Sector)
          específico y no a todos, al generar el GGCC el cobro extra considerará solo a las unidades que
          pertenecen a la (Torre / Sector) seleccionado, las demás unidades no reflejarán este cobro extra.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Período</th>
                <th className="px-5 py-3">Recaudado</th>
                <th className="px-5 py-3">Pendiente</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-slate-400">
                    Cargando...
                  </td>
                </tr>
              )}
              {!isLoading && periodos?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-slate-400">
                    Aún no hay períodos generados.
                  </td>
                </tr>
              )}
              {periodos?.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => {
                    setSeleccionado(p.id);
                    setMensajeEnvio(null);
                  }}
                  className={`cursor-pointer border-t border-slate-100 ${
                    seleccionado === p.id ? "bg-slate-50" : "hover:bg-slate-50"
                  }`}
                >
                  <td className="px-5 py-3 font-medium text-slate-900">
                    {MESES[p.mes - 1]} {p.anio}
                  </td>
                  <td className="px-5 py-3 text-emerald-700">{formatMonto(p.total_recaudado)}</td>
                  <td className="px-5 py-3 text-amber-700">{formatMonto(p.total_pendiente)}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`¿Eliminar el período ${MESES[p.mes - 1]} ${p.anio}?`)) eliminar.mutate(p.id);
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

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          {!seleccionado && (
            <p className="text-sm text-slate-400">Selecciona un período para ver el detalle por unidad.</p>
          )}
          {seleccionado && cargandoDetalle && <p className="text-sm text-slate-400">Cargando detalle...</p>}
          {seleccionado && detalle && (
            <div>
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-900">
                  Detalle {MESES[detalle.mes - 1]} {detalle.anio}
                </h2>
                <button
                  onClick={() => {
                    setMensajeEnvio(null);
                    enviarAPropietarios.mutate(detalle);
                  }}
                  disabled={enviarAPropietarios.isPending}
                  className="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-60"
                >
                  {enviarAPropietarios.isPending ? "Generando..." : "Enviar a propietarios"}
                </button>
              </div>
              {mensajeEnvio && (
                <p className="mt-2 rounded-lg bg-sky-50 px-3 py-2 text-xs text-slate-700">{mensajeEnvio}</p>
              )}
              <p className="mt-2 text-xs text-slate-500">
                Tarifa ${detalle.tarifa_m2}/m² · Cobro Extra {formatMonto(detalle.extraordinario)}
                {detalle.extraordinario_torre ? ` (solo ${detalle.extraordinario_torre})` : " (todas las unidades)"}
                {" · "}Considerar Bodega: {detalle.considerar_bodega ? "Si" : "No"}
                {detalle.descripcion ? ` · ${detalle.descripcion}` : ""}
              </p>
              <div className="mt-4 max-h-96 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-slate-500">
                    <tr>
                      <th className="py-2">Unidad</th>
                      <th className="py-2">Total</th>
                      <th className="py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalle.cargos.map((c) => (
                      <tr key={c.id} className="border-t border-slate-100">
                        <td className="py-2 font-medium text-slate-900">
                          {c.unidad_numero}
                          {c.unidad_torre ? ` (${c.unidad_torre})` : ""}
                        </td>
                        <td className="py-2 text-slate-600">{formatMonto(c.monto_total)}</td>
                        <td className="py-2">
                          <button
                            onClick={() => togglePagado.mutate({ cargoId: c.id, pagado: !c.pagado })}
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              c.pagado ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {c.pagado ? "Pagado" : "Pendiente"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
