"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { PasswordInput } from "@/components/ui/password-input";

interface ClientPasswordDialogProps {
  open: boolean;
  isLoading: boolean;
  error: string | null;
  description?: string | null;
  submitLabel?: string;
  onClose: () => void;
  onSubmit: (password: string) => void;
}

export function ClientPasswordDialog({
  open,
  isLoading,
  error,
  description = "Este cliente tiene una contraseña para consultar el saldo.",
  submitLabel = "Ver saldo",
  onClose,
  onSubmit,
}: ClientPasswordDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [password, setPassword] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (!open) setPassword("");
  }, [open]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length === 0 || isLoading) return;
    onSubmit(password);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="client-password-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!isLoading) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !isLoading) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md border-0 bg-transparent p-0 text-foreground backdrop:bg-black/75"
    >
      <section className="rounded-card border border-border bg-surface p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex size-12 items-center justify-center rounded-card border border-brand/30 bg-brand/10 text-brand">
          <LockIcon />
        </div>
        <h2
          id="client-password-title"
          className="text-xl font-semibold tracking-tight"
        >
          Ingresá tu contraseña
        </h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
          <PasswordInput
            id="client-password"
            label="Contraseña"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            autoFocus
            required
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "client-password-error" : undefined}
            disabled={isLoading}
          />
          {error ? (
            <p
              id="client-password-error"
              role="alert"
              className="text-sm text-danger"
            >
              {error}
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="inline-flex min-h-12 items-center justify-center rounded-button border border-border px-5 text-sm font-semibold text-foreground transition hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || password.length === 0}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-button bg-brand px-5 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? <LoadingIcon /> : null}
              {isLoading ? "Verificando…" : submitLabel}
            </button>
          </div>
        </form>
      </section>
    </dialog>
  );
}

function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-6"
    >
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
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
