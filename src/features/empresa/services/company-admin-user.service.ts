import { fetchWithAdminSession } from "@/features/auth/services/auth-client.service";
import { formatApiError } from "@/services/format-api-error";

export interface CompanyAdminUser {
  id: number;
  nombre: string;
  role: "Admin";
  id_empresa: number;
}

export async function getCompanyAdminUser(
  empresaId: number,
  signal?: AbortSignal,
): Promise<CompanyAdminUser | null> {
  const response = await fetchWithAdminSession(
    `/api/admin/empresas/${empresaId}/usuario-admin`,
    { cache: "no-store", signal },
  );
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(getError(payload));
  if (payload === null) return null;
  if (!isCompanyAdminUser(payload, empresaId)) {
    throw new Error("La respuesta del usuario Admin no es válida.");
  }
  return payload;
}

export async function saveCompanyAdminUser(
  empresaId: number,
  input: { nombre: string; contrasena?: string },
): Promise<CompanyAdminUser> {
  const response = await fetchWithAdminSession(
    `/api/admin/empresas/${empresaId}/usuario-admin`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(getError(payload));
  if (!isCompanyAdminUser(payload, empresaId)) {
    throw new Error("La respuesta del usuario Admin no es válida.");
  }
  return payload;
}

export async function updateCompanyAdminUser(
  empresaId: number,
  input: {
    nombre: string;
    contrasenaActual?: string;
    contrasenaNueva?: string;
  },
): Promise<CompanyAdminUser> {
  const response = await fetchWithAdminSession(
    `/api/admin/empresas/${empresaId}/usuario-admin`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(getError(payload));
  if (!isCompanyAdminUser(payload, empresaId)) {
    throw new Error("La respuesta del usuario Admin no es válida.");
  }
  return payload;
}

function isCompanyAdminUser(
  value: unknown,
  empresaId: number,
): value is CompanyAdminUser {
  if (typeof value !== "object" || value === null) return false;
  const usuario = value as Partial<CompanyAdminUser>;
  return (
    Number.isSafeInteger(usuario.id) &&
    typeof usuario.nombre === "string" &&
    usuario.role === "Admin" &&
    usuario.id_empresa === empresaId
  );
}

function getError(payload: unknown) {
  if (typeof payload !== "object" || payload === null || !("message" in payload)) {
    return "No se pudo completar la operación con el usuario Admin.";
  }
  const message = (payload as { message?: string | string[] }).message;
  return formatApiError(message);
}
