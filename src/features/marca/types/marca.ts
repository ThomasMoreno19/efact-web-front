import type { CatalogAdminRecord } from "@/services/catalog-records-api.service";

export interface Marca extends CatalogAdminRecord {
  nombre: string;
  abreviatura: string | null;
  logo_url: string | null;
}
