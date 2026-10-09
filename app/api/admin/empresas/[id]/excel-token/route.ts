import { NextResponse } from "next/server";
import { proxyAdminBackendRequest } from "@/services/admin-backend-proxy.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json(
      { message: "El identificador de empresa no es válido." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const response = await proxyAdminBackendRequest(
    `/empresas/${id}/excel-token`,
    "GET",
  );
  response.headers.set("Cache-Control", "no-store");
  return response;
}
