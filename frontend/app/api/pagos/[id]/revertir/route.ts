import { proxyToBackend } from "@/lib/server-api";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend(`/api/v1/pagos/${id}/revertir`, { method: "POST" });
}
