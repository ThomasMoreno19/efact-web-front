import { NextResponse } from "next/server";
import {
  getAdminRefreshToken,
  getValidatedAdminAccessToken,
} from "@/features/auth/services/admin-session.service";
import {
  refreshBackendAuthTokens,
  setAdminAuthCookies,
} from "@/features/auth/services/auth-token-cookie.service";
import type { BackendAuthTokens } from "@/features/auth/services/auth-token-cookie.service";
import { fetchBackend } from "@/services/backend-api";

export async function proxyAdminBackendRequest(
  path: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  body?: BodyInit,
) {
  let token = await getValidatedAdminAccessToken();
  let refreshedTokens: BackendAuthTokens | null = null;

  if (!token) {
    const refreshResult = await refreshAdminTokens();
    if (refreshResult.status === "unavailable") return refreshUnavailable();
    if (refreshResult.status === "invalid") return expiredSession();
    refreshedTokens = refreshResult.tokens;
    token = refreshedTokens.accessToken;
  }

  try {
    let backendResponse = await requestBackend(path, method, body, token);

    if (backendResponse.status === 401 && !refreshedTokens) {
      const refreshResult = await refreshAdminTokens();
      if (refreshResult.status === "unavailable") return refreshUnavailable();
      if (refreshResult.status === "invalid") return expiredSession();

      refreshedTokens = refreshResult.tokens;
      backendResponse = await requestBackend(
        path,
        method,
        body,
        refreshedTokens.accessToken,
      );
    }

    return forwardBackendResponse(backendResponse, refreshedTokens);
  } catch {
    return NextResponse.json(
      { message: "No se pudo conectar con el servidor." },
      { status: 503 },
    );
  }
}

async function refreshAdminTokens() {
  const refreshToken = await getAdminRefreshToken();
  if (!refreshToken) return { status: "invalid" } as const;
  return refreshBackendAuthTokens(refreshToken);
}

function requestBackend(
  path: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  body: BodyInit | undefined,
  token: string,
) {
  const headers = new Headers({ Authorization: `Bearer ${token}` });
  if (typeof body === "string") headers.set("Content-Type", "application/json");

  return fetchBackend(path, {
    method,
    headers,
    body,
    cache: "no-store",
  });
}

async function forwardBackendResponse(
  backendResponse: Response,
  refreshedTokens: BackendAuthTokens | null,
) {
  const responseBody = await backendResponse.text();
  const response = responseBody
    ? new NextResponse(responseBody, {
        status: backendResponse.status,
        headers: {
          "Content-Type":
            backendResponse.headers.get("content-type") ?? "application/json",
        },
      })
    : new NextResponse(null, { status: backendResponse.status });

  if (refreshedTokens) setAdminAuthCookies(response, refreshedTokens);
  return response;
}

function expiredSession() {
  return NextResponse.json(
    { message: "La sesión expiró. Iniciá sesión nuevamente." },
    { status: 401 },
  );
}

function refreshUnavailable() {
  return NextResponse.json(
    { message: "No se pudo renovar la sesión. Intentá nuevamente." },
    { status: 503 },
  );
}
