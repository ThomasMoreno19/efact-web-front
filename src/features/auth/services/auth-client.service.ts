interface LoginResult {
  authenticated?: boolean;
  role?: "Superadmin" | "Admin";
  empresaSlug?: string | null;
  message?: string;
}

let pendingAdminRefresh: Promise<Response> | null = null;

export type AdminLoginResult =
  | { role: "Superadmin" }
  | { role: "Admin"; empresaSlug: string };

export async function loginAdmin(
  nombre: string,
  contrasena: string,
): Promise<AdminLoginResult> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, contrasena }),
  });
  const result = (await response.json().catch(() => null)) as LoginResult | null;

  if (!response.ok) {
    throw new Error(
      result?.message ?? "No se pudo iniciar sesión. Intentá nuevamente.",
    );
  }
  if (result?.role === "Superadmin") return { role: "Superadmin" };
  if (
    result?.role === "Admin" &&
    typeof result.empresaSlug === "string" &&
    result.empresaSlug.length > 0
  ) {
    return { role: "Admin", empresaSlug: result.empresaSlug };
  }
  throw new Error("El servidor devolvió una sesión inválida.");
}

export async function refreshAdminSession(): Promise<Response> {
  if (pendingAdminRefresh) return pendingAdminRefresh;

  pendingAdminRefresh = fetch("/api/auth/refresh", {
    method: "POST",
    cache: "no-store",
  })
    .catch(
      () =>
        new Response(
          JSON.stringify({
            message: "No se pudo renovar la sesión. Intentá nuevamente.",
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          },
        ),
    )
    .finally(() => {
      pendingAdminRefresh = null;
    });

  return pendingAdminRefresh;
}

export async function fetchWithAdminSession(
  input: string | URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, init);
  if (response.status !== 401) return response;
  const refreshResponse = await refreshAdminSession();
  if (!refreshResponse.ok) return refreshResponse;
  return fetch(input, init);
}

export async function logoutSuperadmin(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}
