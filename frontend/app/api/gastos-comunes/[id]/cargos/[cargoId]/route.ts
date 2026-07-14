import { proxyToBackend } from "@/lib/server-api";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; cargoId: string }> },
) {
  const { id, cargoId } = await params;
  const url = new URL(request.url);
  const pagado = url.searchParams.get("pagado") ?? "true";
  return proxyToBackend(`/api/v1/gastos-comunes/${id}/cargos/${cargoId}?pagado=${pagado}`, {
    method: "PATCH",
  });
}
