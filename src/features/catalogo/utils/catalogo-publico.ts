const priceFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

export interface CatalogoUpdateDateStatus {
  label: string | null;
  isBeyondMinimum: boolean;
  isBeyondMaximum: boolean;
}

export function formatCurrency(value: number) {
  return priceFormatter.format(value);
}

export function getUpdateDateStatus(
  value: string | null | undefined,
  toleranciaMinDias: number | null,
  toleranciaMaxDias: number | null,
): CatalogoUpdateDateStatus {
  const date = value ? parseDateParts(value) : null;
  if (!date) {
    return {
      label: null,
      isBeyondMinimum: false,
      isBeyondMaximum: false,
    };
  }

  const today = new Date();
  const todayOrdinal =
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86_400_000;
  const daysSinceUpdate = todayOrdinal - date.ordinal;

  return {
    label: `${String(date.day).padStart(2, '0')}/${String(date.month).padStart(2, '0')}/${date.year}`,
    isBeyondMinimum:
      toleranciaMinDias !== null && daysSinceUpdate >= toleranciaMinDias,
    isBeyondMaximum:
      toleranciaMaxDias !== null && daysSinceUpdate >= toleranciaMaxDias,
  };
}

export function formatArticleName(value: string) {
  let parenthesesDepth = 0;
  let visibleName = '';

  for (const character of value) {
    if (character === '(') {
      parenthesesDepth += 1;
      continue;
    }
    if (character === ')') {
      if (parenthesesDepth > 0) parenthesesDepth -= 1;
      else visibleName += character;
      continue;
    }
    if (parenthesesDepth === 0 && character !== '<' && character !== '>') {
      visibleName += character;
    }
  }

  return visibleName.trim().replace(/\s+/g, ' ');
}

function parseDateParts(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return {
    year,
    month,
    day,
    ordinal: Date.UTC(year, month - 1, day) / 86_400_000,
  };
}
