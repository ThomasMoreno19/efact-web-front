import {
  deleteCatalogAdminRecord,
  getCatalogAdminRecords,
  updateCatalogAdminRecord,
} from "@/services/catalog-records-api.service";
import type { CatalogAdminPage } from "@/services/catalog-records-api.service";
import type { Ubicacion } from "@/features/ubicacion/types/ubicacion";

export function getUbicaciones(
  empresaId: number,
  offset: number,
  search: string,
  signal?: AbortSignal,
): Promise<CatalogAdminPage<Ubicacion>> {
  return getCatalogAdminRecords(empresaId, "ubicaciones", offset, search, signal);
}

export function updateUbicacion(empresaId: number, id: string | number, data: Record<string, unknown>) {
  return updateCatalogAdminRecord(empresaId, "ubicaciones", id, data);
}

export function deleteUbicacion(empresaId: number, id: string | number) {
  return deleteCatalogAdminRecord(empresaId, "ubicaciones", id);
}
