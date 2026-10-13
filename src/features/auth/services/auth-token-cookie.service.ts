import { NextResponse } from "next/server";
import {
  ADMIN_REFRESH_COOKIE,
  ADMIN_REFRESH_MAX_AGE_SECONDS,
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
} from "@/features/auth/constants/auth-cookies";
import {
  INTERNAL_REFRESH_COOKIE,
  INTERNAL_SESSION_COOKIE,
} from "@/features/auth/constants/internal-auth-cookies";
import { fetchBackend } from "@/services/backend-api";

export interface BackendAuthTokens {
  accessToken: string;
  accessTokenMaxAgeSeconds: number;
  refreshToken?: string;
  refreshTokenMaxAgeSeconds?: number;
}

export interface BackendAuthRefreshTokens extends BackendAuthTokens {
  refreshToken: string;
  refreshTokenMaxAgeSeconds: number;
}

export type BackendAuthRefreshResult =
  | { status: "refreshed"; tokens: BackendAuthRefreshTokens }
  | { status: "invalid" }
  | { status: "unavailable" };

const pendingRefreshes = new Map<
  string,
  Promise<BackendAuthRefreshResult>
>();

export function readBackendAuthTokens(headers: Headers): BackendAuthTokens | null {
  const setCookies = headers.getSetCookie();
  const accessToken = readCookie(setCookies, "access_token");
  const refreshToken = readCookie(setCookies, "refresh_token");
  if (!accessToken) return null;

  const tokens: BackendAuthTokens = {
    accessToken: accessToken.value,
    accessTokenMaxAgeSeconds:
      accessToken.maxAge ?? ADMIN_SESSION_MAX_AGE_SECONDS,
  };
  if (refreshToken) {
    tokens.refreshToken = refreshToken.value;
    tokens.refreshTokenMaxAgeSeconds =
      refreshToken.maxAge ?? ADMIN_REFRESH_MAX_AGE_SECONDS;
  }
  return tokens;
}

export function readBackendAuthRefreshTokens(
  headers: Headers,
): BackendAuthRefreshTokens | null {
  const tokens = readBackendAuthTokens(headers);
  if (
    !tokens?.refreshToken ||
    tokens.refreshTokenMaxAgeSeconds === undefined
  ) {
    return null;
  }
  return tokens as BackendAuthRefreshTokens;
}

export function setAdminAuthCookies(
  response: NextResponse,
  tokens: BackendAuthTokens,
): void {
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set(ADMIN_SESSION_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: tokens.accessTokenMaxAgeSeconds,
  });
  if (
    tokens.refreshToken &&
    tokens.refreshTokenMaxAgeSeconds !== undefined
  ) {
    response.cookies.set(ADMIN_REFRESH_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: tokens.refreshTokenMaxAgeSeconds,
    });
  } else {
    response.cookies.set(ADMIN_REFRESH_COOKIE, "", {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
}

export function setInternalAuthCookies(
  response: NextResponse,
  tokens: BackendAuthRefreshTokens,
): void {
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set(INTERNAL_SESSION_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: tokens.accessTokenMaxAgeSeconds,
  });
  response.cookies.set(INTERNAL_REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: tokens.refreshTokenMaxAgeSeconds,
  });
}

export function clearAdminAuthCookies(response: NextResponse): void {
  const secure = process.env.NODE_ENV === "production";
  for (const name of [ADMIN_SESSION_COOKIE, ADMIN_REFRESH_COOKIE]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
}

export function clearInternalAuthCookies(response: NextResponse): void {
  const secure = process.env.NODE_ENV === "production";
  for (const name of [INTERNAL_SESSION_COOKIE, INTERNAL_REFRESH_COOKIE]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
}

export async function refreshBackendAuthTokens(
  refreshToken: string,
): Promise<BackendAuthRefreshResult> {
  const pendingRefresh = pendingRefreshes.get(refreshToken);
  if (pendingRefresh) return pendingRefresh;

  const refresh = requestBackendAuthRefresh(refreshToken);
  pendingRefreshes.set(refreshToken, refresh);
  void refresh.then(
    () => removePendingRefresh(refreshToken, refresh),
    () => removePendingRefresh(refreshToken, refresh),
  );
  return refresh;
}

async function requestBackendAuthRefresh(
  refreshToken: string,
): Promise<BackendAuthRefreshResult> {
  try {
    const response = await fetchBackend("/auth/refresh", {
      method: "POST",
      headers: { Cookie: `refresh_token=${refreshToken}` },
      cache: "no-store",
    });
    if (response.status === 401 || response.status === 403) {
      return { status: "invalid" };
    }
    if (!response.ok) return { status: "unavailable" };

    const tokens = readBackendAuthRefreshTokens(response.headers);
    return tokens
      ? { status: "refreshed", tokens }
      : { status: "unavailable" };
  } catch {
    return { status: "unavailable" };
  }
}

function removePendingRefresh(
  refreshToken: string,
  refresh: Promise<BackendAuthRefreshResult>,
): void {
  if (pendingRefreshes.get(refreshToken) === refresh) {
    pendingRefreshes.delete(refreshToken);
  }
}

function readCookie(
  setCookies: string[],
  name: string,
): { value: string; maxAge: number | null } | null {
  const header = setCookies.find((cookie) =>
    cookie.toLowerCase().startsWith(`${name.toLowerCase()}=`),
  );
  if (!header) return null;

  const firstPart = header.split(";", 1)[0] ?? "";
  const value = firstPart.slice(name.length + 1);
  if (!value) return null;

  const maxAgeMatch = /(?:^|;)\s*max-age=(\d+)/i.exec(header);
  return {
    value,
    maxAge: maxAgeMatch ? Number(maxAgeMatch[1]) : null,
  };
}
