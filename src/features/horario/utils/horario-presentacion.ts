import type { Horario } from '@/features/horario/types/horario';

export const WEEK_DAYS = [
  { number: 1, name: 'Lunes', shortName: 'L' },
  { number: 2, name: 'Martes', shortName: 'M' },
  { number: 3, name: 'Miércoles', shortName: 'Mi' },
  { number: 4, name: 'Jueves', shortName: 'J' },
  { number: 5, name: 'Viernes', shortName: 'V' },
  { number: 6, name: 'Sábado', shortName: 'S' },
  { number: 0, name: 'Domingo', shortName: 'D' },
];

export interface ScheduleGroup {
  signature: string;
  days: number[];
  horarios: Horario[];
}

export function groupSchedulesByHours(horarios: Horario[]): ScheduleGroup[] {
  const groups = new Map<string, ScheduleGroup>();

  for (const day of WEEK_DAYS) {
    const daySchedules = horarios
      .filter((horario) => horario.diaSemana === day.number)
      .sort(
        (a, b) =>
          a.horaApertura.localeCompare(b.horaApertura) ||
          a.horaCierre.localeCompare(b.horaCierre),
      );
    if (daySchedules.length === 0) continue;

    const signature = JSON.stringify(
      daySchedules.map(({ horaApertura, horaCierre }) => [
        horaApertura,
        horaCierre,
      ]),
    );
    const group = groups.get(signature);
    if (group) {
      group.days.push(day.number);
    } else {
      groups.set(signature, {
        signature,
        days: [day.number],
        horarios: daySchedules,
      });
    }
  }

  return [...groups.values()].sort(
    (a, b) =>
      WEEK_DAYS.findIndex((day) => day.number === a.days[0]) -
      WEEK_DAYS.findIndex((day) => day.number === b.days[0]),
  );
}

export function formatScheduleDays(days: number[]): string {
  const runs: number[][] = [];

  for (const day of sortDays(days)) {
    const currentRun = runs[runs.length - 1];
    const previousDay = currentRun?.[currentRun.length - 1];
    const currentIndex = WEEK_DAYS.findIndex((item) => item.number === day);
    const previousIndex = WEEK_DAYS.findIndex(
      (item) => item.number === previousDay,
    );

    if (currentRun && currentIndex === previousIndex + 1) {
      currentRun.push(day);
    } else {
      runs.push([day]);
    }
  }

  const labels = runs.flatMap((run) => {
    if (run.length < 3) return run.map(getDayName);

    const firstDay = run[0];
    const lastDay = run[run.length - 1];
    if (firstDay === undefined || lastDay === undefined) return [];
    return [`De ${getDayName(firstDay)} a ${getDayName(lastDay)}`];
  });

  if (labels.length < 2) return labels[0] ?? '';
  return `${labels.slice(0, -1).join(', ')} y ${labels[labels.length - 1]}`;
}

export function formatScheduleRange(
  horario: Horario,
  includeNextDay = true,
): string {
  const overnight =
    timeToMinutes(horario.horaCierre) < timeToMinutes(horario.horaApertura);
  return `${horario.horaApertura} a ${horario.horaCierre}${overnight && includeNextDay ? ' (día siguiente)' : ''}`;
}

export function getDayName(day: number): string {
  return WEEK_DAYS.find((item) => item.number === day)?.name ?? 'Día';
}

export function sortDays(days: number[]): number[] {
  return [...days].sort(
    (a, b) =>
      WEEK_DAYS.findIndex((day) => day.number === a) -
      WEEK_DAYS.findIndex((day) => day.number === b),
  );
}

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}
