import type { Metadata } from "next";
import Link from "next/link";
import { Space_Grotesk, Inter } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ControlCost — Gestión moderna de condominios",
  description:
    "Administra residentes, unidades, gastos comunes, RRHH y comunicados de tu condominio desde un solo panel, sin planillas ni papeles.",
  openGraph: {
    title: "ControlCost — Gestión moderna de condominios",
    description: "El panel de administración para condominios que reemplaza planillas, WhatsApp y papel.",
  },
};

type Modulo = {
  titulo: string;
  detalle: string;
  estado: "disponible" | "proximamente";
};

const MODULOS: Modulo[] = [
  {
    titulo: "Unidades",
    detalle: "Un registro único por departamento o casa: metraje, torre o sector y estado al día.",
    estado: "disponible",
  },
  {
    titulo: "Residentes",
    detalle: "Propietarios y arrendatarios vinculados a su unidad, con contacto siempre actualizado.",
    estado: "disponible",
  },
  {
    titulo: "Gastos comunes",
    detalle: "Prorrateo automático por metraje o sector, generado en una sola transacción — sin planillas que se desincronizan.",
    estado: "proximamente",
  },
  {
    titulo: "Multas",
    detalle: "Registro y trazabilidad de incidencias por unidad, con reverso automático del movimiento financiero asociado.",
    estado: "proximamente",
  },
  {
    titulo: "RRHH y nómina",
    detalle: "Liquidaciones de sueldo, tasas previsionales parametrizables y topes legales validados.",
    estado: "proximamente",
  },
  {
    titulo: "Vehículos y visitas",
    detalle: "Control de acceso y patentes por unidad, con historial consultable.",
    estado: "proximamente",
  },
  {
    titulo: "Encomiendas",
    detalle: "Registro de paquetes recibidos en conserjería y su entrega al residente.",
    estado: "proximamente",
  },
  {
    titulo: "Comunicados",
    detalle: "Un solo lugar para avisar a toda la comunidad, con registro de quién lo vio.",
    estado: "proximamente",
  },
];

export default function LandingPage() {
  return (
    <main className={`${spaceGrotesk.variable} ${inter.variable} landing-theme flex-1`} style={{ fontFamily: "var(--font-body)" }}>
      <div className="landing-glow" />
      <div className="landing-grid absolute inset-0" />
      <div
        className="landing-orb"
        style={{
          width: 320,
          height: 320,
          top: "6%",
          left: "4%",
          background: "radial-gradient(circle, var(--blue-electric), transparent 70%)",
        }}
      />
      <div
        className="landing-orb"
        style={{
          width: 260,
          height: 260,
          top: "38%",
          right: "6%",
          background: "radial-gradient(circle, var(--cyan-tech), transparent 70%)",
          animationDelay: "-4s",
        }}
      />

      <div className="relative z-10">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-7">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] text-[17px] font-bold"
              style={{
                background: "linear-gradient(135deg, var(--blue-electric), var(--cyan-tech))",
                color: "#06101f",
                boxShadow: "var(--glow-blue)",
                fontFamily: "var(--font-display)",
              }}
            >
              CC
            </div>
            <div style={{ fontFamily: "var(--font-display)" }}>
              <div className="text-[19px] font-bold leading-tight tracking-tight">ControlCost</div>
              <div
                className="mt-0.5 text-[10.5px] font-semibold tracking-[2.5px]"
                style={{ color: "var(--cyan-tech-2)" }}
              >
                CONDOMINIO INTELIGENTE
              </div>
            </div>
          </div>
          <Link
            href="/login"
            className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:border-[var(--cyan-tech)]"
            style={{ borderColor: "var(--border-strong)", color: "var(--text-primary)" }}
          >
            Ingresar al panel
          </Link>
        </header>

        <section className="mx-auto flex max-w-6xl flex-col items-start gap-7 px-6 pb-20 pt-14 sm:pt-20">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[1.6px]"
            style={{ borderColor: "var(--border-soft)", color: "var(--cyan-tech)" }}
          >
            <span
              className="landing-live-dot h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--green-ok)" }}
            />
            En producción · Gestión de condominios
          </span>

          <h1
            className="max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl"
            style={{ fontFamily: "var(--font-display)", textWrap: "balance" }}
          >
            El panel que reemplaza las planillas y el WhatsApp del condominio
          </h1>

          <p className="max-w-xl text-base leading-relaxed sm:text-lg" style={{ color: "var(--text-secondary)" }}>
            ControlCost centraliza unidades, residentes, gastos comunes, RRHH y comunicados en un
            solo lugar — claro para la administración, transparente para los residentes.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/login"
              className="rounded-xl px-6 py-3.5 text-sm font-bold transition hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, var(--blue-electric), var(--cyan-tech))",
                color: "#06101f",
                boxShadow: "var(--glow-blue)",
                fontFamily: "var(--font-body)",
              }}
            >
              Ingresar al panel →
            </Link>
            <a
              href="#modulos"
              className="rounded-xl border px-6 py-3.5 text-sm font-semibold transition hover:border-[var(--cyan-tech)]"
              style={{ borderColor: "var(--border-soft)", color: "var(--text-primary)" }}
            >
              Ver módulos
            </a>
          </div>
        </section>

        <section id="modulos" className="border-t px-6 py-20" style={{ borderColor: "var(--border-soft)" }}>
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 flex items-end justify-between gap-4">
              <h2
                className="text-2xl font-bold tracking-tight sm:text-3xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Todo el condominio, en un solo panel
              </h2>
              <p className="hidden text-sm sm:block" style={{ color: "var(--text-muted)" }}>
                {MODULOS.filter((m) => m.estado === "disponible").length} de {MODULOS.length} módulos disponibles hoy
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {MODULOS.map((modulo) => (
                <div
                  key={modulo.titulo}
                  className="rounded-2xl border p-6"
                  style={{
                    borderColor: "var(--border-soft)",
                    background: "linear-gradient(160deg, rgba(15,23,41,.6), rgba(11,18,32,.7))",
                  }}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3
                      className="text-base font-semibold"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {modulo.titulo}
                    </h3>
                    {modulo.estado === "disponible" ? (
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                        style={{ background: "rgba(52,211,153,.12)", color: "var(--green-ok)" }}
                      >
                        Disponible
                      </span>
                    ) : (
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                        style={{ background: "rgba(251,191,36,.12)", color: "var(--amber)" }}
                      >
                        Próximamente
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {modulo.detalle}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer
          className="border-t px-6 py-10 text-center text-sm"
          style={{ borderColor: "var(--border-soft)", color: "var(--text-muted)" }}
        >
          © {new Date().getFullYear()} ControlCost — Riava
        </footer>
      </div>
    </main>
  );
}
