import { NextResponse } from 'next/server';
import { fetchBackend } from '@/services/backend-api';
import { isCatalogoListaPublica } from '@/features/catalogo/services/catalogo-publico.service';
import { isValidCatalogoArticleId } from '@/features/catalogo/utils/catalogo-carrito-url';

interface RouteContext {
  params: Promise<{ id: string; lista: string }>;
}

export async function GET(request: Request, { params }: RouteContext) {
  const { id, lista } = await params;
  if (!/^\d+$/.test(id)) {
    return invalidRequest('El identificador de empresa no es válido.', 400);
  }
  if (!isCatalogoListaPublica(lista)) {
    return invalidRequest('La lista de catálogo no es válida.', 400);
  }

  const searchParams = new URL(request.url).searchParams;
  const offset = searchParams.get('offset') ?? '0';
  const search = searchParams.get('search') ?? '';
  const codigoProveedor = searchParams.get('codigoProveedor') ?? '';
  const codigoInterno = searchParams.get('codigoInterno') ?? '';
  const articuloIds = searchParams.getAll('articuloId');
  const marcaIds = searchParams.getAll('marcaId');
  const rubroIds = searchParams.getAll('rubroId');
  if (!/^\d+$/.test(offset) || !Number.isSafeInteger(Number(offset))) {
    return invalidRequest('El desplazamiento de la lista no es válido.', 400);
  }
  if (search.length > 100) {
    return invalidRequest('La búsqueda no puede superar 100 caracteres.', 400);
  }
  if (codigoProveedor.length > 200) {
    return invalidRequest(
      'El código de proveedor no puede superar 200 caracteres.',
      400,
    );
  }
  if (
    codigoInterno &&
    (!/^\d+$/.test(codigoInterno) ||
      !Number.isInteger(Number(codigoInterno)) ||
      Number(codigoInterno) > 2_147_483_647)
  ) {
    return invalidRequest('El código interno no es válido.', 400);
  }
  if (!areValidFilterIds(marcaIds) || !areValidFilterIds(rubroIds)) {
    return invalidRequest('Los filtros de marca o rubro no son válidos.', 400);
  }
  if (
    (articuloIds.length > 0 && lista !== 'articulos') ||
    !areValidArticleIds(articuloIds)
  ) {
    return invalidRequest('Los identificadores de artículos no son válidos.', 400);
  }

  const query = new URLSearchParams({ offset });
  if (search) query.set('search', search);
  if (codigoProveedor) query.set('codigoProveedor', codigoProveedor);
  if (codigoInterno) query.set('codigoInterno', codigoInterno);
  articuloIds.forEach((id) => query.append('articuloId', id));
  marcaIds.forEach((id) => query.append('marcaId', id));
  rubroIds.forEach((id) => query.append('rubroId', id));

  try {
    const response = await fetchBackend(
      `/empresas/${id}/catalogo-publico/${lista}?${query.toString()}`,
      { cache: 'no-store' },
    );
    const body = await response.text();
    return new NextResponse(body || null, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return invalidRequest('No se pudo conectar con el servidor.', 503);
  }
}

function invalidRequest(message: string, status: number) {
  return NextResponse.json(
    { message },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );
}

function areValidFilterIds(values: string[]) {
  return values.every((value) => {
    if (!/^\d+$/.test(value)) return false;
    const id = Number(value);
    return Number.isSafeInteger(id) && id <= 2_147_483_647;
  });
}

function areValidArticleIds(values: string[]) {
  return values.every(isValidCatalogoArticleId);
}
