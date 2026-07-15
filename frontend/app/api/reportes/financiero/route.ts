import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://127.0.0.1:8000";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("controlcost_access_token")?.value;

  if (!token) {
    return NextResponse.json({ detail: "No autenticado" }, { status: 401 });
  }

  const response = await fetch(`${API_URL}/api/v1/reportes/financiero`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: response.statusText }));
    return NextResponse.json(body, { status: response.status });
  }

  return new NextResponse(response.body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": response.headers.get("content-disposition") ?? "attachment",
    },
  });
}
