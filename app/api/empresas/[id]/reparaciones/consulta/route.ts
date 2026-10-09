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
    (payload.tipo !== "cuil" && payload.tipo !== "serie") ||
    typeof payload.valor !== "string" ||
    payload.valor.trim().length === 0 ||
    payload.valor.length > (payload.tipo === "cuil" ? 30 : 100)
  ) {
    return NextResponse.json(
      { message: "Ingresá un DNI, CUIL o número de serie válido." },
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

  try {
    const backendResponse = await fetchBackend(`/${id}/reparaciones/consulta`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: payload.tipo,
        valor: payload.valor.trim(),
        ...(includesPassword ? { contrasena: payload.contrasena } : {}),
      }),
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
