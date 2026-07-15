import { proxyToBackend } from "@/lib/server-api";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(request.url);
  const retiradoPor = url.searchParams.get("retirado_por");
  const query = retiradoPor ? `?retirado_por=${encodeURIComponent(retiradoPor)}` : "";
  return proxyToBackend(`/api/v1/encomiendas/${id}/retiro${query}`, { method: "PATCH" });
}
