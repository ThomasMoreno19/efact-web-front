"use client";

import { useState } from "react";
import { DialogShell } from "@/components/ui/dialog-shell";
import { deleteEmpresa } from "@/features/empresa/services/empresa-client.service";
import type { Empresa } from "@/features/empresa/types/empresa";

interface DeleteCompanyDialogProps {
  empresa: Empresa;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteCompanyDialog({
  empresa,
  onClose,
  onDeleted,
}: DeleteCompanyDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (isDeleting) return;
    setError(null);
    setIsDeleting(true);

    try {
      await deleteEmpresa(empresa.id);
      onDeleted();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "No se pudo eliminar la empresa.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <DialogShell title="Eliminar empresa" onClose={onClose}>
      <p className="text-sm leading-6 text-muted">
        ¿Querés eliminar{" "}
        <strong className="font-semibold text-foreground">{empresa.nombre}</strong>?
        Esta acción no se puede deshacer.
      </p>
      {error ? (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="h-11 rounded-button border border-border px-4 text-sm font-medium transition hover:bg-surface-raised"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="h-11 rounded-button bg-danger px-5 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? "Eliminando..." : "Eliminar"}
        </button>
      </div>
    </DialogShell>
  );
}
