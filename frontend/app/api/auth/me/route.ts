import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ApiError, backendFetch } from "@/lib/api";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("controlcost_access_token")?.value;

  if (!token) {
    return NextResponse.json({ detail: "No autenticado" }, { status: 401 });
  }

  try {
    const user = await backendFetch("/api/v1/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ detail: error.message }, { status: error.status });
    }
    return NextResponse.json({ detail: "No se pudo contactar la API" }, { status: 502 });
  }
}
