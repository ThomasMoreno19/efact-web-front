import {
  deleteCatalogAdminRecord,
  getCatalogAdminRecords,
  updateCatalogAdminRecord,
  updateCatalogAdminRecordWithImage,
} from "@/services/catalog-records-api.service";
import type {
  CatalogAdminPage,
} from "@/services/catalog-records-api.service";
import type { Articulo } from "@/features/articulo/types/articulo";

export function getArticulos(
  empresaId: number,
  offset: number,
  search: string,
  signal?: AbortSignal,
): Promise<CatalogAdminPage<Articulo>> {
  return getCatalogAdminRecords(empresaId, "articulos", offset, search, signal);
}

export function updateArticulo(
  empresaId: number,
  id: string | number,
  data: Record<string, unknown>,
) {
  return updateCatalogAdminRecord(empresaId, "articulos", id, data);
}

export function updateArticuloWithImage(
  empresaId: number,
  id: string | number,
  data: Record<string, unknown>,
  image: File,
) {
  return updateCatalogAdminRecordWithImage(
    empresaId,
    "articulos",
    id,
    data,
    image,
  );
}

export function deleteArticulo(empresaId: number, id: string | number) {
  return deleteCatalogAdminRecord(empresaId, "articulos", id);
}
