"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { CATALOG_RECORD_IMAGE_FILE_ACCEPT } from "@/features/catalogo/constants/catalog-record-image-upload";
import { getAccessibleImageUrl } from "@/services/image-url";

interface CatalogAdminImageFieldProps {
  currentImageUrl: string | null;
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export function CatalogAdminImageField({
  currentImageUrl,
  file,
  onFileChange,
}: CatalogAdminImageFieldProps) {
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

  const imageUrl = previewUrl ?? getAccessibleImageUrl(currentImageUrl);

  return (
    <div className="grid gap-2">
      <label htmlFor="catalog-record-image" className="text-sm font-medium text-foreground">
        Imagen
      </label>
      <div className="flex flex-col gap-4 rounded-input border border-border bg-field p-3 sm:flex-row sm:items-center">
        <div className="relative flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-input bg-surface-raised sm:w-36">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={file ? `Vista previa de ${file.name}` : "Imagen actual del registro"}
              fill
              unoptimized
              sizes="144px"
              className="object-contain p-3"
            />
          ) : (
            <span className="px-2 text-center text-xs text-muted">Sin imagen</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <input
            ref={fileInputRef}
            id="catalog-record-image"
            type="file"
            accept={CATALOG_RECORD_IMAGE_FILE_ACCEPT}
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-muted file:mr-3 file:rounded-button file:border-0 file:bg-brand file:px-3 file:py-2 file:font-medium file:text-brand-foreground hover:file:bg-brand-hover"
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
                onClick={() => {
                  onFileChange(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="shrink-0 text-xs text-muted underline underline-offset-2 hover:text-foreground"
              >
                Quitar
              </button>
            </div>
          ) : currentImageUrl ? (
            <p className="mt-1 text-xs text-muted">Se conservará la imagen actual.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
