"use client";

import { useAuthStore } from "@/store/auth";
import { MODULOS } from "@/lib/modulos";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const activos = MODULOS.filter((m) => m.status === "activo").length;
  const total = MODULOS.length;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Resumen</h1>
      <p className="mt-1 text-slate-500">
        Bienvenido{user ? `, ${user.nombre}` : ""}. Este es el punto de partida de ControlCost — Fase 1
        (identidad y unidades) en construcción.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Módulos activos</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {activos} / {total}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Unidades</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">—</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Residentes</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">—</p>
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
