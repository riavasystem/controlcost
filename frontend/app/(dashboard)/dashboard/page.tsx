"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { MODULOS } from "@/lib/modulos";
import type { PeriodoGastoComun, Residente, ResumenFinanciero, Unidad } from "@/lib/types";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo cargar ${url}`);
  return response.json();
}

function formatMonto(valor: string) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(Number(valor));
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const activos = MODULOS.filter((m) => m.status === "activo").length;
  const total = MODULOS.length;

  const { data: unidades } = useQuery({ queryKey: ["unidades"], queryFn: () => fetchJson<Unidad[]>("/api/unidades") });
  const { data: residentes } = useQuery({
    queryKey: ["residentes"],
    queryFn: () => fetchJson<Residente[]>("/api/residentes"),
  });
  const { data: periodos } = useQuery({
    queryKey: ["gastos-comunes"],
    queryFn: () => fetchJson<PeriodoGastoComun[]>("/api/gastos-comunes"),
  });
  const { data: resumenFinanciero } = useQuery({
    queryKey: ["finanzas", "resumen"],
    queryFn: () => fetchJson<ResumenFinanciero>("/api/finanzas/resumen"),
  });

  const periodoActual = periodos?.[0];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Resumen</h1>
      <p className="mt-1 text-slate-500">
        Bienvenido{user ? `, ${user.nombre}` : ""}. Este es el punto de partida de ControlCost — Fase 1
        (identidad y unidades) en construcción.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Módulos activos</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {activos} / {total}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Propiedades</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{unidades?.length ?? "—"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Residentes</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{residentes?.length ?? "—"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Recaudado último período</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-700">
            {periodoActual ? formatMonto(periodoActual.total_recaudado) : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Pendiente último período</p>
          <p className="mt-2 text-2xl font-semibold text-amber-700">
            {periodoActual ? formatMonto(periodoActual.total_pendiente) : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Balance financiero</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {resumenFinanciero ? formatMonto(resumenFinanciero.balance) : "—"}
          </p>
        </div>
      </div>

      <h2 className="mt-10 text-lg font-semibold text-slate-900">Módulos del sistema</h2>
      <p className="mt-1 text-sm text-slate-500">
        Estado de cada módulo del ERP. Los módulos activos ya tienen datos reales; el resto se irá
        habilitando en las próximas fases.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MODULOS.map((modulo) => (
          <a
            key={modulo.slug}
            href={modulo.href}
            className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                modulo.status === "activo" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              <i className={`fa-solid ${modulo.icon} text-xs`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-slate-900">{modulo.name}</p>
                {modulo.status === "activo" ? (
                  <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                    Activo
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                    Próximamente
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">{modulo.description}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
