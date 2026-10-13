import {
  CATALOGO_LISTAS_PUBLICAS,
  type CatalogoListaPublica,
  type CatalogoPublicoFilters,
  type CatalogoPublicoPage,
} from '@/features/catalogo/types/catalogo-publico';

export async function getCatalogoPublicoPage(
  empresaId: number,
  lista: CatalogoListaPublica,
  offset: number,
  filters: CatalogoPublicoFilters,
  signal?: AbortSignal,
): Promise<CatalogoPublicoPage> {
  const codigoInterno = filters.codigoInterno?.trim() ?? '';
  if (codigoInterno && !isValidInternalCode(codigoInterno)) {
    return { records: [], hasMore: false, total: 0 };
  }

  const query = new URLSearchParams({ offset: String(offset) });
  const search = filters.search?.trim().replace(/\s+/g, ' ') ?? '';
  const codigoProveedor = filters.codigoProveedor?.trim() ?? '';
  const codigoBarra = filters.codigoBarra?.trim() ?? '';
  if (search) query.set('search', search);
  if (codigoProveedor) query.set('codigoProveedor', codigoProveedor);
  if (codigoInterno) query.set('codigoInterno', codigoInterno);
  if (codigoBarra) query.set('codigoBarra', codigoBarra);
  filters.articuloIds?.forEach((id) => query.append('articuloId', id));
  filters.marcaIds?.forEach((id) => query.append('marcaId', id));
  filters.rubroIds?.forEach((id) => query.append('rubroId', id));

  const response = await fetch(
    `/api/empresas/${empresaId}/catalogo-publico/${lista}?${query.toString()}`,
    { cache: 'no-store', signal },
  );
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(getApiError(payload));
  }
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !Array.isArray((payload as CatalogoPublicoPage).records) ||
    typeof (payload as CatalogoPublicoPage).hasMore !== 'boolean' ||
    !Number.isSafeInteger((payload as CatalogoPublicoPage).total) ||
    (payload as CatalogoPublicoPage).total < 0
  ) {
    throw new Error('La respuesta no tiene un formato válido.');
  }
  return payload as CatalogoPublicoPage;
}

export function isCatalogoListaPublica(
  value: string,
): value is CatalogoListaPublica {
  return CATALOGO_LISTAS_PUBLICAS.includes(value as CatalogoListaPublica);
}

function isValidInternalCode(value: string) {
  if (!/^\d+$/.test(value)) return false;
  const number = Number(value);
  return Number.isInteger(number) && number <= 2_147_483_647;
}

function getApiError(payload: unknown) {
  if (typeof payload !== 'object' || payload === null || !('message' in payload)) {
    return 'No se pudo cargar el catálogo. Intentá nuevamente.';
  }
  const message = (payload as { message?: string | string[] }).message;
  if (Array.isArray(message)) return message.join(' ');
  return message ?? 'No se pudo cargar el catálogo. Intentá nuevamente.';
}
