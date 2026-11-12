"use client";

import { useEffect, useState, type FormEvent } from "react";
import { PasswordInput } from "@/components/ui/password-input";
import { CompanyLogo } from "@/features/empresa/components/company-logo";
import { CatalogoPublicoPage } from "@/features/catalogo/components/catalogo-publico-page";
import type { EmpresaPublica } from "@/features/empresa/types/empresa";
import type { CatalogoCarritoEntrada } from "@/features/catalogo/utils/catalogo-carrito-url";

export function CatalogoExternoGate({
  empresa,
  initialCartEntries,
  initialArticleCode,
  initialOpenArticleDetails,
}: {
  empresa: EmpresaPublica;
  initialCartEntries: CatalogoCarritoEntrada[];
  initialArticleCode?: string | null;
  initialOpenArticleDetails: boolean;
}) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/external/empresas/${empresa.id}/session`, { cache: "no-store" })
      .then((response) => setAuthenticated(response.ok))
      .catch(() => setError("No se pudo verificar la sesión. Intentá nuevamente."))
      .finally(() => setChecking(false));
  }, [empresa.id]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/external-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresaId: empresa.id, contrasena: password }),
      });
      const payload = await response.json().catch(() => null) as { message?: string } | null;
      if (!response.ok) throw new Error(payload?.message ?? "No se pudo iniciar sesión.");
      setAuthenticated(true);
      setPassword("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo iniciar sesión.");
    } finally {
      setSaving(false);
    }
  }

  if (authenticated) {
    return <CatalogoPublicoPage empresa={empresa} initialView="catalogo" initialCartEntries={initialCartEntries} initialArticleCode={initialArticleCode} initialOpenArticleDetails={initialOpenArticleDetails} replaceCategoryFilters />;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-4 sm:px-8">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-card border border-border bg-surface"><CompanyLogo empresa={empresa} /></div>
          {!empresa.logo_url?.trim() || empresa.mostrarNombreConLogo ? <p className="font-semibold">{empresa.nombre}</p> : null}
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        {checking ? <p role="status" className="text-sm text-muted">Verificando acceso…</p> : null}
        {!checking && !authenticated ? (
          <form onSubmit={login} className="mx-auto grid w-full max-w-md gap-5 rounded-card border border-border bg-surface p-6 shadow-xl sm:p-8">
            <div><h1 className="text-2xl font-semibold tracking-tight">Ingreso al catálogo</h1><p className="mt-2 text-sm leading-6 text-muted">Ingresá la contraseña externa de {empresa.nombre}.</p></div>
            <PasswordInput id="external-catalog-password" label="Contraseña" value={password} onChange={(event) => setPassword(event.currentTarget.value)} autoComplete="current-password" maxLength={72} required />
            {error ? <p role="alert" className="rounded-input border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
            <button type="submit" disabled={saving || password.length === 0} className="inline-flex min-h-12 items-center justify-center rounded-button bg-brand px-5 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Ingresando…" : "Ingresar"}</button>
          </form>
        ) : null}
      </div>
    </main>
  );
}
