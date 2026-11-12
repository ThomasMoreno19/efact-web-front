import { NextResponse } from "next/server";
import { proxyAdminBackendRequest } from "@/services/admin-backend-proxy.service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ message: "Empresa no válida." }, { status: 400 });
  return proxyAdminBackendRequest(`empresas/${id}/usuarios-externos`, "GET");
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const payload = await request.json().catch(() => null) as { contrasena?: unknown } | null;
  if (!/^\d+$/.test(id) || typeof payload?.contrasena !== "string" || !payload.contrasena.length || payload.contrasena.length > 72) {
    return NextResponse.json({ message: "Ingresá una contraseña válida." }, { status: 400 });
  }
  return proxyAdminBackendRequest(`empresas/${id}/usuarios-externos`, "POST", JSON.stringify({ contrasena: payload.contrasena }));
}
