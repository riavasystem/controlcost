import type { Metadata } from "next";
import Link from "next/link";
import { Space_Grotesk, Inter } from "next/font/google";
import { ScrollReveal } from "./scroll-reveal";

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
  title: "Control Cost Pro — ERP SaaS para Condominios en Chile",
  description:
    "ERP SaaS para la administración inteligente de condominios y edificios en Chile. Cumplimiento Ley N°21.442, 17 módulos integrados, disponible 24/7.",
  openGraph: {
    title: "Control Cost Pro — ERP SaaS para Condominios en Chile",
    description:
      "Tecnología enterprise, cumplimiento Ley N°21.442 y automatización total para la administración de condominios.",
  },
};

const MODULOS: Array<[string, string, string]> = [
  ["fa-chart-line", "Dashboard Ejecutivo", "KPIs, flujo de caja y alertas en tiempo real."],
  ["fa-users", "Residentes", "Registro completo de propietarios y arrendatarios."],
  ["fa-building", "Gastos Comunes", "Cobro por m² configurable con extraordinarios."],
  ["fa-money-bill-wave", "Registro de Pagos", "Canal de pago con reversión inteligente."],
  ["fa-coins", "Finanzas", "Ingresos y egresos con trazabilidad completa."],
  ["fa-gavel", "Multas", "Infracciones con ingreso automático al registrar."],
  ["fa-bullhorn", "Comunicados", "Avisos con prioridad: normal, importante, urgente."],
  ["fa-clock", "Control Visitas", "Registro entrada/salida con alerta de +8 horas."],
  ["fa-car-side", "Vehículos", "Padrón maestro vinculado a cada unidad."],
  ["fa-box-open", "Encomiendas", "Ciclo llegada → notificación → retiro."],
  ["fa-shield-halved", "Guardias", "Turnos y horarios del personal de seguridad."],
  ["fa-screwdriver-wrench", "Proveedores", "Directorio de servicios externos."],
  ["fa-scale-balanced", "Ley 21.442", "Cumplimiento normativo completo."],
  ["fa-credit-card", "Pagos Online", "Webpay integrado para residentes."],
  ["fa-mobile-alt", "App Móvil", "Portal del residente desde su celular."],
  ["fa-clipboard-list", "Reportes", "Informes para juntas de copropietarios."],
  ["fa-layer-group", "Multi-Condominio", "Una cuenta, múltiples comunidades."],
];

const LEY_CARDS: Array<[string, string, string]> = [
  [
    "fa-scale-balanced",
    "Art. 20 N°4 — Recaudación y Contabilidad",
    "El sistema registra todos los pagos, lleva contabilidad del fondo común y emite reportes financieros auditables por período conforme a la ley.",
  ],
  [
    "fa-file-invoice",
    "Certificados de Deuda Descargables",
    "Generación de comprobantes y cupones de pago en PDF para cada copropietario, con desglose detallado del cobro mensual.",
  ],
  [
    "fa-clipboard-list",
    "Registro de Copropietarios",
    "Padrón actualizado de propietarios y arrendatarios conforme al Reglamento DS N°7-2025, con historial de cambios auditables.",
  ],
  [
    "fa-chart-line",
    "Rendición de Cuentas Transparente",
    "Dashboard financiero con ingresos, egresos, balance y fondo de reserva accesible para el comité de administración en tiempo real.",
  ],
  [
    "fa-shield-halved",
    "Mantenciones y Seguridad",
    "Registro de proveedores, control de acceso de visitas y vehículos, y gestión de personal de seguridad y conserjería con bitácora digital.",
  ],
  [
    "fa-money-bill-wave",
    "Gastos Comunes Transparentes",
    "Cobro por m² configurable por sector, con desglose de base y extraordinarios prorrateados. Cada peso, justificado y auditable.",
  ],
];

const FLOW_STEPS: Array<[string, string]> = [
  ["Generar Cobro", "El admin genera los gastos comunes del período con tarifa $/m² + extraordinarios"],
  ["Notificación", "El residente recibe aviso de su monto con desglose completo y cupón PDF"],
  ["Pago", "Paga por transferencia, efectivo o Webpay directo desde su portal"],
  ["Registro Automático", "El ingreso se registra en Finanzas, Contabilidad y Dashboard al instante"],
  ["Al Día", 'El estado del copropietario cambia a "Al Día" — cero intervención manual'],
];

const STACK_CARDS: Array<{
  color: "blue" | "cyan" | "green" | "amber";
  icon: string;
  title: string;
  desc: string;
  tag: string;
}> = [
  {
    color: "blue",
    icon: "fa-bolt",
    title: "Laravel 11",
    desc: "Framework PHP enterprise. Arquitectura MVC, Eloquent ORM, API RESTful, autenticación JWT y colas de trabajo asíncronas.",
    tag: "Backend & API",
  },
  {
    color: "cyan",
    icon: "fa-database",
    title: "SQL Server",
    desc: "Base de datos Microsoft enterprise. Transacciones ACID, millones de registros, índices de alta performance y alta disponibilidad.",
    tag: "Base de Datos",
  },
  {
    color: "green",
    icon: "fa-cloud",
    title: "Cloud Ready",
    desc: "Desplegable en Azure, AWS o servidor propio. Escalamiento horizontal, backups automáticos y certificado SSL incluido.",
    tag: "Infraestructura",
  },
  {
    color: "amber",
    icon: "fa-mobile-alt",
    title: "API RESTful",
    desc: "Arquitectura desacoplada para app móvil, integración con Webpay y conexión con sistemas externos de terceros sin límites.",
    tag: "Integraciones",
  },
];

const COMPARE_ROWS: Array<[string, "cross" | "partial", "cross" | "partial"]> = [
  ["Trazabilidad financiera automática", "cross", "partial"],
  ["Cumplimiento Ley N°21.442", "cross", "cross"],
  ["Tarifa $/m² por sector", "cross", "cross"],
  ["Reversión inteligente al eliminar", "cross", "cross"],
  ["Portal del residente + App móvil", "cross", "partial"],
  ["Laravel 11 + SQL Server enterprise", "cross", "cross"],
  ["Multi-condominio", "cross", "partial"],
];

export default function LandingPage() {
  return (
    <main className={`${spaceGrotesk.variable} ${inter.variable} cip-page`}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      <ScrollReveal />

      {/* NAV */}
      <nav className="cip-nav">
        <div className="cip-nav-logo">
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: "linear-gradient(135deg,#1A6FE8,#00D4FF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 16,
              color: "#040C1A",
            }}
          >
            CC
          </div>
          <span>
            Control Cost <em>Pro</em>
          </span>
        </div>
        <ul className="cip-nav-links">
          <li>
            <a href="#modulos">Módulos</a>
          </li>
          <li>
            <a href="#ley">Ley 21.442</a>
          </li>
          <li>
            <a href="#tecnologia">Tecnología</a>
          </li>
          <li>
            <a href="#comparativa">Comparativa</a>
          </li>
          <li>
            <Link href="/login">Ingresar</Link>
          </li>
          <li>
            <a href="#contacto" className="cip-nav-cta">
              Solicitar Demo
            </a>
          </li>
        </ul>
      </nav>

      {/* HERO */}
      <section className="cip-hero">
        <video className="cip-hero-video" autoPlay muted loop playsInline preload="auto">
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>
        <div className="cip-hero-overlay" />
        <div className="cip-hero-grid" />
        <div className="cip-hero-orb" />

        <div className="cip-hero-content">
          <div className="cip-hero-badge">
            <i className="fa-solid fa-star" />
            Versión Executive 2026
          </div>

          <h1>
            Control Cost
            <br />
            <em>Pro</em>
          </h1>

          <p className="cip-hero-sub">
            ERP SaaS para la administración inteligente de condominios y edificios en Chile. Tecnología
            enterprise, cumplimiento Ley N°21.442 y automatización total.
          </p>

          <div className="cip-hero-pills">
            <div className="cip-pill">
              <i className="fa-solid fa-check" /> Cumplimiento Ley 21.442
            </div>
            <div className="cip-pill">
              <i className="fa-solid fa-check" /> Laravel 11 + SQL Server
            </div>
            <div className="cip-pill">
              <i className="fa-solid fa-check" /> 17 Módulos integrados
            </div>
            <div className="cip-pill">
              <i className="fa-solid fa-check" /> Disponible 24/7
            </div>
          </div>

          <div className="cip-hero-actions">
            <a href="#contacto" className="cip-btn-primary">
              <i className="fa-solid fa-rocket" />
              Solicitar Demo
            </a>
            <a href="#modulos" className="cip-btn-ghost">
              <i className="fa-solid fa-circle-play" />
              Ver Módulos
            </a>
          </div>
        </div>

        <div className="cip-hero-stats">
          <div className="cip-hero-stat">
            <div className="val">17</div>
            <div className="lbl">Módulos Integrados</div>
          </div>
          <div className="cip-hero-stat">
            <div className="val">24/7</div>
            <div className="lbl">Disponibilidad Cloud</div>
          </div>
          <div className="cip-hero-stat">
            <div className="val">100%</div>
            <div className="lbl">Ley N°21.442</div>
          </div>
        </div>

        <div className="cip-hero-ley">
          <i className="fa-solid fa-shield-halved" />
          <div>
            <div className="ley-title">Cumplimiento Ley N°21.442</div>
            <div className="ley-sub">Nueva Ley de Copropiedad Inmobiliaria</div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <div className="cip-stats-bar">
        <div className="cip-stat-item">
          <div className="num">150.000+</div>
          <div className="desc">Condominios en Chile sin plataforma integrada</div>
        </div>
        <div className="cip-stat-item">
          <div className="num">85%</div>
          <div className="desc">Administradores aún usan planillas Excel</div>
        </div>
        <div className="cip-stat-item">
          <div className="num">$2M</div>
          <div className="desc">Pérdida anual promedio por errores manuales</div>
        </div>
        <div className="cip-stat-item">
          <div className="num">2022</div>
          <div className="desc">Año de entrada en vigor Ley N°21.442</div>
        </div>
      </div>

      {/* MÓDULOS */}
      <section className="cip-section" id="modulos">
        <div className="cip-eyebrow">Arquitectura Funcional</div>
        <h2 className="cip-section-title">17 módulos completamente integrados</h2>
        <p className="cip-section-sub">
          Cada módulo comparte la misma base de datos — la información fluye automáticamente entre áreas
          sin necesidad de doble digitación.
        </p>

        <div className="cip-modulos-grid">
          {MODULOS.map(([icon, name, desc]) => (
            <div className="cip-modulo-card cip-reveal" key={name}>
              <div className="cip-modulo-icon">
                <i className={`fa-solid ${icon}`} />
              </div>
              <div className="cip-modulo-name">{name}</div>
              <div className="cip-modulo-desc">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* LEY 21.442 */}
      <section className="cip-section cip-ley-section" id="ley">
        <div className="cip-eyebrow">Cumplimiento Legal</div>
        <h2 className="cip-section-title">Diseñado para la Ley N°21.442</h2>
        <p className="cip-section-sub">
          Nueva Ley de Copropiedad Inmobiliaria vigente en Chile desde 2022 — cumplimiento total desde el
          primer día de uso.
        </p>

        <div className="cip-ley-grid">
          {LEY_CARDS.map(([icon, title, desc]) => (
            <div className="cip-ley-card cip-reveal" key={title}>
              <div className="cip-ley-card-icon">
                <i className={`fa-solid ${icon}`} />
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="cip-section">
        <div className="cip-eyebrow">Flujo de Pago</div>
        <h2 className="cip-section-title">Del cobro al ingreso en 5 pasos</h2>
        <p className="cip-section-sub">
          El residente paga, el sistema registra. Sin intervención manual, sin errores de traspaso.
        </p>

        <div className="cip-flow-steps">
          {FLOW_STEPS.map(([title, desc], i) => (
            <div className="cip-flow-step cip-reveal" key={title}>
              <div className="cip-flow-num">{i + 1}</div>
              <h4>{title}</h4>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TECNOLOGÍA */}
      <section className="cip-section" id="tecnologia" style={{ background: "var(--panel)" }}>
        <div className="cip-eyebrow">Stack Técnico</div>
        <h2 className="cip-section-title">El top del mercado SaaS</h2>
        <p className="cip-section-sub">
          Arquitectura enterprise construida para escalar desde un condominio a miles simultáneamente.
        </p>

        <div className="cip-stack-grid">
          {STACK_CARDS.map((card) => (
            <div className={`cip-stack-card ${card.color} cip-reveal`} key={card.title}>
              <div className={`cip-stack-icon ${card.color}`}>
                <i className={`fa-solid ${card.icon}`} />
              </div>
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
              <span className="cip-stack-tag">{card.tag}</span>
            </div>
          ))}
        </div>
      </section>

      {/* COMPARATIVA */}
      <section className="cip-section" id="comparativa">
        <div className="cip-eyebrow">¿Por qué elegirnos?</div>
        <h2 className="cip-section-title">Lo que nos separa de la competencia</h2>
        <p className="cip-section-sub">
          No somos otra planilla Excel ni un software genérico. Somos el estándar que el mercado
          necesitaba.
        </p>

        <div style={{ overflowX: "auto" }}>
          <table className="cip-compare-table">
            <thead>
              <tr>
                <th>Característica</th>
                <th>Excel / Manual</th>
                <th>Software Genérico</th>
                <th className="highlight">Control Cost Pro</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map(([label, excel, generic]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td>
                    <span className={excel === "cross" ? "cip-cross" : "cip-partial"}>
                      {excel === "cross" ? "✗" : "Parcial"}
                    </span>
                  </td>
                  <td>
                    <span className={generic === "cross" ? "cip-cross" : "cip-partial"}>
                      {generic === "cross" ? "✗" : "Parcial"}
                    </span>
                  </td>
                  <td className="highlight">
                    <span className="cip-check">✓</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA + EQUIPO */}
      <section className="cip-section cip-cta-section" id="contacto">
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="cip-eyebrow" style={{ textAlign: "center" }}>
            Contáctanos
          </div>
          <h2 className="cip-section-title" style={{ textAlign: "center" }}>
            La administración de condominios
            <br />
            ya tiene un estándar más alto.
          </h2>
          <p className="cip-section-sub" style={{ margin: "0 auto 40px", textAlign: "center" }}>
            Únete a la transformación digital de la copropiedad en Chile. Solicita una demo y descubre
            cómo Control Cost Pro puede transformar tu condominio.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", marginBottom: 60 }}>
            <a href="mailto:claudio.castro@riava.cl" className="cip-btn-primary">
              <i className="fa-solid fa-envelope" />
              Solicitar Demo
            </a>
            <a href="https://wa.me/56962099949" className="cip-btn-ghost">
              <i className="fa-brands fa-whatsapp" />
              WhatsApp
            </a>
          </div>

          <div className="cip-equipo-cards">
            <div className="cip-equipo-card">
              <div className="cip-equipo-avatar">CC</div>
              <h3>Claudio Castro Avilés</h3>
              <div className="cargo">Business Manager &amp; Co-Fundador</div>
              <div className="contacto">
                +56 9 6209 9949
                <br />
                claudio.castro@riava.cl
              </div>
            </div>
            <div className="cip-equipo-card">
              <div className="cip-equipo-avatar">RC</div>
              <h3>Richard Chamorro Huircan</h3>
              <div className="cargo">Business Manager &amp; Co-Fundador</div>
              <div className="contacto">contacto@riava.cl</div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="cip-footer">
        <div className="brand">
          Control Cost <em>Pro</em>
        </div>
        <div className="legal">© {new Date().getFullYear()} Control Cost Pro — Todos los derechos reservados</div>
        <div className="version">Versión Executive 2026</div>
      </footer>
    </main>
  );
}
