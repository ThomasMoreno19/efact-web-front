import { NextResponse } from 'next/server';
import { fetchBackend } from '@/services/backend-api';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return invalidRequest('El identificador de empresa no es válido.', 400);
  }

  try {
    const response = await fetchBackend(`/empresas/${id}/horarios`, {
      cache: 'no-store',
    });
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
