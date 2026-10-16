import type { CatalogoItemCarrito } from '@/features/catalogo/types/catalogo-carrito';

interface PedidoPublicoCreado {
  id: number;
  numeroPedido: number;
  createdAt: string;
}

export async function createPedidoPublico(
  empresaId: number,
  nombre: string,
  observacion: string,
  items: CatalogoItemCarrito[],
): Promise<PedidoPublicoCreado> {
  const response = await fetch(`/api/empresas/${empresaId}/pedidos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({
      nombre,
      observacion,
      detallePedido: items.map((item) => ({
        idArticulo: String(item.articulo.id),
        cantidad: item.cantidad,
        observacion: [
          item.observacion1,
          item.observacion2,
          item.observacion3,
        ]
          .map((value) => value.trim())
          .filter(Boolean)
          .join(' | '),
      })),
    }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(getApiError(payload));
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !Number.isSafeInteger((payload as PedidoPublicoCreado).id) ||
    !Number.isSafeInteger((payload as PedidoPublicoCreado).numeroPedido) ||
    (payload as PedidoPublicoCreado).numeroPedido < 1 ||
    (payload as PedidoPublicoCreado).numeroPedido > 10_000 ||
    typeof (payload as PedidoPublicoCreado).createdAt !== 'string'
  ) {
    throw new Error('La respuesta no tiene un formato válido.');
  }
  return payload as PedidoPublicoCreado;
}

function getApiError(payload: unknown) {
  if (typeof payload !== 'object' || payload === null || !('message' in payload)) {
    return 'No se pudo registrar el pedido. Intentá nuevamente.';
  }
  const message = (payload as { message?: string | string[] }).message;
  if (Array.isArray(message)) return message.join(' ');
  return message ?? 'No se pudo registrar el pedido. Intentá nuevamente.';
}
