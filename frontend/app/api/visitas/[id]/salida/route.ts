import { proxyToBackend } from "@/lib/server-api";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend(`/api/v1/visitas/${id}/salida`, { method: "PATCH" });
}
