'use client';

import Image from 'next/image';
import { ArrowLeft, Info, Minus, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { CatalogoShareButton } from '@/features/catalogo/components/catalogo-share-button';
import { CatalogoRegistroDetalleModal } from '@/features/catalogo/components/catalogo-registro-detalle-modal';
import { DialogShell } from '@/components/ui/dialog-shell';
import { Input } from '@/components/ui/input';
import { HorarioPublicoDialog } from '@/features/horario/components/horario-publico-dialog';
import type { Horario } from '@/features/horario/types/horario';
import type {
  CatalogoItemCarrito,
  CatalogoObservacionCarrito,
} from '@/features/catalogo/types/catalogo-carrito';
import { MAX_CART_QUANTITY } from '@/features/catalogo/utils/catalogo-carrito-url';
import {
  formatArticleName,
  formatCurrency,
} from '@/features/catalogo/utils/catalogo-publico';
import { buildCatalogoArticuloUrl } from '@/features/catalogo/utils/catalogo-share-url';
import { getAccessibleImageUrl } from '@/services/image-url';
import WhatsappLogo from '../../../../public/whatsapp.svg';

export function CatalogoCarritoPage({
  items,
  empresaSlug,
  imagenesEnArticulos,
  toleranciaMinDias,
  toleranciaMaxDias,
  shareUrl,
  isLoading,
  error,
  estadoHorario,
  horarios,
  onBack,
  onContinue,
  onRetryHorario,
  onRemoveAll,
  onQuantityChange,
  onObservationChange,
  onRemove,
}: {
  items: CatalogoItemCarrito[];
  empresaSlug: string;
  imagenesEnArticulos: boolean;
  toleranciaMinDias: number | null;
  toleranciaMaxDias: number | null;
  shareUrl: string;
  isLoading: boolean;
  error: string | null;
  estadoHorario: 'habilitado' | 'fuera-horario' | 'consultando' | 'error';
  horarios: Horario[];
  onBack: () => void;
  onContinue: () => void;
  onRetryHorario: () => void;
  onRemoveAll: () => void;
  onQuantityChange: (id: string | number, quantity: number) => void;
  onObservationChange: (
    id: string | number,
    field: CatalogoObservacionCarrito,
    value: string,
  ) => void;
  onRemove: (id: string | number) => void;
}) {
  const total = calculateOrderTotal(items);
  const [mostrarHorarios, setMostrarHorarios] = useState(false);
  const [confirmarVaciado, setConfirmarVaciado] = useState(false);
  const continuarDeshabilitado =
    isLoading || items.length === 0 || estadoHorario !== 'habilitado';

  return (
    <>
      <div className="pb-52 sm:pb-36">
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
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-b border-border px-4 py-4 sm:px-8">
            {!isLoading && items.length > 0 ? (
              <button
                type="button"
                aria-label="Vaciar pedido"
                onClick={() => setConfirmarVaciado(true)}
                className="inline-flex size-9 items-center justify-center justify-self-start rounded-button border border-border text-danger transition hover:bg-danger/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <Trash2 aria-hidden="true" className="size-4 shrink-0" />
              </button>
            ) : (
              <span aria-hidden="true" />
            )}
            <h2 className="text-center text-lg font-semibold">Tu pedido</h2>
            {!isLoading && items.length > 0 ? (
              <div className="justify-self-end">
                <CatalogoShareButton href={shareUrl} title="Tu pedido" />
              </div>
            ) : (
              <span aria-hidden="true" />
            )}
          </div>

          <div className="space-y-4 p-4 sm:p-8">
            {isLoading ? (
              <p role="status" className="py-5 text-center text-sm text-muted">
                Cargando artículos del carrito…
              </p>
            ) : null}
            {error ? (
              <p role="alert" className="text-center text-sm text-danger">
                {error}
              </p>
            ) : null}
            {!isLoading && items.length > 0 ? (
              items.map((item) => (
                <CartItem
                  key={item.articulo.id}
                  item={item}
                  empresaSlug={empresaSlug}
                  imagenesEnArticulos={imagenesEnArticulos}
                  toleranciaMinDias={toleranciaMinDias}
                  toleranciaMaxDias={toleranciaMaxDias}
                  onQuantityChange={onQuantityChange}
                  onObservationChange={onObservationChange}
                  onRemove={onRemove}
                />
              ))
            ) : !isLoading ? (
              <p className="py-5 text-center text-sm text-muted">
                El carrito está vacío.
              </p>
            ) : null}
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 py-3 shadow-xl backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {estadoHorario === 'fuera-horario' ? (
            <p role="status" className="text-sm text-muted">
              No se pueden realizar pedidos fuera de horario{' '}
              <button
                type="button"
                onClick={() => setMostrarHorarios(true)}
                className="font-semibold text-brand underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                consultar horarios
              </button>
            </p>
          ) : null}
          {estadoHorario === 'consultando' ? (
            <p role="status" className="text-sm text-muted">
              Consultando el horario de atención…
            </p>
          ) : null}
          {estadoHorario === 'error' ? (
            <p role="alert" className="text-sm text-danger">
              No se pudo consultar el horario de atención.{' '}
              <button
                type="button"
                onClick={onRetryHorario}
                className="font-semibold underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Reintentar
              </button>
            </p>
          ) : null}
          <div className="flex items-center justify-between gap-3 sm:ml-auto sm:justify-end">
            <p className="flex min-w-0 flex-col text-base font-semibold">
              <span>Total</span>
              <span className="break-words">
                {total === null ? 'Consultar' : formatCurrency(total)}
              </span>
            </p>
            <button
              type="button"
              onClick={onContinue}
              disabled={continuarDeshabilitado}
              className="inline-flex h-12 shrink-0 items-center justify-center rounded-button bg-brand px-4 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:px-5"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
      {mostrarHorarios && estadoHorario === 'fuera-horario' ? (
        <HorarioPublicoDialog
          horarios={horarios}
          onClose={() => setMostrarHorarios(false)}
        />
      ) : null}
      {confirmarVaciado ? (
        <DialogShell
          title="Vaciar pedido"
          onClose={() => setConfirmarVaciado(false)}
        >
          <p className="text-sm leading-6 text-muted">
            ¿Querés vaciar tu pedido? Esta acción no se puede deshacer.
          </p>
          <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setConfirmarVaciado(false)}
              className="h-11 rounded-button border border-border px-5 text-sm font-semibold transition hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmarVaciado(false);
                onRemoveAll();
              }}
              className="h-11 rounded-button bg-danger px-5 text-sm font-semibold text-background transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Eliminar todos
            </button>
          </div>
        </DialogShell>
      ) : null}
    </>
  );
}

function CartItem({
  item,
  empresaSlug,
  imagenesEnArticulos,
  toleranciaMinDias,
  toleranciaMaxDias,
  onQuantityChange,
  onObservationChange,
  onRemove,
}: {
  item: CatalogoItemCarrito;
  empresaSlug: string;
  imagenesEnArticulos: boolean;
  toleranciaMinDias: number | null;
  toleranciaMaxDias: number | null;
  onQuantityChange: (id: string | number, quantity: number) => void;
  onObservationChange: (
    id: string | number,
    field: CatalogoObservacionCarrito,
    value: string,
  ) => void;
  onRemove: (id: string | number) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [failedImageSource, setFailedImageSource] = useState<string | null>(null);
  const { articulo } = item;
  const itemPrice = getUnitPrice(item);
  const subtotal = itemPrice === null ? null : itemPrice * item.cantidad;
  const name = formatArticleName(articulo.nombre);
  const imageUrl = getAccessibleImageUrl(articulo.logo_url?.trim() || null);
  const mostrarImagen =
    imagenesEnArticulos && Boolean(imageUrl) && failedImageSource !== imageUrl;
  const shareUrl =
    typeof articulo.codigo_interno === 'number' &&
    Number.isSafeInteger(articulo.codigo_interno) &&
    articulo.codigo_interno >= 0 &&
    articulo.codigo_interno <= 2_147_483_647
      ? buildCatalogoArticuloUrl(
          `/${empresaSlug}/catalogo`,
          articulo.codigo_interno,
          true,
        )
      : null;

  return (
    <article className="rounded-record border border-border bg-surface-raised p-4 sm:p-5">
      <div className="flex items-start gap-4">
        {imagenesEnArticulos && imageUrl && failedImageSource !== imageUrl ? (
          <button
            type="button"
            aria-label={`Ver imagen y detalles de ${name}`}
            onClick={() => setShowDetails(true)}
            className="relative size-24 shrink-0 overflow-hidden rounded-record bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:size-28"
          >
            <CartArticleImage
              source={imageUrl}
              onError={() => setFailedImageSource(imageUrl)}
            />
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <h3 className="break-words text-base font-semibold">{name}</h3>
            <div className="flex shrink-0 items-center gap-1">
              {!mostrarImagen ? (
                <button
                  type="button"
                  aria-label={`Ver detalles de ${name}`}
                  onClick={() => setShowDetails(true)}
                  className="flex size-9 items-center justify-center rounded-button text-muted transition hover:bg-background hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <Info aria-hidden="true" className="size-4" />
                </button>
              ) : null}
              <button
                type="button"
                aria-label={`Quitar ${name} del carrito`}
                onClick={() => onRemove(articulo.id)}
                className="flex size-9 items-center justify-center rounded-button text-danger transition hover:bg-danger/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <dl className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {articulo.tiene_existencia === true ? (
            <div>
              <dt className="text-xs text-muted">Precio unitario</dt>
              <dd className="mt-1 font-medium">
                {itemPrice === null ? 'Consultar' : formatCurrency(itemPrice)}
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs text-muted">
              {articulo.tiene_existencia === true ? 'Subtotal' : 'Total'}
            </dt>
            <dd className="mt-1 font-semibold">
              {subtotal === null ? 'Consultar' : formatCurrency(subtotal)}
            </dd>
          </div>
        </dl>

        {articulo.tiene_existencia === true ? (
          <div
            className="inline-flex h-10 items-center gap-3 rounded-button border border-border px-2"
            aria-label={`Cantidad de ${name}`}
          >
            <button
              type="button"
              aria-label={`Disminuir cantidad de ${name}`}
              disabled={item.cantidad <= 1}
              onClick={() =>
                onQuantityChange(articulo.id, Math.max(1, item.cantidad - 1))
              }
              className="flex size-8 items-center justify-center rounded-button text-foreground transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus aria-hidden="true" className="size-4" />
            </button>
            <span className="min-w-5 text-center text-sm tabular-nums">
              {item.cantidad}
            </span>
            <button
              type="button"
              aria-label={`Aumentar cantidad de ${name}`}
              disabled={item.cantidad >= MAX_CART_QUANTITY}
              onClick={() => onQuantityChange(articulo.id, item.cantidad + 1)}
              className="flex size-8 items-center justify-center rounded-button text-foreground transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus aria-hidden="true" className="size-4" />
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3">
        <CartObservation
          id={`${articulo.id}-observation-1`}
          label="Observación 1"
          value={item.observacion1}
          onChange={(value) =>
            onObservationChange(articulo.id, 'observacion1', value)
          }
        />
        {item.observacion1.length >= 40 ? (
          <CartObservation
            id={`${articulo.id}-observation-2`}
            label="Observación 2"
            value={item.observacion2}
            onChange={(value) =>
              onObservationChange(articulo.id, 'observacion2', value)
            }
          />
        ) : null}
        {item.observacion2.length >= 40 ? (
          <CartObservation
            id={`${articulo.id}-observation-3`}
            label="Observación 3"
            value={item.observacion3}
            onChange={(value) =>
              onObservationChange(articulo.id, 'observacion3', value)
            }
          />
        ) : null}
      </div>
      {showDetails ? (
        <CatalogoRegistroDetalleModal
          articulo={articulo}
          shareUrl={shareUrl}
          mostrarImagen={mostrarImagen}
          toleranciaMinDias={toleranciaMinDias}
          toleranciaMaxDias={toleranciaMaxDias}
          onClose={() => setShowDetails(false)}
        />
      ) : null}
    </article>
  );
}

function CartArticleImage({ source, onError }: { source: string; onError: () => void }) {
  return (
    <Image
      src={source}
      alt=""
      aria-hidden="true"
      fill
      unoptimized
      className="object-contain"
      onError={onError}
    />
  );
}

function CartObservation({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        maxLength={50}
        rows={2}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="w-full resize-y rounded-input border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-4 focus:ring-brand/15"
      />
      <p className="text-right text-xs text-muted">{value.length}/50</p>
    </div>
  );
}

export function PedidoClientePage({
  nombre,
  observacion,
  onNombreChange,
  onObservacionChange,
  onBack,
  onSubmit,
  whatsappDisponible,
  isSending,
  submitError,
}: {
  nombre: string;
  observacion: string;
  onNombreChange: (value: string) => void;
  onObservacionChange: (value: string) => void;
  onBack: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  whatsappDisponible: boolean;
  isSending: boolean;
  submitError: string | null;
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
          Volver al carrito
        </button>
      </div>
      <section className="overflow-hidden rounded-card border border-border bg-surface">
        <div className="flex justify-center border-b border-border px-4 py-4 sm:px-8">
          <h2 className="text-center text-lg font-semibold">Datos del pedido</h2>
        </div>

        <form onSubmit={onSubmit} className="grid gap-5 p-4 sm:p-8">
          <Input
            id="catalog-order-customer-name"
            label="Nombre"
            value={nombre}
            required
            autoComplete="name"
            onChange={(event) => onNombreChange(event.currentTarget.value)}
          />
          <div className="grid gap-2">
            <label
              htmlFor="catalog-order-observation"
              className="text-sm font-medium"
            >
              Observación del pedido
            </label>
            <textarea
              id="catalog-order-observation"
              value={observacion}
              rows={4}
              onChange={(event) =>
                onObservacionChange(event.currentTarget.value)
              }
              className="w-full resize-y rounded-input border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-4 focus:ring-brand/15"
            />
          </div>
          {!whatsappDisponible ? (
            <p role="alert" className="text-sm text-danger">
              La empresa no tiene un número de WhatsApp válido para enviar el pedido.
            </p>
          ) : null}
          {submitError ? (
            <p role="alert" className="text-sm text-danger">
              {submitError}
            </p>
          ) : null}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={!whatsappDisponible || nombre.trim().length === 0 || isSending}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-button bg-brand px-6 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <Image
                src={WhatsappLogo}
                alt=""
                aria-hidden="true"
                unoptimized
                className="size-5"
              />
              {isSending ? 'Registrando pedido…' : 'Enviar'}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

export function calculateOrderTotal(items: CatalogoItemCarrito[]) {
  if (items.some((item) => getUnitPrice(item) === null)) return null;
  return items.reduce(
    (total, item) => total + (getUnitPrice(item) ?? 0) * item.cantidad,
    0,
  );
}

function getUnitPrice(item: CatalogoItemCarrito) {
  if (
    item.precioConsultar ||
    item.articulo.precio1 === null ||
    item.articulo.precio1 === undefined
  ) {
    return null;
  }
  return item.articulo.precio1;
}
