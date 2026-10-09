import { fetchWithAdminSession } from "@/features/auth/services/auth-client.service";
import { formatApiError } from "@/services/format-api-error";
import type { Horario } from "@/features/horario/types/horario";

export async function getHorarios(
  empresaId: number,
): Promise<Horario[]> {
  const response = await fetchWithAdminSession(
    `/api/admin/empresas/${empresaId}/horarios`,
    { cache: "no-store" },
  );
  const result = await readResponse(response);
  if (!response.ok) throw new Error(getApiError(result));
  if (!Array.isArray(result)) {
    throw new Error("El servidor devolvió un horario inválido.");
  }
  return result as Horario[];
}

export async function saveHorarios(
  empresaId: number,
  horarios: Horario[],
): Promise<Horario[]> {
  const response = await fetchWithAdminSession(
    `/api/admin/empresas/${empresaId}/horarios`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ horarios }),
    },
  );
  const result = await readResponse(response);
  if (!response.ok) throw new Error(getApiError(result));
  if (!Array.isArray(result)) {
    throw new Error("El servidor devolvió un horario inválido.");
  }
  return result as Horario[];
}

async function readResponse(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

function getApiError(result: unknown): string {
  if (typeof result !== "object" || result === null || !("message" in result)) {
    return "No se pudo guardar el horario. Intentá nuevamente.";
  }

  const message = (result as { message?: string | string[] }).message;
  return formatApiError(message);
}
