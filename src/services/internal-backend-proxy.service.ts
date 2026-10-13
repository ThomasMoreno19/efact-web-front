import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  INTERNAL_REFRESH_COOKIE,
  INTERNAL_SESSION_COOKIE,
} from "@/features/auth/constants/internal-auth-cookies";
import {
  clearInternalAuthCookies,
  refreshBackendAuthTokens,
  setInternalAuthCookies,
} from "@/features/auth/services/auth-token-cookie.service";
import type { BackendAuthRefreshTokens } from "@/features/auth/services/auth-token-cookie.service";
import { fetchBackend } from "@/services/backend-api";

type InternalBackendMethod = "GET" | "POST";

export async function proxyInternalBackendRequest(
  empresaId: string,
  recurso: "session" | "catalogo" | "saldos" | "logout",
  method: InternalBackendMethod = "GET",
  query?: URLSearchParams,
) {
  if (!/^\d+$/.test(empresaId)) return invalidCompanyId();

  const cookieStore = await cookies();
  let accessToken = cookieStore.get(INTERNAL_SESSION_COOKIE)?.value;
  const refreshToken = cookieStore.get(INTERNAL_REFRESH_COOKIE)?.value;
  let refreshedTokens: BackendAuthRefreshTokens | null = null;

  if (!accessToken) {
    if (!refreshToken) return expiredSession();
    const refreshResult = await refreshBackendAuthTokens(refreshToken);
    if (refreshResult.status === "unavailable") return refreshUnavailable();
    if (refreshResult.status === "invalid") return expiredSession();
    refreshedTokens = refreshResult.tokens;
    accessToken = refreshedTokens.accessToken;
  }

  try {
    const path = `empresas/${empresaId}/interno/${recurso}${query ? `?${query.toString()}` : ""}`;
    let backendResponse = await requestBackend(path, method, accessToken);
    if (backendResponse.status === 401 && !refreshedTokens) {
      if (!refreshToken) return expiredSession();
      const refreshResult = await refreshBackendAuthTokens(refreshToken);
      if (refreshResult.status === "unavailable") return refreshUnavailable();
      if (refreshResult.status === "invalid") return expiredSession();
      refreshedTokens = refreshResult.tokens;
      backendResponse = await requestBackend(
        path,
        method,
        refreshedTokens.accessToken,
      );
    }

    const response = await forwardBackendResponse(
      backendResponse,
      refreshedTokens,
    );
    if (recurso === "logout" && backendResponse.ok) {
      clearInternalAuthCookies(response);
    }
    return response;
  } catch {
    return NextResponse.json(
      { message: "No se pudo conectar con el servidor." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

function requestBackend(
  path: string,
  method: InternalBackendMethod,
  token: string,
) {
  return fetchBackend(path, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
}

async function forwardBackendResponse(
  backendResponse: Response,
  refreshedTokens: BackendAuthRefreshTokens | null,
) {
  const responseBody = await backendResponse.text();
  const response = new NextResponse(responseBody || null, {
    status: backendResponse.status,
    headers: {
      "Content-Type":
        backendResponse.headers.get("content-type") ?? "application/json",
      "Cache-Control": "no-store",
    },
  });
  if (refreshedTokens) setInternalAuthCookies(response, refreshedTokens);
  return response;
}

function invalidCompanyId() {
  return NextResponse.json(
    { message: "El identificador de empresa no es válido." },
    { status: 400, headers: { "Cache-Control": "no-store" } },
  );
}

function expiredSession() {
  const response = NextResponse.json(
    { message: "La sesión interna expiró. Iniciá sesión nuevamente." },
    { status: 401, headers: { "Cache-Control": "no-store" } },
  );
  clearInternalAuthCookies(response);
  return response;
}

function refreshUnavailable() {
  return NextResponse.json(
    { message: "No se pudo renovar la sesión. Intentá nuevamente." },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
