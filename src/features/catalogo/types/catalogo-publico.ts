export const CATALOGO_LISTAS_PUBLICAS = [
  'articulos',
  'marcas',
  'rubros',
  'ofertas',
] as const;

export type CatalogoListaPublica =
  (typeof CATALOGO_LISTAS_PUBLICAS)[number];

export interface CatalogoRegistroPublico {
  id: string | number;
  nombre: string;
  abreviatura?: string | null;
  codigo_interno?: number;
  codigo_proveedor?: string | null;
  codigo_barra?: string | null;
  logo_url?: string | null;
  precio1?: number | null;
  oferta?: boolean;
  no_procesado?: number | boolean;
  marca?: { nombre: string; abreviatura?: string | null } | null;
  rubro?: { nombre: string; abreviatura?: string | null } | null;
  existencia?: number;
  minima_existencia?: number | null;
  maxima_existencia?: number | null;
  tiene_existencia?: boolean;
  unidad_medida?: string | null;
  actualizado_en?: string | null;
  proveedor?: { nombre: string; abreviatura?: string | null } | null;
}

export interface CatalogoPublicoPage {
  records: CatalogoRegistroPublico[];
  hasMore: boolean;
  total: number;
}

export interface CatalogoPublicoFilters {
  search?: string;
  codigoProveedor?: string;
  codigoInterno?: string;
  codigoBarra?: string;
  articuloIds?: string[];
  marcaIds?: string[];
  rubroIds?: string[];
}
