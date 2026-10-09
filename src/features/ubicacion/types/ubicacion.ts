import type { CatalogAdminRecord } from "@/services/catalog-records-api.service";

export interface Ubicacion extends CatalogAdminRecord {
  descripcion: string;
}
