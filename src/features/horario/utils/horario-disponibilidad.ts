import type { Horario } from '@/features/horario/types/horario';

const WEEKDAY_NUMBERS: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function estaDentroDeHorario(horarios: Horario[], fecha: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(fecha);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const dia = WEEKDAY_NUMBERS[values.weekday ?? ''];
  if (dia === undefined) return false;

  const minutos = Number(values.hour) * 60 + Number(values.minute);
  const diaAnterior = (dia + 6) % 7;

  return horarios.some((horario) => {
    const apertura = timeToMinutes(horario.horaApertura);
    const cierre = timeToMinutes(horario.horaCierre);
    if (apertura === cierre) return false;

    if (cierre > apertura) {
      return (
        horario.diaSemana === dia &&
        minutos >= apertura &&
        minutos < cierre
      );
    }

    return (
      (horario.diaSemana === dia && minutos >= apertura) ||
      (horario.diaSemana === diaAnterior && minutos < cierre)
    );
  });
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}
