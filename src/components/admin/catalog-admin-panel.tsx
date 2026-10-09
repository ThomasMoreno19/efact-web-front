"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import InvisibleImage from "../../../public/transparent.svg";
import { CatalogAdminImageField } from "@/components/admin/catalog-admin-image-field";
import { DialogShell } from "@/components/ui/dialog-shell";
import { Input } from "@/components/ui/input";
import {
  ACCEPTED_CATALOG_RECORD_IMAGE_MIME_TYPES,
  MAX_CATALOG_RECORD_IMAGE_SIZE_BYTES,
} from "@/features/catalogo/constants/catalog-record-image-upload";
import { useDismissLayer } from "@/hooks/use-dismiss-layer";
import type {
  CatalogAdminPage,
  CatalogAdminRecord,
} from "@/services/catalog-records-api.service";

export type CatalogAdminValue = string | boolean;
export type CatalogAdminValues = Record<string, CatalogAdminValue>;

export interface CatalogAdminField {
  id: string;
  label: string;
  type?: "text" | "number";
  maxLength?: number;
  required?: boolean;
}

export interface CatalogAdminCheckbox {
  id: string;
  label: string;
}

export type CatalogAdminStockStatus =
  | "red"
  | "yellow"
  | "green";

export interface CatalogAdminListDetails {
  code?: string | number;
  existence?: string;
  stockTracked?: boolean;
  price?: string | null;
  stockStatus?: CatalogAdminStockStatus | null;
}

export interface CatalogAdminDefinition<T extends CatalogAdminRecord> {
  label: string;
  presentation: "article" | "tiles" | "rows";
  fields: CatalogAdminField[];
  checkboxes?: CatalogAdminCheckbox[];
  loadPage: (
    empresaId: number,
    offset: number,
    search: string,
    signal?: AbortSignal,
  ) => Promise<CatalogAdminPage<T>>;
  updateRecord: (
    empresaId: number,
    id: string | number,
    data: Record<string, unknown>,
  ) => Promise<void>;
  updateRecordWithImage?: (
    empresaId: number,
    id: string | number,
    data: Record<string, unknown>,
    image: File,
  ) => Promise<void>;
  deleteRecord: (empresaId: number, id: string | number) => Promise<void>;
  getTitle: (record: T) => string;
  getSubtitle?: (record: T) => string | null;
  getSummary?: (record: T) => string;
  getListDetails?: (record: T) => CatalogAdminListDetails;
  getImageUrl?: (record: T) => string | null;
  getInitialValues: (record: T) => CatalogAdminValues;
  toUpdatePayload: (values: CatalogAdminValues) => Record<string, unknown>;
}

export function CatalogAdminPanel<T extends CatalogAdminRecord>({
  empresaId,
  definition,
  onTotalChange,
}: {
  empresaId: number;
  definition: CatalogAdminDefinition<T>;
  onTotalChange?: (total: number) => void;
}) {
  const [records, setRecords] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [offset, setOffset] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [editingRecord, setEditingRecord] = useState<T | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<T | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    definition
      .loadPage(empresaId, offset, searchQuery, controller.signal)
      .then((page) => {
        setRecords((current) =>
          offset === 0 ? page.records : [...current, ...page.records],
        );
        setHasMore(page.hasMore);
        setTotal(page.total);
        onTotalChange?.(page.total);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          cause instanceof Error
            ? cause.message
            : `No se pudieron cargar ${definition.label.toLowerCase()}.`,
        );
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        if (offset === 0) setIsLoading(false);
        else setIsLoadingMore(false);
      });

    return () => controller.abort();
  }, [definition, empresaId, offset, onTotalChange, reloadKey, searchQuery]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextSearch = searchText.trim().replace(/\s+/g, " ");
      if (nextSearch === searchQuery) return;
      setSearchQuery(nextSearch);
      setRecords([]);
      setHasMore(false);
      setOffset(0);
      setIsLoading(true);
      setIsLoadingMore(false);
      setError(null);
      setNotice(null);
      setReloadKey((current) => current + 1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchQuery, searchText]);

  useEffect(() => {
    if (!hasMore || isLoading || isLoadingMore || error) return;
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsLoadingMore(true);
          setOffset(records.length);
        }
      },
      { rootMargin: "240px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [error, hasMore, isLoading, isLoadingMore, records.length]);

  function reload() {
    setRecords([]);
    setHasMore(false);
    setOffset(0);
    setIsLoading(true);
    setIsLoadingMore(false);
    setError(null);
    setReloadKey((current) => current + 1);
  }

  function retryLoading() {
    if (records.length === 0) setIsLoading(true);
    else setIsLoadingMore(true);
    setError(null);
    setReloadKey((current) => current + 1);
  }

  async function saveRecord(values: CatalogAdminValues, image: File | null) {
    if (!editingRecord) return;
    const data = definition.toUpdatePayload(values);
    if (image && definition.updateRecordWithImage) {
      await definition.updateRecordWithImage(
        empresaId,
        editingRecord.id,
        data,
        image,
      );
    } else {
      await definition.updateRecord(empresaId, editingRecord.id, data);
    }
    setEditingRecord(null);
    setNotice("Registro actualizado.");
    reload();
  }

  async function deleteRecord() {
    if (!deletingRecord) return;
    await definition.deleteRecord(empresaId, deletingRecord.id);
    setDeletingRecord(null);
    setNotice("Registro eliminado.");
    reload();
  }

  return (
    <div>
      <div className="max-w-xl">
        <Input
          id={`catalog-${definition.label.toLowerCase()}-search`}
          label="Buscar por nombre"
          type="search"
          placeholder="Ingresá una o más palabras, por ejemplo: tornillo grande"
          value={searchText}
          maxLength={100}
          onChange={(event) => setSearchText(event.currentTarget.value)}
        />
      </div>

      {isLoading ? (
        <p role="status" className="mt-6 text-sm text-muted">
          Cargando registros…
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="mt-6 rounded-input border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
        >
          {error}
          <button
            type="button"
            onClick={retryLoading}
            className="ml-3 font-semibold underline underline-offset-2"
          >
            Reintentar
          </button>
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="mt-5 text-sm text-muted">
          {notice}
        </p>
      ) : null}
      {!isLoading && !error && records.length === 0 ? (
        <p className="mt-6 text-sm text-muted">
          {searchQuery
            ? "No se encontraron registros con esas palabras."
            : `No hay registros de ${definition.label.toLowerCase()}.`}
        </p>
      ) : null}

      {!isLoading && records.length > 0 ? (
        <RecordList
          records={records}
          definition={definition}
          onEdit={setEditingRecord}
          onDelete={setDeletingRecord}
        />
      ) : null}

      {hasMore && !isLoading ? (
        <div ref={loadMoreRef} className="mt-5 min-h-8">
          {isLoadingMore ? (
            <p role="status" className="text-center text-sm text-muted">
              Cargando más registros…
            </p>
          ) : null}
        </div>
      ) : null}

      {editingRecord ? (
        <CatalogAdminEditDialog
          definition={definition}
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSave={(values, image) => saveRecord(values, image)}
        />
      ) : null}
      {deletingRecord ? (
        <CatalogAdminDeleteDialog
          recordName={definition.getTitle(deletingRecord)}
          onClose={() => setDeletingRecord(null)}
          onDelete={deleteRecord}
        />
      ) : null}
    </div>
  );
}

function RecordList<T extends CatalogAdminRecord>({
  records,
  definition,
  onEdit,
  onDelete,
}: {
  records: T[];
  definition: CatalogAdminDefinition<T>;
  onEdit: (record: T) => void;
  onDelete: (record: T) => void;
}) {
  if (definition.presentation === "tiles") {
    return (
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {records.map((record) => (
          <article
            key={record.id}
            className="relative flex min-h-56 items-center justify-center rounded-record border border-border bg-surface-raised p-6 text-center odd:bg-foreground/5"
          >
            <div className="absolute inset-0 overflow-hidden rounded-record">
              <RecordImage source={definition.getImageUrl?.(record) ?? null} />
              <div className="absolute inset-0 bg-background/45" />
            </div>
            <h3 className="relative z-10 max-w-full break-words text-lg font-semibold">
              {definition.getTitle(record)}
            </h3>
            <CatalogRecordOptionsMenu
              recordName={definition.getTitle(record)}
              placement="corner"
              onEdit={() => onEdit(record)}
              onDelete={() => onDelete(record)}
            />
          </article>
        ))}
      </div>
    );
  }

  if (definition.presentation === "article") {
    return (
      <div className="mt-6 divide-y divide-border">
        {records.map((record) => {
          const listDetails = definition.getListDetails?.(record);

          return (
            <article
              key={record.id}
              className="relative flex h-28 items-stretch gap-3 rounded-record odd:bg-foreground/5 sm:h-32 sm:gap-4"
            >
              <div className="relative h-full w-20 shrink-0 overflow-hidden rounded-l-record bg-surface sm:w-28">
                <RecordImage source={definition.getImageUrl?.(record) ?? null} />
              </div>
              <div className="flex min-w-0 flex-1 items-center">
                <div className="min-w-0 flex-1 overflow-hidden">
                  <h3 className="truncate text-sm font-medium sm:text-base">
                    {definition.getTitle(record)}
                  </h3>
                  {listDetails ? (
                    <p className="mt-2 flex min-w-0 items-center gap-x-2 overflow-hidden text-xs text-muted">
                      {listDetails.code !== undefined ? (
                        <span className="shrink-0">
                          Código: {listDetails.code}
                        </span>
                      ) : null}
                      {listDetails.stockTracked !== false && listDetails.stockStatus ? (
                        <CatalogAdminStockIndicator
                          status={listDetails.stockStatus}
                        />
                      ) : null}
                      {listDetails.existence !== undefined ? (
                        <span className="truncate">
                          · Existencia: {listDetails.existence}
                        </span>
                      ) : null}
                    </p>
                  ) : definition.getSummary ? (
                    <p className="mt-2 truncate text-xs text-muted">
                      {definition.getSummary(record)}
                    </p>
                  ) : null}
                </div>
                <div className="ml-2 flex h-full shrink-0 items-center gap-2">
                  {listDetails?.price !== undefined && listDetails.price !== null ? (
                    <p className="whitespace-nowrap text-xs font-semibold text-foreground sm:text-sm">
                      {listDetails.price}
                    </p>
                  ) : null}
                  <CatalogRecordOptionsMenu
                    recordName={definition.getTitle(record)}
                    onEdit={() => onEdit(record)}
                    onDelete={() => onDelete(record)}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mt-6 divide-y divide-border">
      {records.map((record) => {
        const listDetails = definition.getListDetails?.(record);

        return (
          <article
            key={record.id}
            className="relative flex items-center gap-4 rounded-record py-4 odd:bg-foreground/5 first:pt-0 last:pb-0"
          >
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-medium">{definition.getTitle(record)}</h3>
              {definition.presentation === "article" && listDetails ? (
                <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                  {listDetails.code !== undefined ? (
                    <span>Código: {listDetails.code}</span>
                  ) : null}
                  {listDetails.stockTracked !== false && listDetails.stockStatus ? (
                    <CatalogAdminStockIndicator status={listDetails.stockStatus} />
                  ) : null}
                  {listDetails.existence !== undefined ? (
                    <span>· Existencia: {listDetails.existence}</span>
                  ) : null}
                </p>
              ) : definition.presentation === "article" && definition.getSummary ? (
                <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                  {definition.getSummary(record)}
                </p>
              ) : null}
              {definition.presentation === "rows" && definition.getSubtitle?.(record) ? (
                <p className="mt-1 text-xs text-muted">
                  {definition.getSubtitle(record)}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {listDetails?.price !== undefined && listDetails.price !== null ? (
                <p className="whitespace-nowrap text-sm font-semibold text-foreground">
                  {listDetails.price}
                </p>
              ) : null}
              <CatalogRecordOptionsMenu
                recordName={definition.getTitle(record)}
                onEdit={() => onEdit(record)}
                onDelete={() => onDelete(record)}
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}

function CatalogAdminStockIndicator({
  status,
}: {
  status: CatalogAdminStockStatus;
}) {
  const statusLabels: Record<CatalogAdminStockStatus, string> = {
    red: "Existencia cero o negativa",
    yellow: "Existencia menor o igual al mínimo",
    green: "Existencia mayor al mínimo o coincidencia entre mínimo y máximo",
  };
  const statusColors: Record<CatalogAdminStockStatus, string> = {
    red: "bg-stock-low",
    yellow: "bg-stock-warning",
    green: "bg-stock-high",
  };

  return (
    <span
      role="img"
      aria-label={statusLabels[status]}
      title={statusLabels[status]}
      className={`size-3 shrink-0 rounded-pill ${statusColors[status]}`}
    />
  );
}

function RecordImage({ source }: { source: string | null }) {
  const [hasError, setHasError] = useState(false);
  if (!source || hasError) {
    return (
      <Image
        src={InvisibleImage}
        alt=""
        aria-hidden="true"
        fill
        className="object-cover"
      />
    );
  }
  return (
    <Image
      src={source}
      alt=""
      aria-hidden="true"
      fill
      unoptimized
      className="object-cover"
      onError={() => setHasError(true)}
    />
  );
}

function CatalogAdminEditDialog<T extends CatalogAdminRecord>({
  definition,
  record,
  onClose,
  onSave,
}: {
  definition: CatalogAdminDefinition<T>;
  record: T;
  onClose: () => void;
  onSave: (values: CatalogAdminValues, image: File | null) => Promise<void>;
}) {
  const [values, setValues] = useState(() => definition.getInitialValues(record));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function updateValue(id: string, value: CatalogAdminValue) {
    setValues((current) => ({ ...current, [id]: value }));
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    setError(null);
    if (imageFile && imageFile.size > MAX_CATALOG_RECORD_IMAGE_SIZE_BYTES) {
      setError("La imagen no puede superar los 50 MB.");
      return;
    }
    if (
      imageFile &&
      !ACCEPTED_CATALOG_RECORD_IMAGE_MIME_TYPES.includes(
        imageFile.type as (typeof ACCEPTED_CATALOG_RECORD_IMAGE_MIME_TYPES)[number],
      )
    ) {
      setError("La imagen debe estar en formato PNG, JPG o WebP.");
      return;
    }
    setIsSaving(true);
    try {
      await onSave(values, imageFile);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar el registro.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <DialogShell
      title={`Editar ${definition.getTitle(record)}`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {definition.getImageUrl && definition.updateRecordWithImage ? (
          <CatalogAdminImageField
            currentImageUrl={definition.getImageUrl(record)}
            file={imageFile}
            onFileChange={setImageFile}
          />
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          {definition.fields.map((field) => (
            <Input
              key={field.id}
              id={`catalog-${field.id}`}
              label={field.label}
              type={field.type}
              value={String(values[field.id] ?? "")}
              required={field.required}
              maxLength={field.maxLength}
              step={field.type === "number" ? 1 : undefined}
              onChange={(event) => updateValue(field.id, event.currentTarget.value)}
            />
          ))}
        </div>

        {definition.checkboxes?.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {definition.checkboxes.map((checkbox) => (
              <label
                key={checkbox.id}
                className="flex items-center gap-3 text-sm text-foreground"
              >
                <input
                  type="checkbox"
                  checked={Boolean(values[checkbox.id])}
                  onChange={(event) =>
                    updateValue(checkbox.id, event.currentTarget.checked)
                  }
                  className="size-4 rounded border-border accent-brand"
                />
                {checkbox.label}
              </label>
            ))}
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="h-11 rounded-button border border-border px-4 text-sm font-medium transition hover:bg-surface-raised disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="h-11 rounded-button bg-brand px-5 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </DialogShell>
  );
}

function CatalogAdminDeleteDialog({
  recordName,
  onClose,
  onDelete,
}: {
  recordName: string;
  onClose: () => void;
  onDelete: () => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (isDeleting) return;
    setError(null);
    setIsDeleting(true);
    try {
      await onDelete();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo eliminar el registro.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <DialogShell title="Eliminar registro" onClose={onClose}>
      <p className="text-sm leading-6 text-muted">
        ¿Querés eliminar <strong className="font-semibold text-foreground">{recordName}</strong>?
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
          disabled={isDeleting}
          className="h-11 rounded-button border border-border px-4 text-sm font-medium transition hover:bg-surface-raised disabled:opacity-60"
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

function CatalogRecordOptionsMenu({
  recordName,
  placement = "inline",
  onEdit,
  onDelete,
}: {
  recordName: string;
  placement?: "inline" | "corner";
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useDismissLayer(menuRef, () => setIsOpen(false), isOpen);

  return (
    <div
      ref={menuRef}
      className={
        placement === "corner"
          ? "absolute right-3 top-3 z-30"
          : "relative z-50 shrink-0"
      }
    >
      <button
        type="button"
        aria-label={`Opciones de ${recordName}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="flex size-10 items-center justify-center rounded-button text-foreground transition hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="size-5">
          <circle cx="12" cy="5" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="12" cy="19" r="1.6" />
        </svg>
      </button>
      {isOpen ? (
        <div role="menu" className="absolute right-0 top-12 w-44 rounded-card border border-border bg-surface p-1 shadow-xl">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onEdit();
            }}
            className="w-full rounded-button px-3 py-2 text-left text-sm transition hover:bg-surface-raised"
          >
            Editar
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onDelete();
            }}
            className="w-full rounded-button px-3 py-2 text-left text-sm text-danger transition hover:bg-danger/10"
          >
            Eliminar
          </button>
        </div>
      ) : null}
    </div>
  );
}
