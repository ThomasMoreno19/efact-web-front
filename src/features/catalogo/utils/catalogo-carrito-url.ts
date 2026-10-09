export const MAX_CART_QUANTITY = 20;

export interface CatalogoCarritoEntrada {
  id: string;
  cantidad: number;
  observacion1: string;
  observacion2: string;
  observacion3: string;
}

const MAX_ARTICLE_ID = '9223372036854775807';

export function parseCatalogoCarritoEntries(
  value: string | string[] | undefined,
): CatalogoCarritoEntrada[] {
  const values = value === undefined ? [] : Array.isArray(value) ? value : [value];
  const entries = new Map<string, CatalogoCarritoEntrada>();

  for (const value of values) {
    let payload: unknown;
    try {
      payload = JSON.parse(value);
    } catch {
      continue;
    }
    if (!Array.isArray(payload) || payload.length !== 5) continue;

    const [rawId, rawQuantity, rawObservation1, rawObservation2, rawObservation3] =
      payload;
    if (
      typeof rawId !== 'string' ||
      (typeof rawQuantity !== 'number' && typeof rawQuantity !== 'string')
    ) {
      continue;
    }

    if (!isValidCatalogoArticleId(rawId)) continue;
    const cantidad = Number(rawQuantity);
    if (!Number.isSafeInteger(cantidad) || cantidad < 1) {
      continue;
    }

    const normalizedId = rawId.replace(/^0+(?=\d)/, '');
    const existing = entries.get(normalizedId);
    entries.set(normalizedId, {
      id: normalizedId,
      cantidad: Math.min(MAX_CART_QUANTITY, (existing?.cantidad ?? 0) + cantidad),
      observacion1: existing?.observacion1 ?? normalizeObservation(rawObservation1),
      observacion2: existing?.observacion2 ?? normalizeObservation(rawObservation2),
      observacion3: existing?.observacion3 ?? normalizeObservation(rawObservation3),
    });
  }

  return [...entries.values()];
}

export function isValidCatalogoArticleId(value: string) {
  if (!/^\d+$/.test(value)) return false;
  const normalized = value.replace(/^0+(?=\d)/, '');
  return (
    normalized !== '0' &&
    (normalized.length < MAX_ARTICLE_ID.length ||
      (normalized.length === MAX_ARTICLE_ID.length &&
        normalized <= MAX_ARTICLE_ID))
  );
}

export function buildCatalogoCarritoUrl(
  pathname: string,
  entries: CatalogoCarritoEntrada[],
) {
  const query = new URLSearchParams();
  serializeCatalogoCarritoEntries(entries).forEach((value) =>
    query.append('articulo', value),
  );
  const search = query.toString();
  return search ? `${pathname}?${search}` : pathname;
}

export function serializeCatalogoCarritoEntries(
  entries: CatalogoCarritoEntrada[],
) {
  return entries.map((entry) =>
    JSON.stringify([
      entry.id,
      Math.min(MAX_CART_QUANTITY, entry.cantidad),
      entry.observacion1,
      entry.observacion2,
      entry.observacion3,
    ]),
  );
}

function normalizeObservation(value: unknown) {
  return typeof value === 'string' ? value.slice(0, 50) : '';
}
