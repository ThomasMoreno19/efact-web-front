import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ADMIN_REFRESH_COOKIE,
  ADMIN_SESSION_COOKIE,
} from "@/features/auth/constants/auth-cookies";
import {
  clearAdminAuthCookies,
  refreshBackendAuthTokens,
  setAdminAuthCookies,
} from "@/features/auth/services/auth-token-cookie.service";

export async function proxy(request: NextRequest) {
  const companyAdministrationMatch = request.nextUrl.pathname.match(
    /^\/([^/]+)\/administraci(?:ó|%c3%b3)n\/?$/i,
  );
  const rewriteUrl = companyAdministrationMatch
    ? request.nextUrl.clone()
    : null;

  if (rewriteUrl && companyAdministrationMatch) {
    rewriteUrl.pathname = `/${companyAdministrationMatch[1]}/administracion`;
  }

  const pathname = request.nextUrl.pathname;
  const isAdminRequest =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/api/admin" ||
    pathname.startsWith("/api/admin/");

  if (!rewriteUrl && !isAdminRequest) return NextResponse.next();

  const accessToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const refreshToken = request.cookies.get(ADMIN_REFRESH_COOKIE)?.value;
  const accessNeedsRefresh = !accessToken || isAccessTokenExpiring(accessToken);

  if (!accessNeedsRefresh) return continueRequest(request, rewriteUrl);

  if (!refreshToken) {
    request.cookies.delete(ADMIN_SESSION_COOKIE);
    const response = continueRequest(request, rewriteUrl);
    clearAdminAuthCookies(response);
    return response;
  }

  const refreshResult = await refreshBackendAuthTokens(refreshToken);
  if (refreshResult.status !== "refreshed") {
    return continueRequest(request, rewriteUrl);
  }

  const tokens = refreshResult.tokens;
  request.cookies.set(ADMIN_SESSION_COOKIE, tokens.accessToken);
  request.cookies.set(ADMIN_REFRESH_COOKIE, tokens.refreshToken);
  const response = continueRequest(request, rewriteUrl);
  setAdminAuthCookies(response, tokens);
  return response;
}

export const config = {
  matcher: ["/:empresa/:path*", "/admin/:path*", "/api/admin/:path*"],
};

function continueRequest(request: NextRequest, rewriteUrl: URL | null = null) {
  const options = { request: { headers: request.headers } };
  return rewriteUrl
    ? NextResponse.rewrite(rewriteUrl, options)
    : NextResponse.next(options);
}

function isAccessTokenExpiring(token: string): boolean {
  const payload = token.split(".")[1];
  if (!payload) return true;

  try {
    const claims = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { exp?: unknown };
    return (
      typeof claims.exp !== "number" ||
      claims.exp <= Math.floor(Date.now() / 1000) + 30
    );
  } catch {
    return true;
  }
}
