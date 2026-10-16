import type { CatalogoItemCarrito } from '@/features/catalogo/types/catalogo-carrito';
import { formatCurrency } from '@/features/catalogo/utils/catalogo-publico';

export function buildPedidoWhatsappMessage(
  nombre: string,
  observacionPedido: string,
  items: CatalogoItemCarrito[],
  numeroPedido: number,
  now = new Date(),
) {
  const lines = items.map((item) => {
    const articulo = item.articulo;
    const subtotal =
      item.precioConsultar || articulo.precio1 === null || articulo.precio1 === undefined
        ? 'Consultar'
        : formatCurrency(articulo.precio1 * item.cantidad).replace(/\s/g, '');
    const observations = [
      item.observacion1,
      item.observacion2,
      item.observacion3,
    ]
      .map((value) => value.replace(/[\r\n]+/g, ' ').trim())
      .filter(Boolean);
    const observation = observations.length
      ? ` #obse:${observations.join(' | ')}`
      : '';
    const description = articulo.nombre.replace(/[\r\n]+/g, ' ').trim();

    return `#codi:${articulo.codigo_interno ?? ''} #cant:${item.cantidad} #subt:${subtotal} #desc:${description}${observation}`;
  });

  return [
    `Pedido #${numeroPedido}`,
    '',
    `Nombre: ${nombre.trim()}`,
    `Observación: ${observacionPedido.trim()}`,
    '',
    `+Fecha: ${formatOrderDate(now)}`,
    '',
    ...lines,
  ].join('\n');
}

export function buildWhatsappUrl(phoneNumber: string, message: string) {
  const number = phoneNumber.replace(/\D/g, '').replace(/^00/, '');
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function formatOrderDate(date: Date) {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
    .format(date)
    .replace(/([ap])\.\s*m\./i, '$1.m.');
}
