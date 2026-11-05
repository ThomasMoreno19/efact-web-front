'use client';

import { DialogShell } from '@/components/ui/dialog-shell';
import type { Horario } from '@/features/horario/types/horario';
import {
  formatScheduleDays,
  formatScheduleRange,
  groupSchedulesByHours,
} from '@/features/horario/utils/horario-presentacion';

export function HorarioPublicoDialog({
  horarios,
  onClose,
}: {
  horarios: Horario[];
  onClose: () => void;
}) {
  const scheduleGroups = groupSchedulesByHours(horarios);

  return (
    <DialogShell title="Horarios de atención" onClose={onClose}>
      {horarios.length === 0 ? (
        <p className="text-sm text-muted">No hay horarios configurados.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {scheduleGroups.map((group) => (
            <article
              key={group.signature}
              className="rounded-card border border-border bg-surface-raised p-5"
            >
              <h3 className="font-semibold">
                {formatScheduleDays(group.days)}
              </h3>
              <ul className="mt-4 space-y-2">
                {group.horarios.map((horario, index) => (
                  <li
                    key={`${horario.horaApertura}-${horario.horaCierre}-${index}`}
                    className="rounded-button bg-surface px-3 py-2 text-sm"
                  >
                    {formatScheduleRange(horario)}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </DialogShell>
  );
}
