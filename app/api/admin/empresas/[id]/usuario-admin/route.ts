import { NextResponse } from "next/server";
import { proxyAdminBackendRequest } from "@/services/admin-backend-proxy.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return invalidCompanyId();
  return proxyAdminBackendRequest(`empresas/${id}/usuario-admin`, "GET");
}

export async function PUT(request: Request, { params }: RouteContext) {
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
    (payload.contrasena !== undefined &&
      (typeof payload.contrasena !== "string" ||
        payload.contrasena.length === 0 ||
        payload.contrasena.length < 6 ||
        payload.contrasena.length > 72))
  ) {
    return NextResponse.json(
      { message: "Ingresá un nombre de usuario y una contraseña válida." },
      { status: 400 },
    );
  }

  return proxyAdminBackendRequest(
    `empresas/${id}/usuario-admin`,
    "PUT",
    JSON.stringify({
      nombre: payload.nombre.trim(),
      ...(typeof payload.contrasena === "string"
        ? { contrasena: payload.contrasena }
        : {}),
    }),
  );
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return invalidCompanyId();

  const payload = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  if (
    !payload ||
    typeof payload.nombre !== "string" ||
    payload.nombre.trim().length === 0 ||
    payload.nombre.length > 255
  ) {
    return invalidAdminUserData();
  }

  const hasCurrentPassword = payload.contrasenaActual !== undefined;
  const hasNewPassword = payload.contrasenaNueva !== undefined;
  if (hasCurrentPassword !== hasNewPassword) return invalidPasswordChange();
  if (
    hasCurrentPassword &&
    (typeof payload.contrasenaActual !== "string" ||
      payload.contrasenaActual.length === 0 ||
      payload.contrasenaActual.length > 72 ||
      typeof payload.contrasenaNueva !== "string" ||
      payload.contrasenaNueva.length < 6 ||
      payload.contrasenaNueva.length > 72)
  ) {
    return invalidPasswordChange();
  }

  return proxyAdminBackendRequest(
    `empresas/${id}/usuario-admin`,
    "PATCH",
    JSON.stringify({
      nombre: payload.nombre.trim(),
      ...(hasCurrentPassword
        ? {
            contrasenaActual: payload.contrasenaActual,
            contrasenaNueva: payload.contrasenaNueva,
          }
        : {}),
    }),
  );
}

function invalidAdminUserData() {
  return NextResponse.json(
    { message: "Ingresá un nombre de usuario válido." },
    { status: 400 },
  );
}

function invalidPasswordChange() {
  return NextResponse.json(
    {
      message:
        "Para cambiar la contraseña, ingresá la contraseña actual y una nueva de al menos 6 caracteres.",
    },
    { status: 400 },
  );
}

function invalidCompanyId() {
  return NextResponse.json(
    { message: "El identificador de empresa no es válido." },
    { status: 400 },
  );
}
