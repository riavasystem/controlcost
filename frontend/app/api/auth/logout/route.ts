import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("controlcost_access_token");
  cookieStore.delete("controlcost_refresh_token");
  return NextResponse.json({ ok: true });
}
