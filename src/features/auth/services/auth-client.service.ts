interface LoginResult {
  message?: string;
}

let pendingAdminRefresh: Promise<Response> | null = null;

export async function loginSuperadmin(nombre: string, contrasena: string) {
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
