import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/server-api";

export async function GET() {
  return proxyToBackend("/api/v1/vehiculos");
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyToBackend("/api/v1/vehiculos", { method: "POST", body });
}
