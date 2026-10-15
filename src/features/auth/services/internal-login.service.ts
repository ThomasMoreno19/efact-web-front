import { NextResponse } from "next/server";
import {
  readBackendAuthRefreshTokens,
  setInternalAuthCookies,
} from "@/features/auth/services/auth-token-cookie.service";
import { fetchBackend } from "@/services/backend-api";

export async function handleInternalLogin(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  if (
    !payload ||
    !Number.isSafeInteger(payload.empresaId) ||
    (payload.empresaId as number) < 1 ||
    typeof payload.contrasena !== "string" ||
    payload.contrasena.length === 0 ||
    payload.contrasena.length > 72
  ) {
    return NextResponse.json(
      { message: "Ingresá una contraseña válida." },
      { status: 400 },
    );
  }

  try {
    const backendResponse = await fetchBackend("/auth/login-interno", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idEmpresa: payload.empresaId,
        contrasena: payload.contrasena,
      }),
      cache: "no-store",
    });
    if (backendResponse.status === 401) {
      return NextResponse.json(
        { message: "La contraseña no es correcta para esta empresa." },
        { status: 401 },
      );
    }
    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: "No se pudo iniciar sesión. Intentá nuevamente." },
        { status: backendResponse.status >= 500 ? 503 : backendResponse.status },
      );
    }

    const tokens = readBackendAuthRefreshTokens(backendResponse.headers);
    if (!tokens) {
      return NextResponse.json(
        { message: "El servidor devolvió una respuesta de sesión inválida." },
        { status: 502 },
      );
    }

    const response = NextResponse.json({ authenticated: true });
    setInternalAuthCookies(response, tokens);
    return response;
  } catch {
    return NextResponse.json(
      { message: "No se pudo conectar con el servidor. Intentá nuevamente." },
      { status: 503 },
    );
  }
}
