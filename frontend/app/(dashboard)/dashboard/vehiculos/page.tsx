import { ModuloProximamente } from "../_components/modulo-proximamente";
import { MODULOS } from "@/lib/modulos";

export default function Page() {
  const modulo = MODULOS.find((m) => m.slug === "vehiculos")!;
  return <ModuloProximamente icon={modulo.icon} name={modulo.name} description={modulo.description} />;
}
