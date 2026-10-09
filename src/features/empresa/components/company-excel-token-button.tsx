"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { getEmpresaExcelImportToken } from "@/features/empresa/services/empresa-client.service";

export function CompanyExcelTokenButton({ empresaId }: { empresaId: number }) {
  const [isCopying, setIsCopying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  async function copyToken() {
    if (isCopying) return;
    setIsCopying(true);
    setMessage(null);
    setHasError(false);

    try {
      const token = await getEmpresaExcelImportToken(empresaId);
      await navigator.clipboard.writeText(token);
      setMessage('Token copiado al portapapeles.');
    } catch (cause) {
      setHasError(true);
      setMessage(
        cause instanceof Error
          ? cause.message
          : 'No se pudo copiar el token de importación.',
      );
    } finally {
      setIsCopying(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={isCopying}
        onClick={copyToken}
        className="relative flex h-10 w-full items-center justify-center rounded-button border border-border bg-surface-raised px-3 text-sm font-medium transition hover:border-brand/50 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-60"
      >
        {isCopying ? 'Obteniendo token…' : 'Copiar token'}
        <Copy aria-hidden="true" className="absolute right-3 size-4" />
      </button>
      {message ? (
        <p
          role={hasError ? 'alert' : 'status'}
          className={`mt-2 text-xs ${hasError ? "text-danger" : "text-muted"}`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
