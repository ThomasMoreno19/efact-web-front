"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { CompanyLogo } from "@/features/empresa/components/company-logo";
import { InternalCatalogList } from "@/features/interno/components/internal-catalog-list";
import { InternalBalancesList } from "@/features/interno/components/internal-balances-list";
import {
  getInternalSession,
  InternalRequestError,
  loginInterno,
  logoutInterno,
} from "@/features/interno/services/interno-client.service";
import type { EmpresaPublica } from "@/features/empresa/types/empresa";
import type { InternalSession } from "@/features/interno/types/interno";

export type InternalModule = "catalogo" | "saldo";

export function InternalModulePage({
  empresa,
  modulo,
}: {
  empresa: EmpresaPublica;
  modulo: InternalModule;
}) {
  const [session, setSession] = useState<InternalSession | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [nombre, setNombre] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    getInternalSession(empresa.id)
      .then(setSession)
      .catch((cause: unknown) => {
        if (cause instanceof InternalRequestError && cause.status <= 403) return;
        setPageError(
          cause instanceof Error
            ? cause.message
            : "No se pudo verificar la sesión interna.",
        );
      })
      .finally(() => setIsCheckingSession(false));
  }, [empresa.id]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoggingIn) return;
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      await loginInterno(empresa.id, nombre.trim(), contrasena);
      const authenticatedUser = await getInternalSession(empresa.id);
      setSession(authenticatedUser);
      setContrasena("");
    } catch (cause) {
      setLoginError(
        cause instanceof Error
          ? cause.message
          : "No se pudo iniciar sesión. Intentá nuevamente.",
      );
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setPageError(null);
    try {
      await logoutInterno(empresa.id);
      setSession(null);
      setNombre("");
      setContrasena("");
    } catch (cause) {
      setPageError(
        cause instanceof Error
          ? cause.message
          : "No se pudo cerrar la sesión.",
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  const moduleLabel = modulo === "catalogo" ? "Catálogo interno" : "Saldos internos";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-5 py-4 sm:px-8">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-card border border-border bg-surface">
            <CompanyLogo empresa={empresa} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{empresa.nombre}</p>
            <p className="text-sm text-muted">{moduleLabel}</p>
          </div>
          {session ? (
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={isLoggingOut}
              className="min-h-10 shrink-0 rounded-button border border-border px-3 text-sm font-medium transition hover:bg-surface-raised disabled:opacity-60 sm:px-4"
            >
              {isLoggingOut ? "Saliendo…" : "Cerrar sesión"}
            </button>
          ) : null}
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl space-y-6 px-5 py-8 sm:px-8 sm:py-10">
        {session ? (
          <nav
            aria-label="Páginas internas"
            className="flex flex-wrap gap-3 border-b border-border pb-5"
          >
            {empresa.catalogoHabilitado ? (
              <InternalNavLink
                active={modulo === "catalogo"}
                href={`/${empresa.slug}/catalogo/interno`}
              >
                Catálogo interno
              </InternalNavLink>
            ) : null}
            {empresa.saldosHabilitados ? (
              <InternalNavLink
                active={modulo === "saldo"}
                href={`/${empresa.slug}/saldo/interno`}
              >
                Saldos internos
              </InternalNavLink>
            ) : null}
          </nav>
        ) : null}

        {isCheckingSession ? (
          <p role="status" className="text-sm text-muted">
            Verificando acceso…
          </p>
        ) : null}
        {pageError ? (
          <p
            role="alert"
            className="rounded-input border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
          >
            {pageError}
          </p>
        ) : null}

        {!isCheckingSession && !session && !pageError ? (
          <form
            onSubmit={handleLogin}
            className="mx-auto grid w-full max-w-md gap-5 rounded-card border border-border bg-surface p-6 shadow-xl sm:p-8"
          >
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Ingreso interno
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted">
                Ingresá con el usuario interno de {empresa.nombre}.
              </p>
            </div>
            <Input
              id="internal-user-name"
              label="Nombre de usuario"
              value={nombre}
              onChange={(event) => setNombre(event.currentTarget.value)}
              autoComplete="username"
              maxLength={255}
              required
            />
            <PasswordInput
              id="internal-user-password"
              label="Contraseña"
              value={contrasena}
              onChange={(event) => setContrasena(event.currentTarget.value)}
              autoComplete="current-password"
              maxLength={72}
              required
            />
            {loginError ? (
              <p
                role="alert"
                className="rounded-input border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
              >
                {loginError}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={isLoggingIn || nombre.trim().length === 0 || contrasena.length === 0}
              className="inline-flex min-h-12 items-center justify-center rounded-button bg-brand px-5 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingIn ? "Ingresando…" : "Ingresar"}
            </button>
          </form>
        ) : null}

        {session && modulo === "catalogo" ? (
          <InternalCatalogList empresaId={empresa.id} />
        ) : null}
        {session && modulo === "saldo" ? (
          <InternalBalancesList empresaId={empresa.id} />
        ) : null}
      </div>
    </main>
  );
}

function InternalNavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-10 items-center rounded-button border px-4 text-sm font-medium transition ${
        active
          ? "border-brand bg-brand/10 text-brand"
          : "border-border text-muted hover:bg-surface-raised"
      }`}
    >
      {children}
    </Link>
  );
}
