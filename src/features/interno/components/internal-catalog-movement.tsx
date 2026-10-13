'use client';

import Image from 'next/image';
import { ArrowLeft, Minus, Plus, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import type { MovimientoExistenciaItem } from '@/features/interno/utils/movimiento-existencia-whatsapp';
import WhatsappLogo from '../../../../public/whatsapp.svg';

export function InternalCatalogMovementCart({
  items,
  onBack,
  onContinue,
  onQuantityChange,
  onObservationChange,
  onRemove,
}: {
  items: MovimientoExistenciaItem[];
  onBack: () => void;
  onContinue: () => void;
  onQuantityChange: (id: string, quantity: string) => void;
  onObservationChange: (id: string, value: string) => void;
  onRemove: (id: string) => void;
}) {
  const quantityIsValid = items.every(isValidQuantity);

  return (
    <>
      <div className="mb-2 flex justify-start">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-8 items-center gap-1.5 rounded-button border border-border px-2.5 text-xs font-medium transition hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          Volver al catálogo
        </button>
      </div>
      <section className="overflow-hidden rounded-card border border-border bg-surface">
        <div className="border-b border-border px-4 py-4 text-center sm:px-8">
          <h1 className="text-lg font-semibold">Movimiento de existencia</h1>
        </div>
        <div className="space-y-4 p-4 pb-36 sm:p-8 sm:pb-36">
          {items.length > 0 ? (
            items.map((item) => (
              <article
                key={item.articulo.id}
                className="rounded-record border border-border bg-surface-raised p-4 sm:p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="break-words text-base font-semibold">
                      {item.articulo.nombre}
                    </h2>
                    <p className="mt-1 text-xs text-muted">
                      Código {item.articulo.codigoInterno} · Existencia actual:{' '}
                      {item.articulo.existencia.toLocaleString('es-AR')}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Quitar ${item.articulo.nombre} del movimiento`}
                    onClick={() => onRemove(item.articulo.id)}
                    className="flex size-9 shrink-0 items-center justify-center rounded-button text-danger transition hover:bg-danger/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </button>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(10rem,0.8fr)_minmax(0,1.2fr)]">
                  <div className="grid gap-2">
                    <label
                      htmlFor={`internal-movement-quantity-${item.articulo.id}`}
                      className="text-sm font-medium"
                    >
                      Existencia real
                    </label>
                    <div className="flex h-12 items-center rounded-input border border-border bg-field">
                      <button
                        type="button"
                        aria-label={`Restar uno a la existencia real de ${item.articulo.nombre}`}
                        onClick={() =>
                          onQuantityChange(
                            item.articulo.id,
                            String((toQuantity(item.cantidad) ?? 0) - 1),
                          )
                        }
                        className="flex size-11 shrink-0 items-center justify-center rounded-l-input text-muted transition hover:bg-surface-raised hover:text-foreground focus-visible:outline-2 focus-visible:outline-brand"
                      >
                        <Minus aria-hidden="true" className="size-4" />
                      </button>
                      <input
                        id={`internal-movement-quantity-${item.articulo.id}`}
                        type="number"
                        step="1"
                        value={item.cantidad}
                        onChange={(event) =>
                          onQuantityChange(item.articulo.id, event.currentTarget.value)
                        }
                        aria-invalid={!isValidQuantity(item)}
                        className="h-full min-w-0 flex-1 border-x border-border bg-transparent px-2 text-center text-sm tabular-nums text-foreground outline-none focus:border-brand"
                      />
                      <button
                        type="button"
                        aria-label={`Sumar uno a la existencia real de ${item.articulo.nombre}`}
                        onClick={() =>
                          onQuantityChange(
                            item.articulo.id,
                            String((toQuantity(item.cantidad) ?? 0) + 1),
                          )
                        }
                        className="flex size-11 shrink-0 items-center justify-center rounded-r-input text-muted transition hover:bg-surface-raised hover:text-foreground focus-visible:outline-2 focus-visible:outline-brand"
                      >
                        <Plus aria-hidden="true" className="size-4" />
                      </button>
                    </div>
                    {!isValidQuantity(item) ? (
                      <p className="text-xs text-danger">
                        Ingresá una cantidad entera válida.
                      </p>
                    ) : null}
                  </div>
                  <div className="grid gap-2">
                    <label
                      htmlFor={`internal-movement-observation-${item.articulo.id}`}
                      className="text-sm font-medium"
                    >
                      Observación del artículo
                    </label>
                    <textarea
                      id={`internal-movement-observation-${item.articulo.id}`}
                      value={item.observacion}
                      maxLength={100}
                      rows={2}
                      onChange={(event) =>
                        onObservationChange(item.articulo.id, event.currentTarget.value)
                      }
                      className="w-full resize-y rounded-input border border-border bg-field px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-4 focus:ring-brand/15"
                    />
                    <p className="text-right text-xs text-muted">
                      {item.observacion.length}/100
                    </p>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="py-5 text-center text-sm text-muted">
              No hay artículos seleccionados.
            </p>
          )}
        </div>
      </section>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 py-3 shadow-xl backdrop-blur">
        <div className="mx-auto flex max-w-6xl justify-end">
          <button
            type="button"
            onClick={onContinue}
            disabled={items.length === 0 || !quantityIsValid}
            className="inline-flex h-12 shrink-0 items-center justify-center rounded-button bg-brand px-5 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Continuar
          </button>
        </div>
      </div>
    </>
  );
}

export function InternalCatalogMovementCheckout({
  nombre,
  observacion,
  whatsappDisponible,
  onNombreChange,
  onObservacionChange,
  onBack,
  onSubmit,
}: {
  nombre: string;
  observacion: string;
  whatsappDisponible: boolean;
  onNombreChange: (value: string) => void;
  onObservacionChange: (value: string) => void;
  onBack: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <>
      <div className="mb-2 flex justify-start">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-8 items-center gap-1.5 rounded-button border border-border px-2.5 text-xs font-medium transition hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          Volver al movimiento
        </button>
      </div>
      <section className="overflow-hidden rounded-card border border-border bg-surface">
        <div className="border-b border-border px-4 py-4 text-center sm:px-8">
          <h1 className="text-lg font-semibold">Datos del movimiento</h1>
        </div>
        <form onSubmit={onSubmit} className="grid gap-5 p-4 sm:p-8">
          <Input
            id="internal-movement-customer-name"
            label="Nombre"
            value={nombre}
            required
            maxLength={100}
            autoComplete="name"
            onChange={(event) => onNombreChange(event.currentTarget.value)}
          />
          <div className="grid gap-2">
            <label
              htmlFor="internal-movement-order-observation"
              className="text-sm font-medium"
            >
              Observación del movimiento
            </label>
            <textarea
              id="internal-movement-order-observation"
              value={observacion}
              maxLength={500}
              rows={4}
              onChange={(event) => onObservacionChange(event.currentTarget.value)}
              className="w-full resize-y rounded-input border border-border bg-field px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-4 focus:ring-brand/15"
            />
          </div>
          {!whatsappDisponible ? (
            <p role="alert" className="text-sm text-danger">
              La empresa no tiene un número de WhatsApp válido para enviar el movimiento.
            </p>
          ) : null}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={!whatsappDisponible || nombre.trim().length === 0}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-button bg-brand px-6 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <Image
                src={WhatsappLogo}
                alt=""
                aria-hidden="true"
                unoptimized
                className="size-5"
              />
              Enviar movimiento
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

function toQuantity(value: string) {
  const quantity = Number(value);
  return Number.isSafeInteger(quantity) ? quantity : null;
}

function isValidQuantity(item: MovimientoExistenciaItem) {
  return item.cantidad.trim() !== '' && toQuantity(item.cantidad) !== null;
}
