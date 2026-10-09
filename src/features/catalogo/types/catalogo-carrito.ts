import type { CatalogoRegistroPublico } from '@/features/catalogo/types/catalogo-publico';

export interface CatalogoItemCarrito {
  articulo: CatalogoRegistroPublico;
  cantidad: number;
  precioConsultar: boolean;
  observacion1: string;
  observacion2: string;
  observacion3: string;
}

export type CatalogoObservacionCarrito =
  | 'observacion1'
  | 'observacion2'
  | 'observacion3';
