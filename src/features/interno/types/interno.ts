export interface InternalSession {
  id: number;
  idEmpresa: number;
  role: "Interno";
}

export type CatalogoInternoLista =
  | "articulos"
  | "marcas"
  | "rubros"
  | "ofertas"
  | "proveedores"
  | "ubicaciones";

export interface CatalogoInternoFiltros {
  search?: string;
  codigoProveedor?: string;
  codigoInterno?: string;
  codigoBarra?: string;
  marcaIds?: number[];
  rubroIds?: number[];
  proveedorIds?: number[];
  ubicacionIds?: number[];
}

export interface CatalogoInternoRelacion {
  id: number;
  nombre: string;
  abreviatura?: string | null;
}

export interface CatalogoInternoCategoria {
  id: number;
  nombre: string;
  logoUrl: string | null;
}

export interface CatalogoInternoArticulo {
  id: string;
  codigoInterno: number;
  codigoProveedor: string | null;
  codigoBarra: string | null;
  nombre: string;
  logoUrl: string | null;
  precio1: number | null;
  precio2: number | null;
  precio3: number | null;
  existencia: number;
  tieneExistencia: boolean;
  minimaExistencia: number | null;
  maximaExistencia: number | null;
  oferta: boolean;
  actualizadoEn: string | null;
  marca: CatalogoInternoRelacion | null;
  rubro: CatalogoInternoRelacion | null;
  proveedor: CatalogoInternoRelacion | null;
  ubicacion: CatalogoInternoRelacion | null;
}

export type CatalogoInternoRegistro =
  | CatalogoInternoArticulo
  | CatalogoInternoCategoria;

export interface CatalogoInternoPagina {
  records: CatalogoInternoRegistro[];
  total: number;
  hasMore: boolean;
}

export interface SaldoInternoCliente {
  nombre: string | null;
  saldo: number | null;
  updatedAt: string | null;
}
