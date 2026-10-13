"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { ClientPasswordDialog } from "@/features/cliente/components/client-password-dialog";
import {
  consultarReparaciones,
} from "@/features/reparacion/services/consulta-reparaciones.service";
import type {
  ConsultaReparacionesResult,
  MovimientoReparacionPublico,
  TipoBusquedaReparacion,
} from "@/features/reparacion/types/reparacion";
import { CompanyLogo } from "@/features/empresa/components/company-logo";
import { CompanyPublicPageNavigation } from "@/features/empresa/components/company-public-page-navigation";
import type { EmpresaPublica } from "@/features/empresa/types/empresa";

interface ReparacionConsultaPageProps {
  empresa: EmpresaPublica;
}

export function ReparacionConsultaPage({
  empresa,
}: ReparacionConsultaPageProps) {
  const [tipoBusqueda, setTipoBusqueda] = useState<TipoBusquedaReparacion>(
    "cuil",
  );
  const [valor, setValor] = useState("");
  const [resultado, setResultado] =
    useState<ConsultaReparacionesResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (valor.trim().length === 0 || isSearching) return;

    setError(null);
    setIsSearching(true);
    try {
      const response = await consultarReparaciones(
        empresa.id,
        tipoBusqueda,
        valor.trim(),
      );
      if (response.requiereContrasena) {
        setPasswordError(null);
        setPasswordModalOpen(true);
      } else {
        setResultado(response);
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo consultar la reparación. Intentá nuevamente.",
      );
    } finally {
      setIsSearching(false);
    }
  }

  async function handlePasswordSubmit(contrasena: string) {
    if (isCheckingPassword) return;
    setPasswordError(null);
    setIsCheckingPassword(true);
    try {
      const response = await consultarReparaciones(
        empresa.id,
        tipoBusqueda,
        valor.trim(),
        contrasena,
      );
      if (response.requiereContrasena) {
        setPasswordError(
          "No se pudo validar la contraseña. Intentá nuevamente.",
        );
        return;
      }
      setResultado(response);
      setPasswordModalOpen(false);
    } catch (cause) {
      setPasswordError(
        cause instanceof Error
          ? cause.message
          : "No se pudo validar la contraseña. Intentá nuevamente.",
      );
    } finally {
      setIsCheckingPassword(false);
    }
  }

  function handleBack() {
    setResultado(null);
    setError(null);
    setPasswordModalOpen(false);
    setPasswordError(null);
  }

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-5 py-4 sm:px-8">
          <CompanyPublicPageNavigation
            empresa={empresa}
            currentPage="reparacion"
          />
          <div className="relative size-12 shrink-0 overflow-hidden rounded-card border border-border bg-surface">
            <CompanyLogo empresa={empresa} />
          </div>
          <p className="font-semibold">{empresa.nombre}</p>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5 py-12 sm:px-8 sm:py-16 md:-translate-y-[30px]">
        <section className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Consultá tu reparación
          </h1>
          <p className="text-base leading-7 text-muted">
            Buscá por DNI o CUIL para ver los movimientos actuales de tus
            equipos, o ingresá el número de serie de uno.
          </p>
        </section>

        <section className="mt-8 rounded-card border border-border bg-surface p-6 shadow-xl sm:p-8">
          {resultado ? (
            <RepairResult resultado={resultado} onBack={handleBack} />
          ) : (
            <form onSubmit={handleLookup} className="grid gap-6">
              <fieldset className="grid gap-2">
                <legend className="text-sm font-medium text-foreground">
                  Buscar por
                </legend>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-input border px-3 text-sm font-medium transition ${
                      tipoBusqueda === "cuil"
                        ? "border-brand bg-brand/10 text-foreground"
                        : "border-border text-muted hover:bg-surface-raised"
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipo-busqueda-reparacion"
                      value="cuil"
                      checked={tipoBusqueda === "cuil"}
                      onChange={() => setTipoBusqueda("cuil")}
                      className="size-4 accent-brand"
                    />
                    DNI o CUIL
                  </label>
                  <label
                    className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-input border px-3 text-sm font-medium transition ${
                      tipoBusqueda === "serie"
                        ? "border-brand bg-brand/10 text-foreground"
                        : "border-border text-muted hover:bg-surface-raised"
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipo-busqueda-reparacion"
                      value="serie"
                      checked={tipoBusqueda === "serie"}
                      onChange={() => setTipoBusqueda("serie")}
                      className="size-4 accent-brand"
                    />
                    Número de serie
                  </label>
                </div>
              </fieldset>

              <Input
                id="busqueda-reparacion"
                label={
                  tipoBusqueda === "cuil" ? "DNI o CUIL" : "Número de serie"
                }
                placeholder={
                  tipoBusqueda === "cuil"
                    ? "Ingresá tu DNI o CUIL"
                    : "Ingresá el número de serie"
                }
                value={valor}
                onChange={(event) => setValor(event.currentTarget.value)}
                autoComplete="off"
                inputMode={tipoBusqueda === "cuil" ? "numeric" : "text"}
                maxLength={tipoBusqueda === "cuil" ? 30 : 100}
                required
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "repair-search-error" : undefined}
              />

              {error ? (
                <p
                  id="repair-search-error"
                  role="alert"
                  className="rounded-input border border-danger/40 bg-danger/10 p-3 text-sm leading-5 text-danger"
                >
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSearching || valor.trim().length === 0}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-button bg-brand px-5 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSearching ? <LoadingIcon /> : null}
                {isSearching ? "Buscando reparación…" : "Consultar reparación"}
                {!isSearching ? <ArrowRightIcon /> : null}
              </button>
            </form>
          )}
        </section>
      </div>
      <ClientPasswordDialog
        open={passwordModalOpen}
        isLoading={isCheckingPassword}
        error={passwordError}
        description={null}
        submitLabel="Ver reparación"
        onClose={() => {
          setPasswordModalOpen(false);
          setPasswordError(null);
        }}
        onSubmit={(password) => void handlePasswordSubmit(password)}
      />
    </main>
  );
}

function RepairResult({
  resultado,
  onBack,
}: {
  resultado: ConsultaReparacionesResult;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <div className="relative flex min-h-10 items-center justify-center">
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver atrás"
          className="absolute left-0 top-0 flex size-10 items-center justify-center rounded-button border border-border text-foreground transition hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <ArrowLeftIcon />
        </button>
        <h2 className="w-full px-12 text-center text-2xl font-semibold tracking-tight">
          {resultado.nombreCliente || "Estado de reparación"}
        </h2>
      </div>
      {resultado.movimientos.length > 1 ? (
        <p className="text-center text-sm text-muted">
          Movimientos actuales de {resultado.movimientos.length} equipos
        </p>
      ) : null}
      <div className="space-y-4">
        {resultado.movimientos.map((movimiento, index) => (
          <RepairMovementCard
            key={`${movimiento.equipo.numeroSerie ?? "equipo"}-${index}`}
            movimiento={movimiento}
          />
        ))}
      </div>
    </div>
  );
}

function RepairMovementCard({
  movimiento,
}: {
  movimiento: MovimientoReparacionPublico;
}) {
  const equipo = movimiento.equipo;
  const equipoTitulo =
    equipo.nombreEquipo ||
    [equipo.marca, equipo.modelo].filter(Boolean).join(" ") ||
    "Equipo";
  const equipoDetalle = equipo.nombreEquipo
    ? [equipo.marca, equipo.modelo].filter(Boolean).join(" · ")
    : "";

  return (
    <article className="rounded-card border border-border bg-surface-raised p-5 sm:p-6">
      <h3 className="text-lg font-semibold">{equipoTitulo}</h3>
      {equipoDetalle ? (
        <p className="mt-1 text-sm text-muted">{equipoDetalle}</p>
      ) : null}
      {equipo.numeroSerie ? (
        <p className="mt-1 text-sm text-muted">
          Número de serie: {equipo.numeroSerie}
        </p>
      ) : null}

      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-medium text-muted">Estado actual</dt>
          <dd className="mt-1 text-base font-semibold text-brand">
            {movimiento.estado || "No informado"}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-muted">Fecha</dt>
          <dd className="mt-1 text-base">
            {formatMovementDate(movimiento.fecha)}
          </dd>
        </div>
      </dl>
      {movimiento.observacion ? (
        <div className="mt-4 border-t border-border pt-4">
          <h4 className="text-sm font-medium text-muted">Observaciones</h4>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
            {movimiento.observacion}
          </p>
        </div>
      ) : null}
    </article>
  );
}

function formatMovementDate(value: string | null) {
  if (!value) return "No informada";
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return "No informada";
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(date);
}

function ArrowRightIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-4"
    >
      <path d="M4 12h15m-6-6 6 6-6 6" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-5"
    >
      <path d="M20 12H5m6 6-6-6 6-6" />
    </svg>
  );
}

function LoadingIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="size-4 animate-spin"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity=".25"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
