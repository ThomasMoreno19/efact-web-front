export type ArticuloStockStatus = 'red' | 'yellow' | 'green';

export function getArticuloStockStatus(
  existence: number | null | undefined,
  minimum: number | null | undefined,
  maximum: number | null | undefined,
): ArticuloStockStatus | null {
  if (typeof existence !== 'number' || !Number.isFinite(existence)) {
    return null;
  }

  const configuredMinimum =
    typeof minimum === 'number' && Number.isFinite(minimum) ? minimum : null;
  const configuredMaximum =
    typeof maximum === 'number' && Number.isFinite(maximum) ? maximum : null;

  if (
    configuredMinimum !== null &&
    configuredMaximum !== null &&
    configuredMinimum === configuredMaximum &&
    existence === configuredMinimum
  ) {
    return 'green';
  }

  if (existence <= 0) return 'red';
  if (configuredMinimum === null) return null;
  if (existence <= configuredMinimum) return 'yellow';
  return 'green';
}
