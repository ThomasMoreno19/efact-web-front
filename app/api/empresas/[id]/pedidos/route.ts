import { NextResponse } from 'next/server';
import { proxyExternalBackendRequest } from '@/services/external-backend-proxy.service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (
    !/^\d+$/.test(id) ||
    !Number.isSafeInteger(Number(id)) ||
    Number(id) > 2_147_483_647
  ) {
    return invalidRequest('El identificador de empresa no es válido.', 400);
  }

  const body = await request.json().catch(() => null);
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return invalidRequest('Los datos del pedido no son válidos.', 400);
  }

  try {
    return proxyExternalBackendRequest(`empresas/${id}/pedidos`, 'POST', JSON.stringify(body));
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
