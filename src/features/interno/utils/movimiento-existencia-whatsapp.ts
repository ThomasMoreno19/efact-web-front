import type { CatalogoInternoArticulo } from '@/features/interno/types/interno';

export interface MovimientoExistenciaItem {
  articulo: CatalogoInternoArticulo;
  cantidad: string;
  observacion: string;
}

export function buildMovimientoExistenciaWhatsappMessage(
  nombre: string,
  observacionPedido: string,
  items: MovimientoExistenciaItem[],
  now = new Date(),
) {
  const itemLines = items.map((item) => {
    const observacion = cleanMessageValue(item.observacion);
    const observacionTag = observacion ? ` #obse:${observacion}` : '';
    const descripcion = cleanMessageValue(item.articulo.nombre);
    return `#codi:${item.articulo.codigoInterno} #cant:${Number(item.cantidad)} #exist:${item.articulo.existencia} #desc:${descripcion}${observacionTag}`;
  });
  const observacion = cleanMessageValue(observacionPedido);

  return [
    'Movimiento de existencia',
    'La cantidad ingresada representa la existencia real',
    '',
    `Nombre: ${cleanMessageValue(nombre)}`,
    '',
    `+Fecha: ${formatMovementDate(now)}`,
    ...(observacion ? [`Observación: ${observacion}`] : []),
    '',
    ...itemLines,
  ].join('\n');
}

export function buildInternalWhatsappUrl(phoneNumber: string, message: string) {
  const number = phoneNumber.replace(/\D/g, '').replace(/^00/, '');
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function formatMovementDate(date: Date) {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

function cleanMessageValue(value: string) {
  return value.replace(/[\r\n]+/g, ' ').trim();
}
