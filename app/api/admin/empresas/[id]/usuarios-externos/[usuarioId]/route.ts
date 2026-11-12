import { NextResponse } from "next/server";
import { proxyAdminBackendRequest } from "@/services/admin-backend-proxy.service";

type Context = { params: Promise<{ id: string; usuarioId: string }> };

export async function PATCH(request: Request, context: Context) {
  const { id, usuarioId } = await context.params;
  const payload = await request.json().catch(() => null) as { contrasena?: unknown } | null;
  if (!/^\d+$/.test(id) || !/^\d+$/.test(usuarioId) || (payload?.contrasena !== undefined && (typeof payload.contrasena !== "string" || !payload.contrasena.length || payload.contrasena.length > 72))) {
    return NextResponse.json({ message: "Los datos ingresados no son válidos." }, { status: 400 });
  }
  return proxyAdminBackendRequest(`empresas/${id}/usuarios-externos/${usuarioId}`, "PATCH", JSON.stringify(payload ?? {}));
}

export async function DELETE(_request: Request, context: Context) {
  const { id, usuarioId } = await context.params;
  if (!/^\d+$/.test(id) || !/^\d+$/.test(usuarioId)) return NextResponse.json({ message: "Los datos ingresados no son válidos." }, { status: 400 });
  return proxyAdminBackendRequest(`empresas/${id}/usuarios-externos/${usuarioId}`, "DELETE");
}
