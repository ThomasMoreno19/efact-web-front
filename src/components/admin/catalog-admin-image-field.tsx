"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { CATALOG_RECORD_IMAGE_FILE_ACCEPT } from "@/features/catalogo/constants/catalog-record-image-upload";
import { getAccessibleImageUrl } from "@/services/image-url";

interface CatalogAdminImageFieldProps {
  currentImageUrl: string | null;
  file: File | null;
  removeCurrentImage: boolean;
  onFileChange: (file: File | null) => void;
  onRemoveCurrentImage: () => void;
  onUndoRemoveImage: () => void;
}

export function CatalogAdminImageField({
  currentImageUrl,
  file,
  removeCurrentImage,
  onFileChange,
  onRemoveCurrentImage,
  onUndoRemoveImage,
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

  const imageUrl = previewUrl ?? (removeCurrentImage ? null : getAccessibleImageUrl(currentImageUrl));

  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium text-foreground">
        Imagen
      </p>
      <div className="relative flex flex-col gap-4 rounded-input border border-border bg-field p-3 sm:flex-row sm:items-center">
        {currentImageUrl && !file && !removeCurrentImage ? (
          <button
            type="button"
            aria-label="Eliminar imagen"
            title="Eliminar imagen"
            onClick={onRemoveCurrentImage}
            className="absolute right-2 top-2 z-10 flex size-10 items-center justify-center rounded-button border border-border bg-surface text-danger transition hover:bg-danger/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <Trash2 aria-hidden="true" className="size-5" />
          </button>
        ) : null}
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
            aria-label="Seleccionar archivo de imagen"
            className="peer sr-only"
          />
          <label
            htmlFor="catalog-record-image"
            className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-button bg-brand px-4 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand"
          >
            Seleccionar archivo
          </label>
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
          ) : currentImageUrl && removeCurrentImage ? (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <p className="text-xs text-muted">La imagen se eliminará al guardar.</p>
              <button type="button" onClick={onUndoRemoveImage} className="text-xs text-muted underline underline-offset-2 hover:text-foreground">
                Deshacer
              </button>
            </div>
          ) : currentImageUrl ? (
            null
          ) : null}
        </div>
      </div>
    </div>
  );
}
