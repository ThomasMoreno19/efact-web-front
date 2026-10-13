"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { ClientPasswordDialog } from "@/features/cliente/components/client-password-dialog";
import { consultarSaldoCliente } from "@/features/cliente/services/consulta-saldo-cliente.service";
import type { ClienteSaldo } from "@/features/cliente/types/cliente";
import { CompanyLogo } from "@/features/empresa/components/company-logo";
import { CompanyPublicPageNavigation } from "@/features/empresa/components/company-public-page-navigation";
import type { EmpresaPublica } from "@/features/empresa/types/empresa";

interface ClientBalancePageProps {
  empresa: EmpresaPublica;
}

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function ClientBalancePage({ empresa }: ClientBalancePageProps) {
  const [identificacion, setIdentificacion] = useState("");
  const [cliente, setCliente] = useState<ClienteSaldo | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (identificacion.trim().length === 0 || isSearching) return;

    setPageError(null);
    setIsSearching(true);
    try {
      const result = await consultarSaldoCliente(empresa.id, identificacion);
      if (result.requiereContrasena) {
        setPasswordError(null);
        setPasswordModalOpen(true);
      } else {
        setCliente(result);
      }
    } catch (cause) {
      setPageError(
        cause instanceof Error
          ? cause.message
          : "No se pudo consultar el saldo. Intentá nuevamente.",
      );
    } finally {
      setIsSearching(false);
    }
  }

  async function handlePasswordSubmit(password: string) {
    if (isCheckingPassword) return;
    setPasswordError(null);
    setIsCheckingPassword(true);
    try {
      const result = await consultarSaldoCliente(
        empresa.id,
        identificacion,
        password,
      );
      if (result.requiereContrasena) {
        setPasswordError(
          "No se pudo validar la contraseña. Intentá nuevamente.",
        );
        return;
      }
      setCliente(result);
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

  function handleBackToLookup() {
    setCliente(null);
    setPageError(null);
    setPasswordError(null);
  }

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-5 py-4 sm:px-8">
          <CompanyPublicPageNavigation empresa={empresa} currentPage="saldo" />
          <div className="relative size-12 shrink-0 overflow-hidden rounded-card border border-border bg-surface">
            <CompanyLogo empresa={empresa} />
          </div>
          <p className="font-semibold">{empresa.nombre}</p>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5 py-12 sm:px-8 sm:py-16 md:-translate-y-[30px]">
        <section className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Consultá tu saldo
          </h1>
          <p className="text-base leading-7 text-muted">
            Ingresá tu DNI o CUIL para ver el saldo asociado a tu cuenta.
          </p>
        </section>

        <section className="mt-8 rounded-card border border-border bg-surface p-6 shadow-xl sm:p-8">
          {cliente ? (
            <BalanceResult cliente={cliente} onBack={handleBackToLookup} />
          ) : (
            <form onSubmit={handleLookup} className="grid gap-6">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Identificate</h2>
              </div>
              <Input
                id="identificacion-cliente"
                label="DNI o CUIL"
                placeholder="Ingresá tu DNI o CUIL"
                value={identificacion}
                onChange={(event) => setIdentificacion(event.target.value)}
                autoComplete="off"
                inputMode="numeric"
                maxLength={30}
                required
                aria-invalid={Boolean(pageError)}
                aria-describedby={
                  pageError ? "balance-search-error" : undefined
                }
              />
              {pageError ? (
                <p
                  id="balance-search-error"
                  role="alert"
                  className="rounded-input border border-danger/40 bg-danger/10 p-3 text-sm leading-5 text-danger"
                >
                  {pageError}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={isSearching || identificacion.trim().length === 0}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-button bg-brand px-5 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSearching ? <LoadingIcon /> : null}
                {isSearching ? "Buscando saldo…" : "Consultar saldo"}
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
        onClose={() => {
          setPasswordModalOpen(false);
          setPasswordError(null);
        }}
        onSubmit={(password) => void handlePasswordSubmit(password)}
      />
    </main>
  );
}

function BalanceResult({
  cliente,
  onBack,
}: {
  cliente: ClienteSaldo;
  onBack: () => void;
}) {
  return (
    <div className="space-y-7" role="status" aria-live="polite">
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
          {cliente.nombre || "Tu cuenta"}
        </h2>
      </div>
      <div className="rounded-card border border-border bg-surface-raised p-5 sm:p-6">
        <p className="text-sm font-medium text-muted">Saldo disponible</p>
        <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
          {cliente.saldo === null
            ? "No disponible"
            : currencyFormatter.format(cliente.saldo)}
        </p>
        {cliente.saldo === null ? (
          <p className="mt-2 text-sm text-muted">
            No hay un saldo registrado para esta cuenta.
          </p>
        ) : null}
      </div>
      <p className="text-sm leading-6 text-muted">
        {formatUpdatedAt(cliente.updatedAt)}
      </p>
    </div>
  );
}

function formatUpdatedAt(value: string | null) {
  if (!value) return "Fecha de actualización no disponible.";

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(isDateOnly ? `${value}T00:00:00.000Z` : value);
  if (Number.isNaN(date.getTime())) return "Fecha de actualización no disponible.";

  return `Última actualización: ${new Intl.DateTimeFormat("es-AR", {
    dateStyle: "long",
    timeZone: isDateOnly ? "UTC" : "America/Argentina/Buenos_Aires",
  }).format(date)}.`;
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
