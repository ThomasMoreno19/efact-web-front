import {
  deleteCatalogAdminRecord,
  getCatalogAdminRecords,
  updateCatalogAdminRecord,
  updateCatalogAdminRecordWithImage,
} from "@/services/catalog-records-api.service";
import type { CatalogAdminPage } from "@/services/catalog-records-api.service";
import type { Rubro } from "@/features/rubro/types/rubro";

export function getRubros(
  empresaId: number,
  offset: number,
  search: string,
  signal?: AbortSignal,
): Promise<CatalogAdminPage<Rubro>> {
  return getCatalogAdminRecords(empresaId, "rubros", offset, search, signal);
}

export function updateRubro(empresaId: number, id: string | number, data: Record<string, unknown>) {
  return updateCatalogAdminRecord(empresaId, "rubros", id, data);
}

export function updateRubroWithImage(
  empresaId: number,
  id: string | number,
  data: Record<string, unknown>,
  image: File,
) {
  return updateCatalogAdminRecordWithImage(
    empresaId,
    "rubros",
    id,
    data,
    image,
  );
}

export function deleteRubro(empresaId: number, id: string | number) {
  return deleteCatalogAdminRecord(empresaId, "rubros", id);
}
