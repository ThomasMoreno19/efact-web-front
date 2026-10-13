"use client";

import { useState } from "react";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { updateEmpresaPageNavigation } from "@/features/empresa/services/empresa-client.service";

export function CompanyPageNavigationSetting({
  empresaId,
  initialValue,
}: {
  empresaId: number;
  initialValue: boolean;
}) {
  const [isEnabled, setIsEnabled] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function save(value: boolean) {
    if (isSaving) return;

    const previousValue = isEnabled;
    setIsEnabled(value);
    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      await updateEmpresaPageNavigation(empresaId, {
        mostrarNavegacionPaginas: value,
      });
      setNotice("La navegación de páginas se guardó correctamente.");
    } catch (cause) {
      setIsEnabled(previousValue);
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo guardar la navegación de páginas.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <fieldset disabled={isSaving} className="min-w-0">
        <CheckboxField
          id="company-page-navigation-enabled"
          checked={isEnabled}
          onChange={(value) => void save(value)}
          label="Mostrar Navegación de páginas"
          description="Permite que los clientes naveguen a las demás páginas públicas habilitadas."
        />
      </fieldset>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="mt-3 text-sm text-muted">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
