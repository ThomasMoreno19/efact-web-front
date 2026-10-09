import { fetchWithAdminSession } from "@/features/auth/services/auth-client.service";
import { MOVIMIENTOS_PAGE_SIZE } from "@/features/movimiento-equipo/constants/movimientos-page";
import type {
  MovimientoAdminPage,
  MovimientoAdminRecord,
} from "@/features/movimiento-equipo/types/movimiento-equipo";

export async function getMovimientosAdminPage(
  empresaId: number,
  offset: number,
  signal?: AbortSignal,
): Promise<MovimientoAdminPage> {
  const query = new URLSearchParams({
    offset: String(offset),
    limit: String(MOVIMIENTOS_PAGE_SIZE),
  });
  const response = await fetchWithAdminSession(
    `/api/empresas/${empresaId}/movimientos?${query.toString()}`,
    { cache: "no-store", signal },
  );
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(getApiError(payload));
  if (!isMovimientoAdminPage(payload)) {
    throw new Error("La respuesta de movimientos no tiene un formato válido.");
  }
  return payload;
}

function isMovimientoAdminPage(value: unknown): value is MovimientoAdminPage {
  if (typeof value !== "object" || value === null) return false;
  const page = value as Partial<MovimientoAdminPage>;
  return (
    Array.isArray(page.records) &&
    page.records.every(isMovimientoAdminRecord) &&
    Number.isSafeInteger(page.total) &&
    (page.total as number) >= 0 &&
    typeof page.hasMore === "boolean"
  );
}

function isMovimientoAdminRecord(value: unknown): value is MovimientoAdminRecord {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Partial<MovimientoAdminRecord>;
  if (typeof record.equipo !== "object" || record.equipo === null) return false;
  const equipo = record.equipo as MovimientoAdminRecord["equipo"];
  return (
    Number.isSafeInteger(record.id) &&
    Number.isSafeInteger(record.idEquipo) &&
    isNullableString(record.estado) &&
    isNullableString(record.fecha) &&
    isNullableString(record.observacion) &&
    isNullableString(equipo.nombreEquipo) &&
    isNullableString(equipo.marca) &&
    isNullableString(equipo.modelo) &&
    isNullableString(equipo.numeroSerie) &&
    isNullableString(equipo.nombreCliente)
  );
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function getApiError(payload: unknown) {
  if (typeof payload !== "object" || payload === null || !("message" in payload)) {
    return "No se pudieron cargar los movimientos de reparación.";
  }
  const message = (payload as { message?: string | string[] }).message;
  if (Array.isArray(message)) return message.join(" ");
  return message ?? "No se pudieron cargar los movimientos de reparación.";
}
