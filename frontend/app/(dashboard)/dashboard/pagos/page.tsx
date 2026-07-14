"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { CargoPendiente, MetodoPago, Pago } from "@/lib/types";

const MESES_CORTO = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const METODOS: { value: MetodoPago; label: string }[] = [
  { value: "transferencia", label: "Transferencia" },
  { value: "efectivo", label: "Efectivo" },
  { value: "webpay", label: "Webpay" },
];

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo cargar ${url}`);
  return response.json();
}

function formatMonto(valor: string) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(Number(valor));
}

export default function PagosPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [seleccionado, setSeleccionado] = useState<CargoPendiente | null>(null);
  const [metodo, setMetodo] = useState<MetodoPago>("transferencia");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));

  const { data: pendientes, isLoading: cargandoPendientes } = useQuery({
    queryKey: ["pagos", "cargos-pendientes"],
    queryFn: () => fetchJson<CargoPendiente[]>("/api/pagos/cargos-pendientes"),
  });

  const { data: pagos, isLoading: cargandoPagos } = useQuery({
    queryKey: ["pagos"],
    queryFn: () => fetchJson<Pago[]>("/api/pagos"),
  });

  function invalidar() {
    queryClient.invalidateQueries({ queryKey: ["pagos"] });
    queryClient.invalidateQueries({ queryKey: ["gastos-comunes"] });
  }

  const registrar = useMutation({
    mutationFn: async () => {
      if (!seleccionado) return;
      const response = await fetch("/api/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cargo_id: seleccionado.id,
          monto: Number(seleccionado.monto_total),
          metodo,
          fecha_pago: fecha,
        }),
      });
      if (!response.ok) throw new Error((await response.json()).detail ?? "Error al registrar el pago");
      return response.json();
    },
    onSuccess: () => {
      invalidar();
      setSeleccionado(null);
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  const revertir = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/pagos/${id}/revertir`, { method: "POST" });
      if (!response.ok) throw new Error((await response.json()).detail ?? "Error al revertir el pago");
      return response.json();
    },
    onSuccess: () => invalidar(),
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Registro de Pagos</h1>
      <p className="mt-1 text-slate-500">
        Registra el pago de un cargo pendiente de gasto común. Un pago reversado libera el cargo
        automáticamente para volver a registrarlo.
      </p>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Cargos pendientes</h2>
          <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Unidad</th>
                  <th className="px-4 py-3">Período</th>
                  <th className="px-4 py-3">Monto</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {cargandoPendientes && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                      Cargando...
                    </td>
                  </tr>
                )}
                {!cargandoPendientes && pendientes?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                      No hay cargos pendientes.
                    </td>
                  </tr>
                )}
                {pendientes?.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSeleccionado(c)}
                    className={`cursor-pointer border-t border-slate-100 ${
                      seleccionado?.id === c.id ? "bg-slate-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {c.unidad_numero}
                      {c.unidad_torre ? ` (${c.unidad_torre})` : ""}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {MESES_CORTO[c.periodo_mes - 1]} {c.periodo_anio}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatMonto(c.monto_total)}</td>
                    <td className="px-4 py-3 text-right text-slate-400">Elegir</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {seleccionado && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-medium text-slate-900">
                Registrar pago — {seleccionado.unidad_numero} · {formatMonto(seleccionado.monto_total)}
              </p>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Método</label>
                  <select
                    value={metodo}
                    onChange={(e) => setMetodo(e.target.value as MetodoPago)}
                    className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {METODOS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Fecha de pago</label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  onClick={() => registrar.mutate()}
                  disabled={registrar.isPending}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
                >
                  Confirmar pago
                </button>
                <button
                  onClick={() => setSeleccionado(null)}
                  className="rounded-lg px-4 py-2 text-sm text-slate-500 hover:bg-slate-100"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-900">Historial de pagos</h2>
          <div className="mt-2 max-h-[28rem] overflow-y-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Unidad</th>
                  <th className="px-4 py-3">Monto</th>
                  <th className="px-4 py-3">Método</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {cargandoPagos && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                      Cargando...
                    </td>
                  </tr>
                )}
                {!cargandoPagos && pagos?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                      Aún no hay pagos registrados.
                    </td>
                  </tr>
                )}
                {pagos?.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {p.unidad_numero}
                      {p.unidad_torre ? ` (${p.unidad_torre})` : ""}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatMonto(p.monto)}</td>
                    <td className="px-4 py-3 text-slate-600 capitalize">{p.metodo}</td>
                    <td className="px-4 py-3 text-slate-600">{p.fecha_pago}</td>
                    <td className="px-4 py-3 text-right">
                      {p.reversado ? (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                          Reversado
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            if (confirm("¿Revertir este pago? El cargo volverá a estado pendiente."))
                              revertir.mutate(p.id);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          Revertir
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
