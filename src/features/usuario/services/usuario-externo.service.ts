import { fetchWithAdminSession } from "@/features/auth/services/auth-client.service";
import type { UsuarioExterno } from "@/features/usuario/types/usuario-externo";
import { formatApiError } from "@/services/format-api-error";

export async function getUsuariosExternos(empresaId: number, signal?: AbortSignal): Promise<UsuarioExterno[]> {
  const response = await fetchWithAdminSession(`/api/admin/empresas/${empresaId}/usuarios-externos`, { cache: "no-store", signal });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(apiError(payload));
  if (!Array.isArray(payload) || !payload.every(isExternal)) throw new Error("La respuesta de usuarios externos no es válida.");
  return payload;
}

export async function createUsuarioExterno(empresaId: number, contrasena: string): Promise<UsuarioExterno> {
  const response = await fetchWithAdminSession(`/api/admin/empresas/${empresaId}/usuarios-externos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contrasena }) });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(apiError(payload));
  if (!isExternal(payload)) throw new Error("La respuesta del usuario externo no es válida.");
  return payload;
}

export async function updateUsuarioExterno(empresaId: number, usuarioId: number, contrasena: string): Promise<UsuarioExterno> {
  const response = await fetchWithAdminSession(`/api/admin/empresas/${empresaId}/usuarios-externos/${usuarioId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contrasena }) });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(apiError(payload));
  if (!isExternal(payload)) throw new Error("La respuesta del usuario externo no es válida.");
  return payload;
}

export async function deleteUsuarioExterno(empresaId: number, usuarioId: number): Promise<void> {
  const response = await fetchWithAdminSession(`/api/admin/empresas/${empresaId}/usuarios-externos/${usuarioId}`, { method: "DELETE" });
  if (!response.ok) throw new Error(apiError(await response.json().catch(() => null)));
}

function isExternal(value: unknown): value is UsuarioExterno {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<UsuarioExterno>;
  return Number.isSafeInteger(record.id) && record.role === "Externo" && Number.isSafeInteger(record.id_empresa);
}

function apiError(payload: unknown) {
  return formatApiError(typeof payload === "object" && payload !== null && "message" in payload ? (payload as { message?: string | string[] }).message : undefined);
}
