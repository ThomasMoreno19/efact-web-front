const argentinaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Argentina/Buenos_Aires",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const relativeDateFormatter = new Intl.RelativeTimeFormat("es-AR", {
  numeric: "always",
});

export function formatRelativeDate(value: string | null, emptyLabel: string) {
  if (!value) return emptyLabel;

  const date = parseDate(value);
  if (!date) return emptyLabel;

  const today = argentinaCalendarDate(new Date());
  const daysAgo = Math.round(
    (today.getTime() - date.getTime()) / 86_400_000,
  );

  if (daysAgo > 30) {
    return relativeDateFormatter.format(-Math.floor(daysAgo / 30), "month");
  }

  return relativeDateFormatter.format(-daysAgo, "day");
}

function parseDate(value: string): Date | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10) === value ? date : null;
  }

  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) return null;
  return argentinaCalendarDate(instant);
}

function argentinaCalendarDate(date: Date): Date {
  const parts = argentinaDateFormatter.formatToParts(date);
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return new Date(
    `${part("year")}-${part("month")}-${part("day")}T00:00:00.000Z`,
  );
}
