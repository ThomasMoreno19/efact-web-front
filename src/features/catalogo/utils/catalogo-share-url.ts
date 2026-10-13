export function buildCatalogoArticuloUrl(
  pathname: string,
  codigoInterno: string | number,
  openDetails = false,
) {
  const query = new URLSearchParams({ producto: String(codigoInterno) });
  if (openDetails) query.set('detalle', '1');
  return `${pathname}?${query.toString()}`;
}

export function parseCatalogoCodigoInterno(
  value: string | string[] | undefined,
) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (!rawValue || !/^\d+$/.test(rawValue)) return null;
  const codigoInterno = Number(rawValue);
  return Number.isSafeInteger(codigoInterno) && codigoInterno <= 2_147_483_647
    ? String(codigoInterno)
    : null;
}
