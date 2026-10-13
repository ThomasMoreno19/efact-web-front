"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Empresa } from "@/features/empresa/types/empresa";
import { LOGO_FILE_ACCEPT } from "@/features/empresa/constants/logo-upload";
import { getAccessibleImageUrl } from "@/services/image-url";

interface CompanyLogoUploadFieldProps {
  currentLogoUrl: Empresa["logo_url"];
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
}

export function CompanyLogoUploadField({
  currentLogoUrl,
  file,
  onFileChange,
  disabled = false,
}: CompanyLogoUploadFieldProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const currentPreviewUrl = getAccessibleImageUrl(currentLogoUrl);
  const imageUrl = previewUrl ?? currentPreviewUrl;

  return (
    <div className="grid gap-2">
      <label htmlFor="empresa-logo-file" className="text-sm font-medium text-foreground">
        Logo de la empresa
      </label>
      <div className="flex flex-col gap-4 rounded-input border border-border bg-field p-3 sm:flex-row sm:items-center">
        <div className="relative flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-input bg-surface-raised sm:w-36">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={file ? `Vista previa de ${file.name}` : "Logo actual de la empresa"}
              fill
              unoptimized
              sizes="144px"
              className="object-contain p-3"
            />
          ) : (
            <span className="px-2 text-center text-xs text-muted">Sin logo</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <input
            ref={fileInputRef}
            id="empresa-logo-file"
            type="file"
            accept={LOGO_FILE_ACCEPT}
            disabled={disabled}
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-muted file:mr-3 file:rounded-button file:border-0 file:bg-brand file:px-3 file:py-2 file:font-medium file:text-brand-foreground hover:file:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
          />
          <p className="mt-2 text-xs leading-5 text-muted">
            PNG, JPG o WebP. Tamaño máximo: 50 MB.
          </p>
          {file ? (
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="truncate text-xs text-foreground" title={file.name}>
                {file.name}
              </p>
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  onFileChange(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="shrink-0 text-xs text-muted underline underline-offset-2 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                Quitar
              </button>
            </div>
          ) : currentLogoUrl ? (
            <p className="mt-1 text-xs text-muted">Se conservará el logo actual.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
