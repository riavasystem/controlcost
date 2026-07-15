export type ModuloStatus = "activo" | "proximamente";

export type Modulo = {
  slug: string;
  href: string;
  icon: string;
  name: string;
  description: string;
  status: ModuloStatus;
};

// Refleja los 17 módulos anunciados en la landing (`app/page.tsx` → MODULOS),
// más "Unidades" que ya existía en el sistema antes de esa lista.
export const MODULOS: Modulo[] = [
  {
    slug: "resumen",
    href: "/dashboard",
    icon: "fa-chart-line",
    name: "Dashboard Ejecutivo",
    description: "KPIs, flujo de caja y alertas en tiempo real.",
    status: "activo",
  },
  {
    slug: "unidades",
    href: "/dashboard/unidades",
    icon: "fa-door-open",
    name: "Unidades",
    description: "Departamentos, casas y estacionamientos del condominio.",
    status: "activo",
  },
  {
    slug: "residentes",
    href: "/dashboard/residentes",
    icon: "fa-users",
    name: "Residentes",
    description: "Registro completo de propietarios y arrendatarios.",
    status: "activo",
  },
  {
    slug: "gastos-comunes",
    href: "/dashboard/gastos-comunes",
    icon: "fa-building",
    name: "Gastos Comunes",
    description: "Cobro por m² configurable con extraordinarios.",
    status: "activo",
  },
  {
    slug: "pagos",
    href: "/dashboard/pagos",
    icon: "fa-money-bill-wave",
    name: "Registro de Pagos",
    description: "Canal de pago con reversión inteligente.",
    status: "activo",
  },
  {
    slug: "finanzas",
    href: "/dashboard/finanzas",
    icon: "fa-coins",
    name: "Finanzas",
    description: "Ingresos y egresos con trazabilidad completa.",
    status: "activo",
  },
  {
    slug: "multas",
    href: "/dashboard/multas",
    icon: "fa-gavel",
    name: "Multas",
    description: "Infracciones con ingreso automático al registrar.",
    status: "activo",
  },
  {
    slug: "comunicados",
    href: "/dashboard/comunicados",
    icon: "fa-bullhorn",
    name: "Comunicados",
    description: "Avisos con prioridad: normal, importante, urgente.",
    status: "activo",
  },
  {
    slug: "visitas",
    href: "/dashboard/visitas",
    icon: "fa-clock",
    name: "Control Visitas",
    description: "Registro entrada/salida con alerta de +8 horas.",
    status: "activo",
  },
  {
    slug: "vehiculos",
    href: "/dashboard/vehiculos",
    icon: "fa-car-side",
    name: "Vehículos",
    description: "Padrón maestro vinculado a cada unidad.",
    status: "activo",
  },
  {
    slug: "encomiendas",
    href: "/dashboard/encomiendas",
    icon: "fa-box-open",
    name: "Encomiendas",
    description: "Ciclo llegada → notificación → retiro.",
    status: "activo",
  },
  {
    slug: "guardias",
    href: "/dashboard/guardias",
    icon: "fa-shield-halved",
    name: "Guardias",
    description: "Turnos y horarios del personal de seguridad.",
    status: "activo",
  },
  {
    slug: "proveedores",
    href: "/dashboard/proveedores",
    icon: "fa-screwdriver-wrench",
    name: "Proveedores",
    description: "Directorio de servicios externos.",
    status: "activo",
  },
  {
    slug: "ley-21442",
    href: "/dashboard/ley-21442",
    icon: "fa-scale-balanced",
    name: "Ley 21.442",
    description: "Cumplimiento normativo completo.",
    status: "proximamente",
  },
  {
    slug: "pagos-online",
    href: "/dashboard/pagos-online",
    icon: "fa-credit-card",
    name: "Pagos Online",
    description: "Webpay integrado para residentes.",
    status: "proximamente",
  },
  {
    slug: "app-movil",
    href: "/dashboard/app-movil",
    icon: "fa-mobile-alt",
    name: "App Móvil",
    description: "Portal del residente desde su celular.",
    status: "proximamente",
  },
  {
    slug: "reportes",
    href: "/dashboard/reportes",
    icon: "fa-clipboard-list",
    name: "Reportes",
    description: "Informes para juntas de copropietarios.",
    status: "proximamente",
  },
  {
    slug: "multi-condominio",
    href: "/dashboard/multi-condominio",
    icon: "fa-layer-group",
    name: "Multi-Condominio",
    description: "Una cuenta, múltiples comunidades.",
    status: "proximamente",
  },
];
