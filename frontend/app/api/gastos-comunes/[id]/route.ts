import { proxyToBackend } from "@/lib/server-api";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend(`/api/v1/gastos-comunes/${id}`);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend(`/api/v1/gastos-comunes/${id}`, { method: "DELETE" });
}
