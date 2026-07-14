import { proxyToBackend } from "@/lib/server-api";

export async function GET() {
  return proxyToBackend("/api/v1/pagos/cargos-pendientes");
}
