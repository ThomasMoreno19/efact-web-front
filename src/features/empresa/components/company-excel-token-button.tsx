"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { getEmpresaExcelImportToken } from "@/features/empresa/services/empresa-client.service";

export function CompanyExcelTokenButton({ empresaId }: { empresaId: number }) {
  const [isCopying, setIsCopying] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    },
    [],
  );

  async function copyToken() {
    if (isCopying) return;
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    setIsCopying(true);
    setIsCopied(false);
    setMessage(null);

    try {
      const token = await getEmpresaExcelImportToken(empresaId);
      await navigator.clipboard.writeText(token);
      setIsCopied(true);
      copiedTimeoutRef.current = setTimeout(() => {
        setIsCopied(false);
        copiedTimeoutRef.current = null;
      }, 3000);
    } catch (cause) {
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
        className={`relative flex h-10 w-full items-center justify-center rounded-button border px-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-60 ${
          isCopied
            ? "border-stock-high text-stock-high hover:border-stock-high hover:bg-stock-high/10"
            : "border-border bg-surface-raised hover:border-brand/50 hover:bg-surface"
        }`}
      >
        <span aria-live="polite">
          {isCopying ? 'Obteniendo token…' : isCopied ? '¡Copiado!' : 'Copiar token'}
        </span>
        {isCopied ? (
          <Check
            aria-hidden="true"
            className="absolute right-3 size-4 text-stock-high"
          />
        ) : (
          <Copy aria-hidden="true" className="absolute right-3 size-4" />
        )}
      </button>
      {message ? (
        <p role="alert" className="mt-2 text-xs text-danger">
          {message}
        </p>
      ) : null}
    </div>
  );
}
