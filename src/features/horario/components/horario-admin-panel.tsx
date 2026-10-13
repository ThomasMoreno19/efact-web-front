"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Clock } from "lucide-react";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { DialogShell } from "@/components/ui/dialog-shell";
import { Input } from "@/components/ui/input";
import { getHorarios, saveHorarios } from "@/features/horario/services/horario-client.service";
import type { Horario } from "@/features/horario/types/horario";

const MINUTES_PER_DAY = 24 * 60;
const MINUTES_PER_WEEK = 7 * MINUTES_PER_DAY;

const WEEK_DAYS = [
  { number: 1, name: "Lunes", shortName: "L" },
  { number: 2, name: "Martes", shortName: "M" },
  { number: 3, name: "Miércoles", shortName: "Mi" },
  { number: 4, name: "Jueves", shortName: "J" },
  { number: 5, name: "Viernes", shortName: "V" },
  { number: 6, name: "Sábado", shortName: "S" },
  { number: 0, name: "Domingo", shortName: "D" },
];

interface ScheduleOverlap {
  first: Horario;
  second: Horario;
}

interface ScheduleGroup {
  signature: string;
  days: number[];
  horarios: Horario[];
}

export function HorarioAdminPanel({ empresaId }: { empresaId: number }) {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [preview, setPreview] = useState<Horario[]>([]);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [horaApertura, setHoraApertura] = useState("");
  const [horaCierre, setHoraCierre] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loadVersion, setLoadVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    getHorarios(empresaId)
      .then((result) => {
        if (!cancelled) setHorarios(sortScheduleEntries(result));
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "No se pudo cargar el horario de la empresa.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [empresaId, loadVersion]);

  function openEditor() {
    setPreview(sortScheduleEntries(horarios));
    setSelectedDays([]);
    setHoraApertura("");
    setHoraCierre("");
    setFormError(null);
    setNotice(null);
    setIsEditing(true);
  }

  function closeEditor() {
    if (isSaving) return;
    setIsEditing(false);
    setFormError(null);
  }

  function toggleDay(day: number) {
    setSelectedDays((current) =>
      current.includes(day)
        ? current.filter((selectedDay) => selectedDay !== day)
        : sortDays([...current, day]),
    );
    setFormError(null);
  }

  function registerSchedule() {
    setFormError(null);
    if (selectedDays.length === 0) {
      setFormError("Seleccioná al menos un día para registrar el horario.");
      return;
    }
    if (!horaApertura || !horaCierre) {
      setFormError("Ingresá la hora de apertura y la hora de cierre.");
      return;
    }

    const apertura = timeToMinutes(horaApertura);
    const cierre = timeToMinutes(horaCierre);
    if (apertura === cierre) {
      setFormError("La hora de apertura y la de cierre no pueden ser iguales.");
      return;
    }

    const nuevosHorarios = selectedDays.map((diaSemana) => ({
      diaSemana,
      horaApertura,
      horaCierre,
    }));
    const combined = [...preview, ...nuevosHorarios];
    const overlap = findScheduleOverlap(combined);
    if (overlap) {
      setFormError(formatOverlapError(overlap));
      return;
    }

    setPreview(sortScheduleEntries(combined));
    setHoraApertura("");
    setHoraCierre("");
  }

  function removePreviewSchedule(index: number) {
    setPreview((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setFormError(null);
  }

  async function submitSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const overlap = findScheduleOverlap(preview);
    if (overlap) {
      setFormError(formatOverlapError(overlap));
      return;
    }

    setIsSaving(true);
    setFormError(null);
    setNotice(null);
    try {
      const updated = await saveHorarios(
        empresaId,
        sortScheduleEntries(preview),
      );
      setHorarios(sortScheduleEntries(updated));
      setIsEditing(false);
      setNotice("El horario de la empresa se guardó correctamente.");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el horario. Intentá nuevamente.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const scheduleGroups = groupSchedulesByHours(horarios);

  return (
    <CollapsibleSection
      title="Horarios de atención"
      icon={
        <Clock
          aria-hidden="true"
          className="size-6 text-muted"
          strokeWidth={1.7}
        />
      }
    >
      <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
        <p className="max-w-2xl text-sm leading-6 text-muted">
          Consultá los días y horarios en que está abierta la empresa.
        </p>
        <button
          type="button"
          onClick={openEditor}
          disabled={isLoading || Boolean(loadError)}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-button bg-brand px-5 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
        >
          Modificar horario
        </button>
      </div>

      {isLoading ? (
        <p role="status" className="mt-6 text-sm text-muted">
          Cargando horario…
        </p>
      ) : loadError ? (
        <div role="alert" className="mt-6 flex flex-wrap items-center gap-4">
          <p className="text-sm text-danger">{loadError}</p>
          <button
            type="button"
            onClick={() => setLoadVersion((version) => version + 1)}
            className="rounded-button border border-border px-4 py-2 text-sm font-medium transition hover:bg-surface-raised"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <>
          {scheduleGroups.length === 0 ? (
            <p className="mt-6 rounded-button border border-border bg-field p-4 text-sm text-muted">
              Todavía no hay horarios configurados.
            </p>
          ) : null}
          {scheduleGroups.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {scheduleGroups.map((group) => (
                <article
                  key={group.signature}
                  className="rounded-card border border-border bg-surface-raised p-5"
                >
                  <h3 className="font-semibold">
                    {formatScheduleDays(group.days)}
                  </h3>
                  <ul className="mt-4 space-y-2">
                    {group.horarios.map((schedule, index) => (
                      <li
                        key={`${schedule.horaApertura}-${schedule.horaCierre}-${index}`}
                        className="rounded-button bg-field px-3 py-2 text-sm"
                      >
                        {formatScheduleRange(schedule)}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          ) : null}
        </>
      )}

      {notice ? (
        <p
          role="status"
          className="mt-5 rounded-button border border-brand/30 bg-brand/10 p-3 text-sm"
        >
          {notice}
        </p>
      ) : null}

      {isEditing ? (
        <DialogShell onClose={closeEditor} title="Modificar horario">
          <form onSubmit={submitSchedule}>
            <div className="max-h-[65vh] space-y-6 overflow-y-auto pr-1">
              <section>
                <h3 className="text-sm font-semibold">Seleccionar los días</h3>
                <p className="mt-1 text-xs text-muted">
                  Podés seleccionar varios días para registrarles el mismo horario.
                </p>
                <div className="mt-4 grid grid-cols-4 justify-items-center gap-3 sm:grid-cols-7">
                  {WEEK_DAYS.map((day) => {
                    const selected = selectedDays.includes(day.number);
                    return (
                      <button
                        key={day.number}
                        type="button"
                        aria-label={day.name}
                        aria-pressed={selected}
                        title={day.name}
                        onClick={() => toggleDay(day.number)}
                        className={`flex size-12 items-center justify-center rounded-full border text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                          selected
                            ? "border-brand bg-brand text-brand-foreground"
                            : "border-border bg-field text-foreground hover:bg-surface-raised"
                        }`}
                      >
                        {day.shortName}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="border-t border-border pt-5">
                <h3 className="text-sm font-semibold">Ingresar las horas</h3>
                <p className="mt-1 text-xs text-muted">
                  Si el cierre es anterior a la apertura, se toma como cierre al
                  día siguiente.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Input
                    id="horario-apertura"
                    label="Apertura"
                    type="time"
                    value={horaApertura}
                    onChange={(event) => {
                      setHoraApertura(event.target.value);
                      setFormError(null);
                    }}
                  />
                  <Input
                    id="horario-cierre"
                    label="Cierre"
                    type="time"
                    value={horaCierre}
                    onChange={(event) => {
                      setHoraCierre(event.target.value);
                      setFormError(null);
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={registerSchedule}
                  className="mt-4 h-11 w-full rounded-button border border-border px-5 text-sm font-semibold transition hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  Registrar
                </button>
              </section>

              <section className="border-t border-border pt-5">
                <h3 className="text-sm font-semibold">Vista previa</h3>
                {preview.length === 0 ? (
                  <p className="mt-3 rounded-button border border-border bg-field p-4 text-sm text-muted">
                    Todavía no hay horarios en la vista previa.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {WEEK_DAYS.map((day) => {
                      const daySchedules = preview
                        .map((schedule, index) => ({ schedule, index }))
                        .filter(({ schedule }) => schedule.diaSemana === day.number);
                      if (daySchedules.length === 0) return null;

                      return (
                        <li
                          key={day.number}
                          className="overflow-hidden rounded-button border border-border"
                        >
                          <h4 className="bg-field px-4 py-3 text-sm font-semibold">
                            {day.name}
                          </h4>
                          <ul className="divide-y divide-border">
                            {daySchedules.map(({ schedule, index }) => (
                              <li
                                key={`${schedule.horaApertura}-${schedule.horaCierre}-${index}`}
                                className="flex items-center justify-between gap-3 px-4 py-2"
                              >
                                <span className="text-sm text-muted">
                                  {formatScheduleRange(schedule, false)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removePreviewSchedule(index)}
                                  aria-label={`Quitar horario ${schedule.horaApertura} a ${schedule.horaCierre} del ${day.name}`}
                                  className="shrink-0 rounded-button px-3 py-2 text-sm text-muted transition hover:bg-surface-raised hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                                >
                                  Quitar
                                </button>
                              </li>
                            ))}
                          </ul>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </div>

            {formError ? (
              <p
                role="alert"
                className="mt-4 rounded-button border border-danger/40 bg-danger/10 p-3 text-sm"
              >
                {formError}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
              <button
                type="button"
                onClick={closeEditor}
                disabled={isSaving}
                className="h-11 rounded-button border border-border px-5 text-sm font-semibold transition hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="h-11 rounded-button bg-brand px-5 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Guardando…" : "Guardar horario"}
              </button>
            </div>
          </form>
        </DialogShell>
      ) : null}
    </CollapsibleSection>
  );
}

function findScheduleOverlap(
  horarios: Horario[],
): ScheduleOverlap | null {
  const intervals = horarios.map((horario) => ({
    horario,
    ...getWeeklyInterval(horario),
  }));

  for (let firstIndex = 0; firstIndex < intervals.length; firstIndex += 1) {
    const first = intervals[firstIndex];
    if (!first) continue;

    for (
      let secondIndex = firstIndex + 1;
      secondIndex < intervals.length;
      secondIndex += 1
    ) {
      const second = intervals[secondIndex];
      if (!second) continue;
      if (weeklyIntervalsOverlap(first, second)) {
        return { first: first.horario, second: second.horario };
      }
    }
  }

  return null;
}

function groupSchedulesByHours(horarios: Horario[]): ScheduleGroup[] {
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

function formatScheduleDays(days: number[]): string {
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

  if (labels.length < 2) return labels[0] ?? "";
  return `${labels.slice(0, -1).join(", ")} y ${labels[labels.length - 1]}`;
}

function getWeeklyInterval(horario: Horario) {
  const apertura = timeToMinutes(horario.horaApertura);
  const cierre = timeToMinutes(horario.horaCierre);
  const duration =
    cierre < apertura
      ? cierre + MINUTES_PER_DAY - apertura
      : cierre - apertura;
  const start = horario.diaSemana * MINUTES_PER_DAY + apertura;
  return { start, end: start + duration };
}

function weeklyIntervalsOverlap(
  first: { start: number; end: number },
  second: { start: number; end: number },
): boolean {
  for (const weekOffset of [-MINUTES_PER_WEEK, 0, MINUTES_PER_WEEK]) {
    const shiftedStart = second.start + weekOffset;
    const shiftedEnd = second.end + weekOffset;
    if (first.start < shiftedEnd && shiftedStart < first.end) return true;
  }
  return false;
}

function formatOverlapError(overlap: ScheduleOverlap): string {
  return `El horario del ${getDayName(overlap.first.diaSemana)} (${formatScheduleRange(overlap.first)}) se superpone con el del ${getDayName(overlap.second.diaSemana)} (${formatScheduleRange(overlap.second)}).`;
}

function sortScheduleEntries(
  horarios: Horario[],
): Horario[] {
  return [...horarios].sort(
    (a, b) =>
      WEEK_DAYS.findIndex((day) => day.number === a.diaSemana) -
        WEEK_DAYS.findIndex((day) => day.number === b.diaSemana) ||
      a.horaApertura.localeCompare(b.horaApertura),
  );
}

function sortDays(days: number[]): number[] {
  return [...days].sort(
    (a, b) =>
      WEEK_DAYS.findIndex((day) => day.number === a) -
      WEEK_DAYS.findIndex((day) => day.number === b),
  );
}

function formatScheduleRange(
  horario: Horario,
  includeNextDay = true,
): string {
  const overnight =
    timeToMinutes(horario.horaCierre) < timeToMinutes(horario.horaApertura);
  return `${horario.horaApertura}–${horario.horaCierre}${overnight && includeNextDay ? " (día siguiente)" : ""}`;
}

function getDayName(day: number): string {
  return WEEK_DAYS.find((item) => item.number === day)?.name ?? "Día";
}

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}
