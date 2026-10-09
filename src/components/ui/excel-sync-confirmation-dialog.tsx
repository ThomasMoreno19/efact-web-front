import type { FormEvent, ReactNode } from "react";
import { DialogShell } from "@/components/ui/dialog-shell";

export function ExcelSyncConfirmationDialog({
  children,
  confirmationWord,
  error,
  isSubmitting,
  onCancel,
  onConfirmationWordChange,
  onConfirm,
  warning,
}: {
  children?: ReactNode;
  confirmationWord: string;
  error?: string | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirmationWordChange: (value: string) => void;
  onConfirm: () => void;
  warning: ReactNode;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirmationWord.trim().toLowerCase() === "confirmo") onConfirm();
  }

  return (
    <DialogShell
      title="Confirmar sincronización"
      onClose={onCancel}
    >
      <form className="space-y-5" onSubmit={submit}>
        <div className="space-y-3 text-sm leading-6 text-foreground font-bold">
          {warning}
        </div>
        {children}
        <div>
          <label
            htmlFor="excel-sync-confirmation"
            className="mb-2 block text-sm font-semibold text-muted"
          >
            Ingrese la palabra "
            <span className="text-foreground">confirmo</span>
            " para proseguir
          </label>
          <input
            id="excel-sync-confirmation"
            autoComplete="off"
            value={confirmationWord}
            onChange={(event) => onConfirmationWordChange(event.target.value)}
            className="h-11 w-full rounded-button border border-border bg-surface px-3 text-sm outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30"
          />
        </div>
        {error ? (
          <p
            role="alert"
            className="whitespace-pre-line rounded-button border border-danger/40 bg-danger/10 p-3 text-sm"
          >
            {error}
          </p>
        ) : null}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="inline-flex h-11 items-center justify-center rounded-button border border-border px-5 text-sm font-semibold transition hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={
              isSubmitting ||
              confirmationWord.trim().toLowerCase() !== "confirmo"
            }
            className="inline-flex h-11 items-center justify-center rounded-button bg-brand px-5 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Sincronizando…" : "Aceptar"}
          </button>
        </div>
      </form>
    </DialogShell>
  );
}
