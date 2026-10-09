import { cookies } from "next/headers";
import { fetchBackend } from "@/services/backend-api";
import type { AdminSession } from "@/features/auth/types/admin-session";
import {
  ADMIN_REFRESH_COOKIE,
  ADMIN_SESSION_COOKIE,
} from "@/features/auth/constants/auth-cookies";

export { ADMIN_REFRESH_COOKIE, ADMIN_SESSION_COOKIE };

export async function getAdminAccessToken(): Promise<string | null> {
  return (await cookies()).get(ADMIN_SESSION_COOKIE)?.value ?? null;
}

export async function getAdminRefreshToken(): Promise<string | null> {
  return (await cookies()).get(ADMIN_REFRESH_COOKIE)?.value ?? null;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const token = await getAdminAccessToken();
  if (!token) return null;

  return validateAdminSession(token);
}

export async function getValidatedAdminAccessToken(): Promise<string | null> {
  const token = await getAdminAccessToken();
  if (!token || !(await validateAdminSession(token))) return null;
  return token;
}

async function validateAdminSession(
  token: string,
): Promise<AdminSession | null> {
  try {
    const response = await fetchBackend("/auth/session", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) return null;

    const session = (await response.json()) as Partial<AdminSession>;
    if (
      !Number.isInteger(session.id) ||
      typeof session.nombre !== "string" ||
      session.role !== "Superadmin"
    ) {
      return null;
    }

    return session as AdminSession;
  } catch {
    return null;
  }
}
