import { fetchWithAdminSession } from "@/features/auth/services/auth-client.service";
import type {
  UsuarioInterno,
  UsuarioInternoInput,
} from "@/features/usuario/types/usuario-interno";
import { formatApiError } from "@/services/format-api-error";

export async function getUsuariosInternos(
  empresaId: number,
  signal?: AbortSignal,
): Promise<UsuarioInterno[]> {
  const response = await fetchWithAdminSession(
    `/api/admin/empresas/${empresaId}/usuarios-internos`,
    { cache: "no-store", signal },
  );
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(getError(payload));
  if (!Array.isArray(payload) || !payload.every(isUsuarioInterno)) {
    throw new Error("La respuesta de usuarios internos no es válida.");
  }
  return payload;
}

export async function createUsuarioInterno(
  empresaId: number,
  input: UsuarioInternoInput,
): Promise<UsuarioInterno> {
  const response = await fetchWithAdminSession(
    `/api/admin/empresas/${empresaId}/usuarios-internos`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(getError(payload));
  if (!isUsuarioInterno(payload)) {
    throw new Error("La respuesta del usuario interno no es válida.");
  }
  return payload;
}

function isUsuarioInterno(value: unknown): value is UsuarioInterno {
  if (typeof value !== "object" || value === null) return false;
  const usuario = value as Partial<UsuarioInterno>;
  return (
    Number.isSafeInteger(usuario.id) &&
    typeof usuario.nombre === "string" &&
    usuario.role === "Interno" &&
    Number.isSafeInteger(usuario.id_empresa)
  );
}

function getError(payload: unknown) {
  if (typeof payload !== "object" || payload === null || !("message" in payload)) {
    return "No se pudo completar la operación con usuarios internos.";
  }
  const message = (payload as { message?: string | string[] }).message;
  return formatApiError(message);
}
