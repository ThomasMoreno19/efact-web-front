"use client";

import { Check, X } from "lucide-react";
import { DialogShell } from "@/components/ui/dialog-shell";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastType = "success" | "error";

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
  details: string[];
}

interface ToastDetails {
  message: string;
  details: string[];
}

type ToastContextValue = (message: string, type: ToastType) => void;

const ToastContext = createContext<ToastContextValue | null>(null);

export function StatusToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [detailsDialog, setDetailsDialog] = useState<ToastDetails | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const nextId = useRef(0);
  const exitTimer = useRef<number | null>(null);
  const pulseStartTimer = useRef<number | null>(null);
  const pulseEndTimer = useRef<number | null>(null);

  const dismissToast = useCallback(() => {
    if (pulseStartTimer.current !== null) {
      window.clearTimeout(pulseStartTimer.current);
      pulseStartTimer.current = null;
    }
    if (pulseEndTimer.current !== null) {
      window.clearTimeout(pulseEndTimer.current);
      pulseEndTimer.current = null;
    }
    setIsPulsing(false);
    if (exitTimer.current !== null) {
      window.clearTimeout(exitTimer.current);
    }
    setIsVisible(false);
    exitTimer.current = window.setTimeout(() => {
      setToast(null);
      exitTimer.current = null;
    }, 500);
  }, []);

  const showToast = useCallback((message: string, type: ToastType) => {
    if (exitTimer.current !== null) {
      window.clearTimeout(exitTimer.current);
      exitTimer.current = null;
    }
    nextId.current += 1;
    setIsVisible(false);
    setIsPulsing(false);
    const lines = message
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const hasDetails = type === "error" && lines.length > 1;
    setToast({
      id: nextId.current,
      message: hasDetails ? lines[0] ?? message : message,
      type,
      details: hasDetails ? lines.slice(1) : [],
    });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const animationFrame = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });
    if (toast.type === "error") {
      pulseStartTimer.current = window.setTimeout(() => {
        pulseStartTimer.current = null;
        setIsPulsing(true);
        pulseEndTimer.current = window.setTimeout(() => {
          pulseEndTimer.current = null;
          setIsPulsing(false);
        }, 500);
      }, 500);
    }
    const timeout = window.setTimeout(
      dismissToast,
      toast.type === "error" ? 10_000 : 5_000,
    );
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(timeout);
      if (pulseStartTimer.current !== null) {
        window.clearTimeout(pulseStartTimer.current);
        pulseStartTimer.current = null;
      }
      if (pulseEndTimer.current !== null) {
        window.clearTimeout(pulseEndTimer.current);
        pulseEndTimer.current = null;
      }
    };
  }, [dismissToast, toast]);

  useEffect(
    () => () => {
      if (exitTimer.current !== null) window.clearTimeout(exitTimer.current);
    },
    [],
  );

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast ? (
        <div
          className={`pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex justify-center px-4 transition-all duration-500 ease-out motion-reduce:transition-none sm:bottom-6 ${
            isVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-full opacity-0"
          }`}
        >
          <div
            role={toast.type === "error" ? "alert" : "status"}
            aria-live={toast.type === "error" ? "assertive" : "polite"}
            aria-atomic="true"
            className={`pointer-events-auto max-w-xl rounded-card border bg-surface text-sm text-foreground shadow-xl ${
              toast.type === "error"
                ? `border-danger/50 ${isPulsing ? "motion-safe:animate-[status-toast-error-pulse_500ms_ease-in-out_1]" : ""}`
                : "border-success/50"
            }`}
          >
            <div className="flex items-center gap-3 px-5 py-4">
              <button
                type="button"
                onClick={dismissToast}
                aria-label={`Cerrar aviso: ${toast.message}`}
                className="flex min-w-0 flex-1 items-start gap-3 rounded-button text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-success"
              >
                {toast.type === "success" ? (
                  <Check
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0 text-success"
                    strokeWidth={2.5}
                  />
                ) : (
                  <X
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0 text-danger"
                    strokeWidth={2.5}
                  />
                )}
                <span className="leading-5">{toast.message}</span>
              </button>
              {toast.details.length > 0 ? (
                <button
                  type="button"
                  onClick={() =>
                    setDetailsDialog({
                      message: toast.message,
                      details: toast.details,
                    })
                  }
                  className="shrink-0 rounded-button px-2 py-1 text-xs font-semibold text-foreground underline underline-offset-2 transition hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  Ver detalles
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      {detailsDialog ? (
        <DialogShell
          title="Detalles del error"
          onClose={() => setDetailsDialog(null)}
        >
          <p className="text-sm font-medium text-foreground">
            {detailsDialog.message}
          </p>
          <ul className="mt-4 max-h-[50vh] list-disc space-y-2 overflow-y-auto pl-5 text-sm leading-6 text-muted">
            {detailsDialog.details.map((detail, index) => (
              <li key={`${index}-${detail}`}>{detail}</li>
            ))}
          </ul>
        </DialogShell>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useStatusToast(): ToastContextValue {
  const showToast = useContext(ToastContext);
  if (!showToast) {
    throw new Error("useStatusToast debe usarse dentro de StatusToastProvider.");
  }
  return showToast;
}
