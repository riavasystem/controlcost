import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/server-api";

const API_URL = process.env.API_URL ?? "http://127.0.0.1:8000";

export async function GET() {
  return proxyToBackend("/api/v1/condominio");
}

export async function PUT(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("controlcost_access_token")?.value;

  if (!token) {
    return NextResponse.json({ detail: "No autenticado" }, { status: 401 });
  }

  const formData = await request.formData();
  const response = await fetch(`${API_URL}/api/v1/condominio`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
    cache: "no-store",
  }).catch(() => null);

  if (!response) {
    return NextResponse.json({ detail: "No se pudo contactar la API" }, { status: 502 });
  }

  const body = await response.json().catch(() => ({ detail: response.statusText }));
  return NextResponse.json(body, { status: response.status });
}
