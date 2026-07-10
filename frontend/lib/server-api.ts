import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://127.0.0.1:8000";

/** Reenvía una petición autenticada al backend usando la cookie httpOnly de sesión,
 * preservando el status code real de la respuesta. Uso exclusivo en Route Handlers. */
export async function proxyToBackend(path: string, init?: RequestInit) {
  const cookieStore = await cookies();
  const token = cookieStore.get("controlcost_access_token")?.value;

  if (!token) {
    return NextResponse.json({ detail: "No autenticado" }, { status: 401 });
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  }).catch(() => null);

  if (!response) {
    return NextResponse.json({ detail: "No se pudo contactar la API" }, { status: 502 });
  }

  if (response.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const body = await response.json().catch(() => ({ detail: response.statusText }));
  return NextResponse.json(body, { status: response.status });
}
