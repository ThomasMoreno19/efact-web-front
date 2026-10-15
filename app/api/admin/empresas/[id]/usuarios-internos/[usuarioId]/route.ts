import { NextResponse } from "next/server";
import { proxyAdminBackendRequest } from "@/services/admin-backend-proxy.service";

interface RouteContext {
  params: Promise<{ id: string; usuarioId: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id, usuarioId } = await params;
  if (!isValidId(id) || !isValidId(usuarioId)) return invalidId();

  const payload = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  if (
    !payload ||
    typeof payload.contrasena !== "string" ||
    payload.contrasena.length === 0 ||
    payload.contrasena.length > 72
  ) {
    return invalidUserData();
  }

  return proxyAdminBackendRequest(
    `empresas/${id}/usuarios-internos/${usuarioId}`,
    "PATCH",
    JSON.stringify({
      contrasena: payload.contrasena,
    }),
  );
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id, usuarioId } = await params;
  if (!isValidId(id) || !isValidId(usuarioId)) return invalidId();
  return proxyAdminBackendRequest(
    `empresas/${id}/usuarios-internos/${usuarioId}`,
    "DELETE",
  );
}

function isValidId(value: string) {
  return /^\d+$/.test(value);
}

function invalidId() {
  return NextResponse.json(
    { message: "El identificador del usuario o la empresa no es válido." },
    { status: 400 },
  );
}

function invalidUserData() {
  return NextResponse.json(
    { message: "Ingresá datos válidos para el usuario interno." },
    { status: 400 },
  );
}
