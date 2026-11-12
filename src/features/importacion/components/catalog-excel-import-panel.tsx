"use client";

import { fetchWithAdminSession } from "@/features/auth/services/auth-client.service";
import { ExcelSyncConfirmationDialog } from "@/components/ui/excel-sync-confirmation-dialog";
import { useStatusToast } from "@/components/ui/status-toast";
import {
  formatExcelImportApiError,
  type ExcelImportApiError,
} from "@/services/format-excel-import-error";
import type { ChangeEvent } from "react";
import { useRef, useState } from "react";

type ImportMode = "actualizar" | "sincronizar";

interface ImportResponse {
  processed?: Record<string, number>;
  deleted?: Record<string, number>;
  equiposEliminados?: number;
}

interface ImportPreview {
  articulosBd: number;
  articulosExcel: number;
}

const MAX_EXCEL_BYTES = 50 * 1024 * 1024;

export function CatalogExcelImportPanel({
  empresaId,
  excelDisabled,
  onImportSuccess,
}: {
  empresaId: number;
  excelDisabled: boolean;
  onImportSuccess?: () => void;
}) {
  const showStatusToast = useStatusToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const pendingMode = useRef<ImportMode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreparingConfirmation, setIsPreparingConfirmation] = useState(false);
  const [syncConfirmationOpen, setSyncConfirmationOpen] = useState(false);
  const [syncConfirmationWord, setSyncConfirmationWord] = useState("");
  const [syncFile, setSyncFile] = useState<File | null>(null);
  const [syncPreview, setSyncPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  function selectFile(mode: ImportMode) {
    if (isSubmitting || isPreparingConfirmation || excelDisabled) return;

    setError(null);
    pendingMode.current = mode;
    if (fileInput.current) fileInput.current.click();
  }

  async function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    const mode = pendingMode.current;
    pendingMode.current = null;

    if (!file || !mode) return;
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (mode === "sincronizar") {
      await prepareSyncConfirmation(file);
      return;
    }

    await runImport(file, mode);
  }

  async function prepareSyncConfirmation(file: File) {
    setIsPreparingConfirmation(true);
    setError(null);
    setSyncConfirmationWord("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetchWithAdminSession(
        `/api/empresas/${empresaId}/excel/preview`,
        {
          method: "POST",
          body: formData,
        },
      );
      const payload = (await response.json().catch(() => null)) as
        | ImportPreview
        | ExcelImportApiError
        | null;

      if (!response.ok) {
        setError(formatExcelImportApiError(payload as ExcelImportApiError | null, "No se pudo procesar el archivo Excel."));
        return;
      }

      const preview = payload as ImportPreview | null;
      if (
        !preview ||
        !Number.isInteger(preview.articulosBd) ||
        !Number.isInteger(preview.articulosExcel)
      ) {
        setError("No se pudo obtener el resumen de artículos del Excel.");
        return;
      }

      setSyncFile(file);
      setSyncPreview(preview);
      setSyncConfirmationOpen(true);
    } catch {
      setError("No se pudo conectar con el servidor para revisar el Excel.");
    } finally {
      setIsPreparingConfirmation(false);
    }
  }

  async function runImport(file: File, mode: ImportMode) {
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", mode);

    try {
      const response = await fetchWithAdminSession(
        `/api/empresas/${empresaId}/excel`,
        {
          method: "POST",
          body: formData,
        },
      );
      const payload = (await response.json().catch(() => null)) as
        | ImportResponse
        | ExcelImportApiError
        | null;

      if (!response.ok) {
        showStatusToast(formatExcelImportApiError(payload as ExcelImportApiError | null, "No se pudo procesar el archivo Excel."), "error");
        return;
      }

      showStatusToast(formatImportResult(payload as ImportResponse | null, mode), "success");
      if (mode === "sincronizar") {
        setSyncConfirmationOpen(false);
        setSyncConfirmationWord("");
        setSyncFile(null);
        setSyncPreview(null);
      }
      onImportSuccess?.();
    } catch {
      showStatusToast("No se pudo conectar con el servidor para cargar el Excel.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmSync() {
    if (!syncFile || isSubmitting) return;
    await runImport(syncFile, "sincronizar");
  }

  function closeSyncConfirmation() {
    if (isSubmitting) return;
    setSyncConfirmationOpen(false);
    setSyncConfirmationWord("");
    setSyncFile(null);
    setSyncPreview(null);
  }

  const articleDifference = syncPreview
    ? Math.abs(syncPreview.articulosExcel - syncPreview.articulosBd)
    : 0;
  const articleDifferenceMessage = syncPreview
    ? syncPreview.articulosExcel > syncPreview.articulosBd
      ? `Se agregarán ${articleDifference.toLocaleString("es-AR")} artículos.`
      : syncPreview.articulosExcel < syncPreview.articulosBd
        ? `Se eliminarán ${articleDifference.toLocaleString("es-AR")} artículos.`
        : "Se mantendrá la misma cantidad de artículos."
    : null;

  return (
    <section className="rounded-card border border-border bg-surface p-6 sm:p-8">
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold">Sincronización de datos</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            El mismo archivo Excel actualiza los datos de artículos, rubros,
            proveedores, marcas, clientes y ubicaciones.
          </p>
          {excelDisabled ? (
            <p className="mt-3 text-sm text-muted">
              Las cargas de Excel están deshabilitadas para esta empresa.
            </p>
          ) : null}
        </div>
        <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row">
          <button
            type="button"
            disabled={isSubmitting || isPreparingConfirmation || excelDisabled}
            onClick={() => selectFile("sincronizar")}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-button border border-border px-5 text-sm font-semibold transition hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UploadIcon />
            Sincronizar Excel
          </button>
          <button
            type="button"
            disabled={isSubmitting || isPreparingConfirmation || excelDisabled}
            onClick={() => selectFile("actualizar")}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-button bg-brand px-5 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UploadIcon />
            Actualizar Excel
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          aria-label="Seleccionar archivo Excel"
          onChange={handleFileSelection}
        />
      </div>

      {isSubmitting ? (
        <p role="status" className="mt-5 text-sm text-muted">
          Procesando el archivo Excel…
        </p>
      ) : null}
      {isPreparingConfirmation ? (
        <p role="status" className="mt-5 text-sm text-muted">
          Revisando los artículos del Excel…
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="mt-5 whitespace-pre-line rounded-button border border-danger/40 bg-danger/10 p-3 text-sm"
        >
          {error}
        </p>
      ) : null}
      {syncConfirmationOpen && syncPreview ? (
        <ExcelSyncConfirmationDialog
          confirmationWord={syncConfirmationWord}
          error={error}
          isSubmitting={isSubmitting}
          onCancel={closeSyncConfirmation}
          onConfirmationWordChange={setSyncConfirmationWord}
          onConfirm={confirmSync}
          warning={
            <>
              <p>
                La sincronización reemplazará los registros de artículos,
                rubros, proveedores, marcas, clientes y ubicaciones por los del
                Excel.
              </p>
              <p>
                Se <span className="text-brand">eliminarán</span> los registros
                que no estén incluidos en el archivo.
              </p>
            </>
          }
        >
          <div className="space-y-2 rounded-button border border-border bg-surface-raised p-4 text-sm">
            <p className="border-b border-border pb-2 font-bold">
              Archivo seleccionado: {syncFile?.name}
            </p>
            <p>
              Artículos en la base de datos:{" "}
              {syncPreview.articulosBd.toLocaleString("es-AR")}
            </p>
            <p>
              Artículos en el Excel:{" "}
              {syncPreview.articulosExcel.toLocaleString("es-AR")}
            </p>
            <p className="font-semibold text-foreground">
              {articleDifferenceMessage}
            </p>
          </div>
        </ExcelSyncConfirmationDialog>
      ) : null}
    </section>
  );
}

function validateFile(file: File) {
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return "Seleccioná un archivo de Excel con extensión .xlsx.";
  }
  if (file.size === 0 || file.size > MAX_EXCEL_BYTES) {
    return "El archivo no puede superar los 50 MB.";
  }
  return null;
}

function formatImportResult(payload: ImportResponse | null, mode: ImportMode) {
  const processed = Object.entries(payload?.processed ?? {})
    .map(([entity, count]) => `${entity}: ${count}`)
    .join(", ");
  const deleted = Object.entries(payload?.deleted ?? {})
    .map(([entity, count]) => `${entity}: ${count}`)
    .join(", ");
  const verb = mode === "sincronizar" ? "Sincronización" : "Actualización";
  const summary = [`${verb} completada.`];
  if (processed) summary.push(`Procesados — ${processed}.`);
  if (deleted) summary.push(`Eliminados — ${deleted}.`);
  if (payload?.equiposEliminados) {
    summary.push(`Equipos eliminados: ${payload.equiposEliminados}.`);
  }
  return summary.join(" ");
}

function UploadIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
    >
      <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V14" />
    </svg>
  );
}
