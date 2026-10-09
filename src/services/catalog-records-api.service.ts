import { fetchWithAdminSession } from "@/features/auth/services/auth-client.service";
import type { CatalogRecordResource } from "@/services/catalog-record-resources";

export interface CatalogAdminRecord {
  id: string | number;
}

export interface CatalogAdminPage<T extends CatalogAdminRecord> {
  records: T[];
  hasMore: boolean;
  total: number;
}

export async function getCatalogAdminRecords<T extends CatalogAdminRecord>(
  empresaId: number,
  resource: CatalogRecordResource,
  offset = 0,
  search = "",
  signal?: AbortSignal,
): Promise<CatalogAdminPage<T>> {
  const query = new URLSearchParams({ offset: String(offset), search });
  const response = await fetchWithAdminSession(
    `/api/empresas/${empresaId}/catalogo/${resource}?${query.toString()}`,
    { cache: "no-store", signal },
  );
  const payload = await readResponse(response);
  if (!response.ok) throw new Error(getApiError(payload));
  if (
    typeof payload !== "object" ||
    payload === null ||
    !Array.isArray((payload as CatalogAdminPage<T>).records) ||
    typeof (payload as CatalogAdminPage<T>).hasMore !== "boolean" ||
    !Number.isSafeInteger((payload as CatalogAdminPage<T>).total) ||
    (payload as CatalogAdminPage<T>).total < 0
  ) {
    throw new Error("La respuesta no tiene un formato válido.");
  }
  return payload as CatalogAdminPage<T>;
}

export async function updateCatalogAdminRecord(
  empresaId: number,
  resource: CatalogRecordResource,
  id: string | number,
  data: Record<string, unknown>,
) {
  const response = await fetchWithAdminSession(
    `/api/empresas/${empresaId}/catalogo/${resource}/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
  await ensureSuccess(response);
}

export async function updateCatalogAdminRecordWithImage(
  empresaId: number,
  resource: CatalogRecordResource,
  id: string | number,
  data: Record<string, unknown>,
  image: File,
) {
  const formData = new FormData();
  formData.append("file", image, image.name);
  formData.append("data", JSON.stringify(data));
  const response = await fetchWithAdminSession(
    `/api/empresas/${empresaId}/catalogo/${resource}/${id}/imagen`,
    { method: "PATCH", body: formData },
  );
  await ensureSuccess(response);
}

export async function deleteCatalogAdminRecord(
  empresaId: number,
  resource: CatalogRecordResource,
  id: string | number,
) {
  const response = await fetchWithAdminSession(
    `/api/empresas/${empresaId}/catalogo/${resource}/${id}`,
    { method: "DELETE" },
  );
  await ensureSuccess(response);
}

async function ensureSuccess(response: Response) {
  const payload = await readResponse(response);
  if (!response.ok) throw new Error(getApiError(payload));
}

async function readResponse(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

function getApiError(payload: unknown) {
  if (typeof payload !== "object" || payload === null || !("message" in payload)) {
    return "No se pudo completar la operación. Revisá los datos e intentá otra vez.";
  }
  const message = (payload as { message?: string | string[] }).message;
  if (Array.isArray(message)) return message.join(" ");
  return message ?? "No se pudo completar la operación. Revisá los datos e intentá otra vez.";
}
