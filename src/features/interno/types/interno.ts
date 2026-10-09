export interface InternalSession {
  id: number;
  idEmpresa: number;
  nombre: string;
  role: "Interno";
}

export interface CatalogoInternoArticulo {
  id: string;
  codigoInterno: number;
  nombre: string;
  precio1: number | null;
  precio2: number | null;
  precio3: number | null;
  existencia: number;
  tieneExistencia: boolean;
}

export interface CatalogoInternoPagina {
  records: CatalogoInternoArticulo[];
  total: number;
  hasMore: boolean;
}

export interface SaldoInternoCliente {
  nombre: string | null;
  saldo: number | null;
  updatedAt: string | null;
}
