import { NextResponse } from "next/server";
import { fetchBackend } from "@/services/backend-api";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json(
      { message: "El identificador de empresa no es válido." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const payload = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  if (
    !payload ||
    typeof payload.cuil !== "string" ||
    payload.cuil.trim().length === 0 ||
    payload.cuil.length > 30
  ) {
    return NextResponse.json(
      { message: "Ingresá un DNI o CUIL válido." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const includesPassword = Object.prototype.hasOwnProperty.call(
    payload,
    "contrasena",
  );
  if (
    includesPassword &&
    (typeof payload.contrasena !== "string" ||
      payload.contrasena.length === 0 ||
      payload.contrasena.length > 72)
  ) {
    return NextResponse.json(
      { message: "La contraseña ingresada no es válida." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const body = JSON.stringify({
    cuil: payload.cuil,
    ...(includesPassword ? { contrasena: payload.contrasena } : {}),
  });

  try {
    const backendResponse = await fetchBackend(`/${id}/clientes/saldo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      cache: "no-store",
    });
    const responseBody = await backendResponse.text();
    return new NextResponse(responseBody || null, {
      status: backendResponse.status,
      headers: {
        "Content-Type":
          backendResponse.headers.get("content-type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "No se pudo conectar con el servidor." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
