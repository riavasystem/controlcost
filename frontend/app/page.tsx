import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ControlCost — Gestión moderna de condominios",
  description:
    "Administra residentes, unidades, gastos comunes y comunicados de tu condominio desde un solo panel, sin planillas ni papeles.",
  openGraph: {
    title: "ControlCost — Gestión moderna de condominios",
    description: "El panel de administración para condominios que reemplaza planillas, WhatsApp y papel.",
  },
};

const MODULOS = [
  {
    titulo: "Residentes y unidades",
    detalle: "Un registro único por departamento o casa, con sus residentes, contacto y estado al día.",
  },
  {
    titulo: "Gastos comunes",
    detalle: "Prorrateo automático por metraje o sector, sin planillas de Excel que se desincronizan.",
  },
  {
    titulo: "Multas y visitas",
    detalle: "Registro y trazabilidad de incidencias y accesos, con historial por unidad.",
  },
  {
    titulo: "Comunicados",
    detalle: "Un solo lugar para avisar a toda la comunidad, con registro de quién lo vio.",
  },
];

export default function LandingPage() {
  return (
    <main className="flex-1 bg-white">
      <section className="mx-auto flex max-w-5xl flex-col items-start gap-6 px-6 py-24 sm:py-32">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          Gestión de condominios
        </span>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          El panel que reemplaza las planillas y el WhatsApp del condominio
        </h1>
        <p className="max-w-xl text-lg text-slate-600">
          ControlCost centraliza residentes, unidades, gastos comunes y comunicados en un solo lugar —
          claro para la administración, transparente para los residentes.
        </p>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Ingresar al panel
          </Link>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 py-20 sm:grid-cols-2 lg:grid-cols-4">
          {MODULOS.map((modulo) => (
            <div key={modulo.titulo} className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="text-base font-semibold text-slate-900">{modulo.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{modulo.detalle}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-100 px-6 py-10 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} ControlCost — Riava
      </footer>
    </main>
  );
}
