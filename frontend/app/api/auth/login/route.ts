import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ApiError, backendFetch } from "@/lib/api";

const ACCESS_COOKIE = "controlcost_access_token";
const REFRESH_COOKIE = "controlcost_refresh_token";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  try {
    const tokens = await backendFetch("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === "production";

    cookieStore.set(ACCESS_COOKIE, tokens.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 30,
    });
    cookieStore.set(REFRESH_COOKIE, tokens.refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ detail: error.message }, { status: error.status });
    }
    return NextResponse.json({ detail: "No se pudo contactar la API" }, { status: 502 });
  }
}
