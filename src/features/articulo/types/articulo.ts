import type { CatalogAdminRecord } from "@/services/catalog-records-api.service";

export interface Articulo extends CatalogAdminRecord {
  codigo_interno: number;
  codigo_barra: string | null;
  nombre: string;
  precio1: number | null;
  precio2: number | null;
  precio3: number | null;
  existencia: number;
  minima_existencia: number | null;
  maxima_existencia: number | null;
  tiene_existencia: boolean;
  no_procesado: number;
  oferta: boolean;
  logo_url: string | null;
}
