"use client";

import type { CatalogoRegistroPublico } from "@/features/catalogo/types/catalogo-publico";
import {
  formatArticleName,
  formatCurrency,
  getUpdateDateStatus,
} from "@/features/catalogo/utils/catalogo-publico";
import { getAccessibleImageUrl } from "@/services/image-url";
import { CatalogoShareButton } from "@/features/catalogo/components/catalogo-share-button";
import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import InvisibleImage from "../../../../public/transparent.svg";

export function CatalogoRegistroDetalleModal({
  articulo,
  shareUrl,
  mostrarImagen,
  toleranciaMinDias,
  toleranciaMaxDias,
  onClose,
}: {
  articulo: CatalogoRegistroPublico;
  shareUrl: string | null;
  mostrarImagen: boolean;
  toleranciaMinDias: number | null;
  toleranciaMaxDias: number | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const articleName = formatArticleName(articulo.nombre);
  const imageUrl = getAccessibleImageUrl(articulo.logo_url?.trim() ?? null);
  const updateStatus = getUpdateDateStatus(
    articulo.actualizado_en,
    toleranciaMinDias,
    toleranciaMaxDias,
  );
  const price = updateStatus.isBeyondMaximum
    ? "Consultar"
    : articulo.precio1 !== undefined && articulo.precio1 !== null
      ? formatCurrency(articulo.precio1)
      : "Sin precio informado";
  const barcode = articulo.codigo_barra?.trim();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="catalog-article-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto overscroll-contain border-0 bg-transparent p-0 text-foreground backdrop:bg-black/75"
    >
      <section className="rounded-card border border-border bg-surface p-5 shadow-2xl sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2
            id="catalog-article-title"
            className="text-xl font-semibold sm:text-2xl"
          >
            {articleName}
          </h2>
          <div className="flex shrink-0 items-center gap-1">
            {shareUrl ? (
              <CatalogoShareButton href={shareUrl} title={articleName} />
            ) : null}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar detalles del artículo"
              className="flex size-9 shrink-0 items-center justify-center rounded-button text-muted transition hover:bg-surface-raised hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
        </div>

        <div
          className={`grid gap-6 ${mostrarImagen ? 'sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]' : ''}`}
        >
          {mostrarImagen ? (
            <div className="relative mx-auto aspect-square w-full max-w-[24rem] overflow-hidden rounded-record bg-surface-raised">
              <DetailImage source={imageUrl} alt={articleName} />
            </div>
          ) : null}

          <div className="min-w-0">
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Precio" value={price} />
              <DetailField
                label="Rubro"
                value={articulo.rubro?.nombre || "Sin rubro asociado"}
              />
              <DetailField
                label="Marca"
                value={articulo.marca?.nombre || "Sin marca asociada"}
              />
              <DetailField
                label="Oferta"
                value={
                  articulo.oferta === true ? "En oferta" : "No está en oferta"
                }
              />
              <DetailField
                label="Código de barras"
                value={barcode || "Sin código de barras"}
              />
            </dl>
          </div>
        </div>

        <section
          aria-labelledby="catalog-stock-legend-title"
          className="mt-7 rounded-record border border-border bg-surface-raised p-4 sm:p-5"
        >
          <h3 id="catalog-stock-legend-title" className="text-sm font-semibold">
            Semáforo de existencia
          </h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            <StockLegendItem
              colorClass="bg-stock-low"
              label="Rojo"
              description="La existencia es cero o negativa."
            />
            <StockLegendItem
              colorClass="bg-stock-warning"
              label="Amarillo"
              description="La existencia es menor o igual al mínimo."
            />
            <StockLegendItem
              colorClass="bg-stock-high"
              label="Verde"
              description="La existencia es mayor al mínimo, o coincide con un mínimo y máximo iguales."
            />
          </ul>
        </section>
      </section>
    </dialog>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-b border-border pb-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium">{value}</dd>
    </div>
  );
}

function StockLegendItem({
  colorClass,
  label,
  description,
}: {
  colorClass: string;
  label: string;
  description: string;
}) {
  return (
    <li className="min-w-0">
      <p className="flex items-center gap-2 text-xs font-semibold">
        <span
          aria-hidden="true"
          className={`size-3.5 shrink-0 rounded-pill ${colorClass}`}
        />
        {label}
      </p>
      <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
    </li>
  );
}

function DetailImage({ source, alt }: { source: string | null; alt: string }) {
  const [hasError, setHasError] = useState(false);
  if (!source || hasError) {
    return (
      <Image
        src={InvisibleImage}
        alt=""
        aria-hidden="true"
        fill
        className="object-contain p-8"
      />
    );
  }
  return (
    <Image
      src={source}
      alt={alt}
      fill
      unoptimized
      className="object-contain"
      onError={() => setHasError(true)}
    />
  );
}
