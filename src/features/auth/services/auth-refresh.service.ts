import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_REFRESH_COOKIE,
  ADMIN_SESSION_COOKIE,
} from "@/features/auth/constants/auth-cookies";
import {
  clearAdminAuthCookies,
  refreshBackendAuthTokens,
  setAdminAuthCookies,
} from "@/features/auth/services/auth-token-cookie.service";
import { fetchBackend } from "@/services/backend-api";

export async function handleAdminRefresh() {
  const refreshToken = (await cookies()).get(ADMIN_REFRESH_COOKIE)?.value;
  if (!refreshToken) return expiredSessionResponse(true);

  const refreshResult = await refreshBackendAuthTokens(refreshToken);
  if (refreshResult.status === "invalid") return expiredSessionResponse();
  if (refreshResult.status === "unavailable") {
    return NextResponse.json(
      { message: "No se pudo renovar la sesión. Intentá nuevamente." },
      { status: 503 },
    );
  }

  const response = NextResponse.json({ authenticated: true });
  setAdminAuthCookies(response, refreshResult.tokens);
  return response;
}

export async function handleAdminLogout() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const refreshToken = cookieStore.get(ADMIN_REFRESH_COOKIE)?.value;

  let accessTokenToRevoke = accessToken;
  if (!accessTokenToRevoke && refreshToken) {
    const refreshResult = await refreshBackendAuthTokens(refreshToken);
    if (refreshResult.status === "refreshed") {
      accessTokenToRevoke = refreshResult.tokens.accessToken;
    }
  }

  if (accessTokenToRevoke) {
    const response = await logoutBackendSession(accessTokenToRevoke);
    if (!response.ok && refreshToken && accessTokenToRevoke === accessToken) {
      const refreshResult = await refreshBackendAuthTokens(refreshToken);
      if (refreshResult.status === "refreshed") {
        await logoutBackendSession(refreshResult.tokens.accessToken);
      }
    }
  }

  const response = NextResponse.json({ authenticated: false });
  clearAdminAuthCookies(response);
  return response;
}

function expiredSessionResponse(clearCookies = false) {
  const response = NextResponse.json(
    { message: "La sesión expiró. Iniciá sesión nuevamente." },
    { status: 401 },
  );
  if (clearCookies) clearAdminAuthCookies(response);
  return response;
}

async function logoutBackendSession(accessToken: string): Promise<Response> {
  try {
    return await fetchBackend("/auth/logout", {
      method: "POST",
      headers: { Cookie: `access_token=${accessToken}` },
      cache: "no-store",
    });
  } catch {
    return new Response(null, { status: 503 });
  }
}
