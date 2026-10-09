import { NextResponse } from "next/server";
import { proxyAdminBackendRequest } from "@/services/admin-backend-proxy.service";

export function getSaldosClientesFromBackend(empresaId: string) {
  if (!/^\d+$/.test(empresaId)) {
    return NextResponse.json(
      { message: "El identificador de empresa no es válido." },
      { status: 400 },
    );
  }
  return proxyAdminBackendRequest(`/${empresaId}/clientes/saldos`, "GET");
}
