import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/server-api";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.text();
  return proxyToBackend(`/api/v1/vehiculos/${id}`, { method: "PUT", body });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend(`/api/v1/vehiculos/${id}`, { method: "DELETE" });
}
