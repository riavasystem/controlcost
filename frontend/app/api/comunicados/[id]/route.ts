import { proxyToBackend } from "@/lib/server-api";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend(`/api/v1/comunicados/${id}`, { method: "DELETE" });
}
