import type { CatalogAdminRecord } from "@/services/catalog-records-api.service";

export interface Proveedor extends CatalogAdminRecord {
  nombre: string;
  abreviatura: string | null;
}
