"use client";

import { useAuthStore } from "@/store/auth";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Resumen</h1>
      <p className="mt-1 text-slate-500">
        Bienvenido{user ? `, ${user.nombre}` : ""}. Este es el punto de partida de ControlCost — Fase 1
        (identidad y unidades) en construcción.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {["Unidades", "Residentes", "Condominio"].map((label) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">—</p>
          </div>
        ))}
      </div>
    </div>
  );
}
