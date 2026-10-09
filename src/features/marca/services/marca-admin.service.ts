import {
  deleteCatalogAdminRecord,
  getCatalogAdminRecords,
  updateCatalogAdminRecord,
  updateCatalogAdminRecordWithImage,
} from "@/services/catalog-records-api.service";
import type { CatalogAdminPage } from "@/services/catalog-records-api.service";
import type { Marca } from "@/features/marca/types/marca";

export function getMarcas(
  empresaId: number,
  offset: number,
  search: string,
  signal?: AbortSignal,
): Promise<CatalogAdminPage<Marca>> {
  return getCatalogAdminRecords(empresaId, "marcas", offset, search, signal);
}

export function updateMarca(empresaId: number, id: string | number, data: Record<string, unknown>) {
  return updateCatalogAdminRecord(empresaId, "marcas", id, data);
}

export function updateMarcaWithImage(
  empresaId: number,
  id: string | number,
  data: Record<string, unknown>,
  image: File,
) {
  return updateCatalogAdminRecordWithImage(
    empresaId,
    "marcas",
    id,
    data,
    image,
  );
}

export function deleteMarca(empresaId: number, id: string | number) {
  return deleteCatalogAdminRecord(empresaId, "marcas", id);
}
