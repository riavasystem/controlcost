import { NextRequest, NextResponse } from "next/server";

// Guardia optimista: solo mira si existe la cookie de sesión.
// La autorización real (rol, vigencia del token) la valida siempre el backend.
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("controlcost_access_token");

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
