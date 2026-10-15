'use client';

import { Barcode, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { IScannerControls } from '@zxing/browser';

export function BarcodeScannerButton({
  onDetected,
  className = '',
}: {
  onDetected: (value: string) => void;
  className?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const onDetectedRef = useRef(onDetected);
  const [isOpen, setIsOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  onDetectedRef.current = onDetected;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let isActive = true;
    const video = videoRef.current;
    if (!video) return;

    setError(null);
    setIsStarting(true);

    async function startScanner() {
      try {
        const { BrowserMultiFormatOneDReader } = await import('@zxing/browser');
        if (!isActive) return;
        const reader = new BrowserMultiFormatOneDReader();
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current ?? undefined,
          (result, _scanError, activeControls) => {
            if (!isActive || !result) return;
            const value = result.getText().trim();
            if (!value) return;
            isActive = false;
            activeControls.stop();
            controlsRef.current = null;
            onDetectedRef.current(value);
            setIsOpen(false);
          },
        );
        if (!isActive) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setIsStarting(false);
      } catch (cause) {
        if (!isActive) return;
        setIsStarting(false);
        setError(getCameraError(cause));
      }
    }

    void startScanner();

    return () => {
      isActive = false;
      controlsRef.current?.stop();
      controlsRef.current = null;
      const stream = video.srcObject;
      if (stream instanceof MediaStream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      video.srcObject = null;
    };
  }, [isOpen]);

  function closeScanner() {
    setIsOpen(false);
    setError(null);
  }

  return (
    <>
      <button
        type="button"
        aria-label="Escanear código de barras"
        title="Escanear código de barras"
        onClick={() => setIsOpen(true)}
        className={`flex size-10 shrink-0 items-center justify-center rounded-button border border-border bg-surface text-muted transition hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${className}`}
      >
        <Barcode aria-hidden="true" className="size-5" />
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="barcode-scanner-title"
        onCancel={(event) => {
          event.preventDefault();
          closeScanner();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeScanner();
        }}
        className="m-auto max-h-[min(90vh,42rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto overscroll-contain border-0 bg-transparent p-0 text-foreground backdrop:bg-black/75"
      >
        <section className="rounded-card border border-border bg-surface p-5 shadow-2xl sm:p-7">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 id="barcode-scanner-title" className="text-lg font-semibold">
                Escanear código de barras
              </h2>
              <p className="mt-1 text-sm text-muted">
                Apuntá la cámara al código del artículo.
              </p>
            </div>
            <button
              type="button"
              onClick={closeScanner}
              aria-label="Cerrar escáner"
              className="flex size-9 shrink-0 items-center justify-center rounded-button text-muted transition hover:bg-surface-raised hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>

          <div className="relative aspect-video overflow-hidden rounded-record bg-black">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="size-full object-cover"
            />
            {isStarting ? (
              <p
                role="status"
                className="absolute inset-x-0 bottom-0 bg-black/70 px-3 py-2 text-center text-sm text-white"
              >
                Iniciando cámara…
              </p>
            ) : null}
          </div>

          {error ? (
            <p role="alert" className="mt-3 text-sm text-danger">
              {error}
            </p>
          ) : null}

        </section>
      </dialog>
    </>
  );
}

function getCameraError(cause: unknown) {
  if (cause instanceof DOMException && cause.name === 'NotAllowedError') {
    return 'No se concedió permiso para usar la cámara.';
  }
  if (cause instanceof DOMException && cause.name === 'NotFoundError') {
    return 'No se encontró una cámara disponible en este dispositivo.';
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return 'Este navegador no permite acceder a la cámara.';
  }
  return 'No se pudo iniciar el escáner. Revisá el permiso de la cámara e intentá nuevamente.';
}
