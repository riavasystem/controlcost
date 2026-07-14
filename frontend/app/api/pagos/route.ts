import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/server-api";

export async function GET() {
  return proxyToBackend("/api/v1/pagos");
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyToBackend("/api/v1/pagos", { method: "POST", body });
}
