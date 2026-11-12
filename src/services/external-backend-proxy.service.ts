import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { EXTERNAL_REFRESH_COOKIE, EXTERNAL_SESSION_COOKIE } from "@/features/auth/constants/external-auth-cookies";
import { clearExternalAuthCookies, refreshBackendAuthTokens, setExternalAuthCookies } from "@/features/auth/services/auth-token-cookie.service";
import type { BackendAuthRefreshTokens } from "@/features/auth/services/auth-token-cookie.service";
import { fetchBackend } from "@/services/backend-api";

export async function proxyExternalBackendRequest(path: string, method: "GET" | "POST" = "GET", body?: string) {
  const store = await cookies();
  let access = store.get(EXTERNAL_SESSION_COOKIE)?.value;
  const refresh = store.get(EXTERNAL_REFRESH_COOKIE)?.value;
  let renewed: BackendAuthRefreshTokens | null = null;
  if (!access && !refresh) {
    try {
      const response = await fetchBackend(path, { method, ...(body ? { headers: { "Content-Type": "application/json" }, body } : {}), cache: "no-store" });
      return new NextResponse(await response.text() || null, { status: response.status, headers: { "Content-Type": response.headers.get("content-type") ?? "application/json", "Cache-Control": "no-store" } });
    } catch {
      return jsonError("No se pudo conectar con el servidor.", 503);
    }
  }
  if (!access && refresh) {
    const result = await refreshBackendAuthTokens(refresh);
    if (result.status === "unavailable") return jsonError("No se pudo renovar la sesión. Intentá nuevamente.", 503);
    if (result.status === "invalid") return expired();
    renewed = result.tokens;
    access = renewed.accessToken;
  }
  if (!access) return expired();
  try {
    let result = await call(path, method, access, body);
    if (result.status === 401 && !renewed && refresh) {
      const refreshed = await refreshBackendAuthTokens(refresh);
      if (refreshed.status === "unavailable") return jsonError("No se pudo renovar la sesión. Intentá nuevamente.", 503);
      if (refreshed.status === "invalid") return expired();
      renewed = refreshed.tokens;
      result = await call(path, method, renewed.accessToken, body);
    }
    const response = new NextResponse(await result.text() || null, { status: result.status, headers: { "Content-Type": result.headers.get("content-type") ?? "application/json", "Cache-Control": "no-store" } });
    if (renewed) setExternalAuthCookies(response, renewed);
    return response;
  } catch {
    return jsonError("No se pudo conectar con el servidor.", 503);
  }
}

async function call(path: string, method: "GET" | "POST", token: string, body?: string) {
  return fetchBackend(path, { method, headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) }, ...(body ? { body } : {}), cache: "no-store" });
}

function expired() {
  const response = jsonError("La sesión externa expiró. Iniciá sesión nuevamente.", 401);
  clearExternalAuthCookies(response);
  return response;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}
