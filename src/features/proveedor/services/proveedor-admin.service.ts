import {
  deleteCatalogAdminRecord,
  getCatalogAdminRecords,
  updateCatalogAdminRecord,
  updateCatalogAdminRecordWithImage,
} from "@/services/catalog-records-api.service";
import type { CatalogAdminPage } from "@/services/catalog-records-api.service";
import type { Proveedor } from "@/features/proveedor/types/proveedor";

export function getProveedores(
  empresaId: number,
  offset: number,
  search: string,
  signal?: AbortSignal,
): Promise<CatalogAdminPage<Proveedor>> {
  return getCatalogAdminRecords(empresaId, "proveedores", offset, search, signal);
}

export function updateProveedor(empresaId: number, id: string | number, data: Record<string, unknown>) {
  return updateCatalogAdminRecord(empresaId, "proveedores", id, data);
}

export function updateProveedorWithImage(
  empresaId: number,
  id: string | number,
  data: Record<string, unknown>,
  image: File,
) {
  return updateCatalogAdminRecordWithImage(empresaId, "proveedores", id, data, image);
}

export function deleteProveedor(empresaId: number, id: string | number) {
  return deleteCatalogAdminRecord(empresaId, "proveedores", id);
}
