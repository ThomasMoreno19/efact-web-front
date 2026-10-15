'use client';

import { DialogShell } from '@/components/ui/dialog-shell';
import type { Horario } from '@/features/horario/types/horario';

const WEEK_DAYS = [
  { number: 1, name: 'Lunes' },
  { number: 2, name: 'Martes' },
  { number: 3, name: 'Miércoles' },
  { number: 4, name: 'Jueves' },
  { number: 5, name: 'Viernes' },
  { number: 6, name: 'Sábado' },
  { number: 0, name: 'Domingo' },
];

export function HorarioPublicoDialog({
  horarios,
  onClose,
}: {
  horarios: Horario[];
  onClose: () => void;
}) {
  return (
    <DialogShell title="Horarios de atención" onClose={onClose}>
      {horarios.length === 0 ? (
        <p className="text-sm text-muted">No hay horarios configurados.</p>
      ) : (
        <ul className="space-y-3">
          {WEEK_DAYS.map((dia) => {
            const horariosDelDia = horarios
              .filter((horario) => horario.diaSemana === dia.number)
              .sort((a, b) => a.horaApertura.localeCompare(b.horaApertura));
            if (horariosDelDia.length === 0) return null;

            return (
              <li
                key={dia.number}
                className="rounded-button border border-border bg-surface-raised p-4"
              >
                <h3 className="font-semibold">{dia.name}</h3>
                <ul className="mt-2 space-y-1 text-sm text-muted">
                  {horariosDelDia.map((horario, index) => (
                    <li key={`${horario.horaApertura}-${horario.horaCierre}-${index}`}>
                      {horario.horaApertura}–{horario.horaCierre}
                      {isOvernight(horario) ? ' (día siguiente)' : ''}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="h-11 rounded-button border border-border px-5 text-sm font-semibold transition hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Cerrar
        </button>
      </div>
    </DialogShell>
  );
}

function isOvernight(horario: Horario) {
  return horario.horaApertura > horario.horaCierre;
}
