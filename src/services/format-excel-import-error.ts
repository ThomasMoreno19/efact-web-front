export interface ExcelImportIssue {
  sheet?: string;
  row?: number;
  column?: string;
  message?: string;
}

export interface ExcelImportApiError {
  message?: string | string[];
  errors?: ExcelImportIssue[];
  omittedErrors?: number;
}

interface IssueGroup {
  sheet: string;
  column: string;
  message: string;
  rows: Set<number>;
  missingColumn: boolean;
}

export function formatExcelImportApiError(
  payload: ExcelImportApiError | null,
  fallback: string,
) {
  if (!payload?.errors?.length) {
    if (Array.isArray(payload?.message)) return payload.message.join("\n");
    return payload?.message ?? fallback;
  }

  const groups = new Map<string, IssueGroup>();
  const missingColumns = new Set<string>();

  for (const issue of payload.errors) {
    if (!/falta la columna requerida/i.test(issue.message ?? "")) continue;
    missingColumns.add(
      `${issue.sheet?.trim() || "Excel"}\u0000${issue.column?.trim() || ""}`,
    );
  }

  for (const issue of payload.errors) {
    const sheet = issue.sheet?.trim() || "Excel";
    const column = issue.column?.trim() || "";
    const message = issue.message?.trim() || "Dato inválido.";
    const fieldKey = `${sheet}\u0000${column}`;
    const missingColumn = missingColumns.has(fieldKey);
    const key = missingColumn
      ? `missing\u0000${fieldKey}`
      : `issue\u0000${fieldKey}\u0000${message}`;
    const group = groups.get(key) ?? {
      sheet,
      column,
      message: missingColumn ? "Falta la columna requerida." : message,
      rows: new Set<number>(),
      missingColumn,
    };
    if (Number.isInteger(issue.row)) group.rows.add(issue.row as number);
    groups.set(key, group);
  }

  const formattedGroups = [...groups.values()]
    .filter(
      (group) =>
        group.missingColumn ||
        !missingColumns.has(`${group.sheet}\u0000${group.column}`),
    )
    .map(formatIssueGroup);
  const summary =
    typeof payload.message === "string"
      ? payload.message
      : "El servidor devolvió detalles sobre el error.";
  if (payload.omittedErrors && payload.omittedErrors > 0) {
    formattedGroups.push(
      `Y ${payload.omittedErrors} errores adicionales no incluidos.`,
    );
  }

  return [summary, ...formattedGroups].join("\n");
}

function formatIssueGroup(group: IssueGroup) {
  const sheet = group.sheet === "Ubicacion" ? "Ubicación" : group.sheet;
  const column = group.column ? ` «${group.column}»` : "";
  const description = group.missingColumn
    ? `${sheet}: falta la columna${column}.`
    : `${sheet}${column ? ` · columna${column}` : ""}: ${group.message}`;
  const rows = formatRows([...group.rows]);
  return rows ? `${description} Filas afectadas: ${rows}.` : description;
}

function formatRows(rows: number[]) {
  const sortedRows = [...new Set(rows)].sort((first, second) => first - second);
  if (sortedRows.length === 0) return "";

  const ranges: string[] = [];
  let rangeStart = sortedRows[0] as number;
  let rangeEnd = rangeStart;

  for (const row of sortedRows.slice(1)) {
    if (row === rangeEnd + 1) {
      rangeEnd = row;
      continue;
    }
    ranges.push(formatRange(rangeStart, rangeEnd));
    rangeStart = row;
    rangeEnd = row;
  }

  ranges.push(formatRange(rangeStart, rangeEnd));
  return ranges.join(", ");
}

function formatRange(start: number, end: number) {
  return start === end ? String(start) : `${start}–${end}`;
}
