import type { Horario } from '@/features/horario/types/horario';

export async function getHorariosPublicos(empresaId: number): Promise<Horario[]> {
  const response = await fetch(`/api/empresas/${empresaId}/horarios`, {
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(getApiError(payload));
  if (!Array.isArray(payload) || !payload.every(isHorario)) {
    throw new Error('El servidor devolvió un horario inválido.');
  }
  return payload;
}

function isHorario(value: unknown): value is Horario {
  if (typeof value !== 'object' || value === null) return false;
  const horario = value as Partial<Horario>;
  return (
    Number.isInteger(horario.diaSemana) &&
    Number(horario.diaSemana) >= 0 &&
    Number(horario.diaSemana) <= 6 &&
    typeof horario.horaApertura === 'string' &&
    /^\d{2}:\d{2}$/.test(horario.horaApertura) &&
    typeof horario.horaCierre === 'string' &&
    /^\d{2}:\d{2}$/.test(horario.horaCierre)
  );
}

function getApiError(payload: unknown) {
  if (typeof payload !== 'object' || payload === null || !('message' in payload)) {
    return 'No se pudo consultar el horario de la empresa.';
  }
  const message = (payload as { message?: string | string[] }).message;
  return Array.isArray(message)
    ? message.join(' ')
    : message ?? 'No se pudo consultar el horario de la empresa.';
}
