import { proxyToBackend } from "@/lib/server-api";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(request.url);
  const pagada = url.searchParams.get("pagada") ?? "true";
  return proxyToBackend(`/api/v1/multas/${id}?pagada=${pagada}`, { method: "PATCH" });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend(`/api/v1/multas/${id}`, { method: "DELETE" });
}
