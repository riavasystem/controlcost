import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/server-api";

export async function GET() {
  return proxyToBackend("/api/v1/encomiendas");
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyToBackend("/api/v1/encomiendas", { method: "POST", body });
}
