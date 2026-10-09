import { NextResponse } from "next/server";
import { proxyAdminBackendRequest } from "@/services/admin-backend-proxy.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return invalidCompanyId();
  return proxyAdminBackendRequest(`empresas/${id}/usuarios-internos`, "GET");
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return invalidCompanyId();

  const payload = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  if (
    !payload ||
    typeof payload.nombre !== "string" ||
    payload.nombre.trim().length === 0 ||
    payload.nombre.length > 255 ||
    typeof payload.contrasena !== "string" ||
    payload.contrasena.length === 0 ||
    payload.contrasena.length > 72
  ) {
    return NextResponse.json(
      { message: "Ingresá el nombre y una contraseña válida." },
      { status: 400 },
    );
  }

  return proxyAdminBackendRequest(
    `empresas/${id}/usuarios-internos`,
    "POST",
    JSON.stringify({
      nombre: payload.nombre.trim(),
      contrasena: payload.contrasena,
    }),
  );
}

function invalidCompanyId() {
  return NextResponse.json(
    { message: "El identificador de empresa no es válido." },
    { status: 400 },
  );
}
