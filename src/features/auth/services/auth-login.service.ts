import { NextResponse } from "next/server";
import {
  readBackendAuthTokens,
  setAdminAuthCookies,
} from "@/features/auth/services/auth-token-cookie.service";
import { fetchBackend } from "@/services/backend-api";

interface LoginRequestBody {
  nombre: string;
  contrasena: string;
}

export async function handleAdminLogin(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalidLoginRequest();
  }

  if (!isLoginRequestBody(body)) return invalidLoginRequest();

  try {
    const backendResponse = await fetchBackend("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (backendResponse.status === 401) {
      return NextResponse.json(
        {
          message:
            "El usuario o la contraseña son incorrectos, o la cuenta no es superadmin.",
        },
        { status: 401 },
      );
    }

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: "No se pudo completar el inicio de sesión." },
        { status: backendResponse.status >= 500 ? 503 : backendResponse.status },
      );
    }

    const tokens = readBackendAuthTokens(backendResponse.headers);
    if (!tokens) {
      return NextResponse.json(
        { message: "El servidor devolvió una respuesta de sesión inválida." },
        { status: 502 },
      );
    }

    const response = NextResponse.json({ authenticated: true });
    setAdminAuthCookies(response, tokens);
    return response;
  } catch {
    return NextResponse.json(
      { message: "No se pudo conectar con el servidor. Intentá nuevamente." },
      { status: 503 },
    );
  }
}

function invalidLoginRequest() {
  return NextResponse.json(
    { message: "Ingresá un nombre de usuario y una contraseña." },
    { status: 400 },
  );
}

function isLoginRequestBody(value: unknown): value is LoginRequestBody {
  if (typeof value !== "object" || value === null) return false;

  const body = value as Record<string, unknown>;
  return (
    typeof body.nombre === "string" &&
    body.nombre.trim().length > 0 &&
    typeof body.contrasena === "string" &&
    body.contrasena.length > 0
  );
}
