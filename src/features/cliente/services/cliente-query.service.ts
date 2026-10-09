import type { ClienteApiError, ClienteSaldo } from "@/features/cliente/types/cliente";

export async function getSaldosClientes(
  empresaId: number,
  signal?: AbortSignal,
): Promise<ClienteSaldo[]> {
  const response = await fetch(`/api/empresas/${empresaId}/clientes/saldos`, {
    cache: "no-store",
    signal,
  });
  const payload = (await response.json().catch(() => null)) as
    | ClienteSaldo[]
    | ClienteApiError
    | null;

  if (!response.ok) {
    throw new Error(
      !Array.isArray(payload) && payload?.message
        ? payload.message
        : "No se pudieron cargar los saldos de los clientes.",
    );
  }
  if (!Array.isArray(payload)) {
    throw new Error("La respuesta de saldos no tiene un formato válido.");
  }
  return payload;
}
