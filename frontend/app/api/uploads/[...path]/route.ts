import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://127.0.0.1:8000";

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("controlcost_access_token")?.value;

  if (!token) {
    return NextResponse.json({ detail: "No autenticado" }, { status: 401 });
  }

  const response = await fetch(`${API_URL}/uploads/${path.join("/")}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  }).catch(() => null);

  if (!response || !response.ok) {
    return NextResponse.json({ detail: "No se pudo cargar el archivo" }, { status: response?.status ?? 502 });
  }

  return new NextResponse(response.body, {
    status: 200,
    headers: { "Content-Type": response.headers.get("content-type") ?? "application/octet-stream" },
  });
}
