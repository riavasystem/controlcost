"use client";

import { useQuery } from "@tanstack/react-query";
import type { ResumenLey21442 } from "@/lib/types";

async function fetchResumen(): Promise<ResumenLey21442> {
  const response = await fetch("/api/ley21442/resumen");
  if (!response.ok) throw new Error("No se pudo cargar el resumen de cumplimiento");
  return response.json();
}

function formatMonto(valor: string) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(Number(valor));
}

export default function Ley21442Page() {
  const { data: resumen, isLoading } = useQuery({ queryKey: ["ley21442"], queryFn: fetchResumen });

  const items = resumen
    ? [
        {
          icon: "fa-scale-balanced",
          titulo: "Art. 20 N°4 — Recaudación y Contabilidad",
          detalle: `${resumen.periodos_gasto_comun} período(s) de gasto común registrados, con contabilidad auditable por período.`,
        },
        {
          icon: "fa-clipboard-list",
          titulo: "Registro de Copropietarios",
          detalle: `${resumen.total_residentes} residente(s) registrados sobre ${resumen.total_unidades} unidad(es), padrón siempre actualizado.`,
        },
        {
          icon: "fa-chart-line",
          titulo: "Rendición de Cuentas Transparente",
          detalle: `Balance financiero actual: ${formatMonto(resumen.balance_financiero)} (recaudado + ingresos − egresos).`,
        },
        {
          icon: "fa-money-bill-wave",
          titulo: "Gastos Comunes Transparentes",
          detalle: `${formatMonto(resumen.total_recaudado_historico)} recaudados históricamente, ${formatMonto(resumen.total_pendiente_historico)} pendientes.`,
        },
        {
          icon: "fa-shield-halved",
          titulo: "Mantenciones y Seguridad",
          detalle: `${resumen.total_proveedores_registrados} proveedor(es), ${resumen.total_vehiculos_registrados} vehículo(s) y ${resumen.total_turnos_guardia} turno(s) de guardia con bitácora digital.`,
        },
        {
          icon: "fa-clock",
          titulo: "Control de Accesos",
          detalle: `${resumen.total_visitas_registradas} visita(s) registradas con control de entrada/salida.`,
        },
      ]
    : [];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Ley 21.442</h1>
      <p className="mt-1 text-slate-500">
        Estado de cumplimiento de la Ley de Copropiedad Inmobiliaria, calculado en base a los datos reales
        registrados en el sistema.
      </p>

      {isLoading && <p className="mt-6 text-sm text-slate-400">Cargando...</p>}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.titulo} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
                <i className={`fa-solid ${item.icon} text-xs`} />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">{item.titulo}</h3>
            </div>
            <p className="mt-3 text-sm text-slate-600">{item.detalle}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
