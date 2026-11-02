'use client';

import { Camera, LoaderCircle, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { IScannerControls } from '@zxing/browser';
import type { BarcodeFormat, DecodeHintType } from '@zxing/library';
import {
  estimateBarcodeRegion,
  type BarcodeImageRegion,
} from '@/features/articulo/utils/estimate-barcode-region';

const NATIVE_BARCODE_FORMATS = [
  'codabar',
  'code_39',
  'code_93',
  'code_128',
  'ean_13',
  'ean_8',
  'itf',
  'upc_a',
  'upc_e',
];

interface NativeBarcodeDetection {
  rawValue?: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

interface NativeBarcodeDetector {
  detect(source: CanvasImageSource): Promise<NativeBarcodeDetection[]>;
}

interface NativeBarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): NativeBarcodeDetector;
  getSupportedFormats(): Promise<string[]>;
}

type BarcodeOcrWorker = Awaited<ReturnType<typeof createBarcodeOcrWorker>>;
type BarcodeOcrPage = Awaited<ReturnType<BarcodeOcrWorker['recognize']>>['data'];
type BarcodeOcrStatus = 'idle' | 'loading' | 'ready' | 'unavailable';

export function BarcodeScannerButton({
  onDetected,
  className = '',
}: {
  onDetected: (value: string) => void;
  className?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanGuideRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const cameraRequestRef = useRef<Promise<MediaStream> | null>(null);
  const onDetectedRef = useRef(onDetected);
  const barcodeRegionRef = useRef<BarcodeRegionEstimate | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<BarcodeOcrStatus>('idle');
  const [barcodeRegion, setBarcodeRegion] = useState<BarcodeRegionEstimate | null>(null);

  onDetectedRef.current = onDetected;

  function updateBarcodeRegion(region: BarcodeRegionEstimate | null) {
    barcodeRegionRef.current = region;
    setBarcodeRegion(region);
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const cameraRequestValue = cameraRequestRef.current;
    if (!cameraRequestValue) return;
    const cameraRequest = cameraRequestValue as Promise<MediaStream>;
    cameraRequestRef.current = null;

    let isActive = true;
    let stream: MediaStream | null = null;
    let previewTimeout: ReturnType<typeof setTimeout> | null = null;
    let nativeScanTimeout: ReturnType<typeof setTimeout> | null = null;
    let nativeFallbackTimeout: ReturnType<typeof setTimeout> | null = null;
    let barcodeRegionTimeout: ReturnType<typeof setTimeout> | null = null;
    let ocrTimeout: ReturnType<typeof setTimeout> | null = null;
    let ocrWorker: BarcodeOcrWorker | null = null;
    let ocrWorkerPromise: Promise<BarcodeOcrWorker> | null = null;
    let isOcrRunning = false;
    let isOcrUnavailable = false;
    let nativeScanActive = false;
    let zxingScannerStarted = false;
    let hasVideoStarted = false;
    let lastBarcodeRegionAt = 0;
    const videoValue = videoRef.current;
    if (!videoValue) {
      void cameraRequest.then((requestedStream) => {
        requestedStream.getTracks().forEach((track) => track.stop());
      }).catch(() => undefined);
      return;
    }
    const video = videoValue as HTMLVideoElement;
    const barcodeRegionCanvas = document.createElement('canvas');
    const barcodeRegionContext = barcodeRegionCanvas.getContext('2d', {
      willReadFrequently: true,
    });
    const nativeBarcodeCanvas = document.createElement('canvas');
    const nativeBarcodeContext = nativeBarcodeCanvas.getContext('2d', {
      willReadFrequently: true,
    });
    const ocrCanvas = document.createElement('canvas');
    const ocrContext = ocrCanvas.getContext('2d', { willReadFrequently: true });

    function stopOcrWorker() {
      if (ocrTimeout) clearTimeout(ocrTimeout);
      const worker = ocrWorker;
      ocrWorker = null;
      if (worker) void worker.terminate().catch(() => undefined);
    }

    function scanForBarcodeRegion() {
      if (!isActive) return;
      const sourceWidth = video.videoWidth;
      const sourceHeight = video.videoHeight;
      if (sourceWidth > 0 && sourceHeight > 0 && barcodeRegionContext) {
        const scanRegion = getScanRegion(
          video,
          scanGuideRef.current,
          sourceWidth,
          sourceHeight,
        );
        if (scanRegion.width <= 0 || scanRegion.height <= 0) {
          updateBarcodeRegion(null);
          barcodeRegionTimeout = setTimeout(scanForBarcodeRegion, 180);
          return;
        }
        const analysisWidth = Math.max(1, Math.min(720, Math.round(scanRegion.width)));
        const scale = analysisWidth / scanRegion.width;
        const analysisHeight = Math.max(1, Math.round(scanRegion.height * scale));
        if (barcodeRegionCanvas.width !== analysisWidth) {
          barcodeRegionCanvas.width = analysisWidth;
        }
        if (barcodeRegionCanvas.height !== analysisHeight) {
          barcodeRegionCanvas.height = analysisHeight;
        }

        try {
          barcodeRegionContext.drawImage(
            video,
            scanRegion.left,
            scanRegion.top,
            scanRegion.width,
            scanRegion.height,
            0,
            0,
            analysisWidth,
            analysisHeight,
          );
          const image = barcodeRegionContext.getImageData(
            0,
            0,
            analysisWidth,
            analysisHeight,
          );
          const candidate = estimateBarcodeRegion(image);
          if (candidate) {
            lastBarcodeRegionAt = Date.now();
            updateBarcodeRegion({
              left: scanRegion.left + candidate.left / scale,
              top: scanRegion.top + candidate.top / scale,
              width: candidate.width / scale,
              height: candidate.height / scale,
              sourceWidth,
              sourceHeight,
              source: 'pattern',
            });
          } else if (Date.now() - lastBarcodeRegionAt > 600) {
            updateBarcodeRegion(null);
          }
        } catch {
          if (Date.now() - lastBarcodeRegionAt > 600) updateBarcodeRegion(null);
        }
      } else {
        updateBarcodeRegion(null);
      }
      barcodeRegionTimeout = setTimeout(scanForBarcodeRegion, 180);
    }

    async function scanBarcodeDigits() {
      if (!isActive || isOcrUnavailable || isOcrRunning || !ocrContext) return;
      isOcrRunning = true;
      try {
        if (!ocrWorkerPromise) {
          setOcrStatus('loading');
          ocrWorkerPromise = createBarcodeOcrWorker();
        }
        const worker = ocrWorker ?? await ocrWorkerPromise;
        if (!isActive) {
          await worker.terminate().catch(() => undefined);
          return;
        }
        ocrWorker = worker;
        setOcrStatus('ready');

        const sourceWidth = video.videoWidth;
        const sourceHeight = video.videoHeight;
        if (sourceWidth <= 0 || sourceHeight <= 0) return;
        const scanRegion = getScanRegion(
          video,
          scanGuideRef.current,
          sourceWidth,
          sourceHeight,
        );
        if (scanRegion.width <= 0 || scanRegion.height <= 0) return;

        const analysisWidth = Math.max(960, Math.min(1600, Math.round(scanRegion.width)));
        const scale = analysisWidth / scanRegion.width;
        const analysisHeight = Math.max(1, Math.round(scanRegion.height * scale));
        if (ocrCanvas.width !== analysisWidth) ocrCanvas.width = analysisWidth;
        if (ocrCanvas.height !== analysisHeight) ocrCanvas.height = analysisHeight;
        ocrContext.drawImage(
          video,
          scanRegion.left,
          scanRegion.top,
          scanRegion.width,
          scanRegion.height,
          0,
          0,
          analysisWidth,
          analysisHeight,
        );

        const { data } = await worker.recognize(
          ocrCanvas,
          {},
          { text: true, blocks: true },
        );
        if (!isActive) return;
        const candidate = findBarcodeDigitsCandidate(data);
        if (candidate && candidate.confidence >= 35) {
          const estimatedRegion = getBarcodeRegionFromOcrCandidate(
            candidate,
            scanRegion,
            scale,
          );
          updateBarcodeRegion({
            ...estimatedRegion,
            sourceWidth,
            sourceHeight,
            source: 'digits',
          });
          if (
            candidate.confidence >= 78 ||
            (candidate.confidence >= 45 && hasValidGs1CheckDigit(candidate.value))
          ) {
            handleBarcodeDetected(candidate.value);
          }
        }
      } catch {
        if (isActive && !ocrWorker) {
          isOcrUnavailable = true;
          setOcrStatus('unavailable');
        }
      } finally {
        isOcrRunning = false;
        if (isActive && !isOcrUnavailable) {
          ocrTimeout = setTimeout(scanBarcodeDigits, 1200);
        }
      }
    }

    function handleVideoPlaying() {
      if (!isActive || video.videoWidth === 0 || video.videoHeight === 0) return;
      hasVideoStarted = true;
      if (previewTimeout) clearTimeout(previewTimeout);
      setIsStarting(false);
      setIsCameraActive(true);
      setError(null);
    }

    video.addEventListener('playing', handleVideoPlaying);
    video.addEventListener('loadeddata', handleVideoPlaying);

    function handleBarcodeDetected(value: string, controls?: IScannerControls) {
      if (!isActive) return;
      isActive = false;
      nativeScanActive = false;
      if (nativeScanTimeout) clearTimeout(nativeScanTimeout);
      if (nativeFallbackTimeout) clearTimeout(nativeFallbackTimeout);
      if (barcodeRegionTimeout) clearTimeout(barcodeRegionTimeout);
      stopOcrWorker();
      if (controls) controls.stop();
      else controlsRef.current?.stop();
      controlsRef.current = null;
      setIsCameraActive(false);
      updateBarcodeRegion(null);
      onDetectedRef.current(value);
      setIsOpen(false);
    }

    function handleScannerError(cause: unknown) {
      if (!isActive) return;
      isActive = false;
      nativeScanActive = false;
      if (previewTimeout) clearTimeout(previewTimeout);
      if (nativeScanTimeout) clearTimeout(nativeScanTimeout);
      if (nativeFallbackTimeout) clearTimeout(nativeFallbackTimeout);
      if (barcodeRegionTimeout) clearTimeout(barcodeRegionTimeout);
      stopOcrWorker();
      updateBarcodeRegion(null);
      controlsRef.current?.stop();
      controlsRef.current = null;
      setIsStarting(false);
      setIsCameraActive(false);
      stream?.getTracks().forEach((track) => track.stop());
      if (video.srcObject instanceof MediaStream) video.srcObject = null;
      setError(getCameraError(cause));
    }

    async function startNativeScanner(): Promise<boolean> {
      const Detector = (
        window as Window & { BarcodeDetector?: NativeBarcodeDetectorConstructor }
      ).BarcodeDetector;
      if (!Detector) return false;

      try {
        const supportedFormats = await Detector.getSupportedFormats();
        const formats = NATIVE_BARCODE_FORMATS.filter((format) =>
          supportedFormats.includes(format),
        );
        if (!isActive || formats.length === 0) return false;

        const detector = new Detector({ formats });
        nativeScanActive = true;

        async function scanFrame() {
          if (!isActive || !nativeScanActive) return;
          try {
            const scanRegion = getScanRegion(
              video,
              scanGuideRef.current,
              video.videoWidth,
              video.videoHeight,
            );
            const candidateRegion = getExpandedBarcodeRegion(
              barcodeRegionRef.current,
              scanRegion,
              video.videoWidth,
              video.videoHeight,
            );
            let value: string | undefined;

            if (candidateRegion && nativeBarcodeContext) {
              const width = Math.max(1, Math.round(candidateRegion.width));
              const height = Math.max(1, Math.round(candidateRegion.height));
              if (nativeBarcodeCanvas.width !== width) nativeBarcodeCanvas.width = width;
              if (nativeBarcodeCanvas.height !== height) nativeBarcodeCanvas.height = height;
              try {
                nativeBarcodeContext.drawImage(
                  video,
                  candidateRegion.left,
                  candidateRegion.top,
                  candidateRegion.width,
                  candidateRegion.height,
                  0,
                  0,
                  width,
                  height,
                );
                const candidateDetections = await detector.detect(nativeBarcodeCanvas);
                value = candidateDetections
                  .filter((detection) => detection.rawValue?.trim())
                  .sort(
                    (first, second) =>
                      getBoundingBoxDistance(first.boundingBox, {
                        left: 0,
                        top: 0,
                        width,
                        height,
                      }) -
                      getBoundingBoxDistance(second.boundingBox, {
                        left: 0,
                        top: 0,
                        width,
                        height,
                      }),
                  )[0]?.rawValue?.trim();
              } catch {}
            }

            if (!isActive || !nativeScanActive) return;
            if (!value) {
              const detections = await detector.detect(video);
              if (!isActive || !nativeScanActive) return;
              value = detections
                .filter((detection) => detection.rawValue?.trim())
                .filter((detection) =>
                  isBarcodeInScanRegion(detection.boundingBox, scanRegion),
                )
                .sort(
                  (first, second) =>
                    getBoundingBoxDistance(first.boundingBox, scanRegion) -
                    getBoundingBoxDistance(second.boundingBox, scanRegion),
                )[0]?.rawValue?.trim();
            }
            if (value) handleBarcodeDetected(value);
          } catch {
            nativeScanActive = false;
            if (nativeFallbackTimeout) clearTimeout(nativeFallbackTimeout);
            void startZxingScanner();
            return;
          }
          nativeScanTimeout = setTimeout(() => void scanFrame(), 120);
        }

        void scanFrame();
        nativeFallbackTimeout = setTimeout(() => {
          nativeScanActive = false;
          if (nativeScanTimeout) clearTimeout(nativeScanTimeout);
          void startZxingScanner();
        }, 3000);
        return true;
      } catch {
        nativeScanActive = false;
        return false;
      }
    }

    async function startZxingScanner() {
      if (!isActive || zxingScannerStarted) return;
      zxingScannerStarted = true;
      nativeScanActive = false;
      if (nativeScanTimeout) clearTimeout(nativeScanTimeout);
      if (nativeFallbackTimeout) clearTimeout(nativeFallbackTimeout);

      try {
        const [
          {
            BarcodeFormat,
            BrowserMultiFormatOneDReader,
            HTMLCanvasElementLuminanceSource,
          },
          { BinaryBitmap, DecodeHintType, HybridBinarizer },
        ] = await Promise.all([import('@zxing/browser'), import('@zxing/library')]);
        if (!isActive) return;

        class NonRotatingCanvasLuminanceSource extends HTMLCanvasElementLuminanceSource {
          override isRotateSupported() {
            return false;
          }
        }

        const scanCanvas = document.createElement('canvas');
        const scanContextValue = scanCanvas.getContext('2d', { willReadFrequently: true });
        if (!scanContextValue) throw new Error('No se pudo preparar el área de lectura del código.');
        const scanContext = scanContextValue as CanvasRenderingContext2D;

        class ExhaustiveOneDReader extends BrowserMultiFormatOneDReader {
          override decodeFromCanvas(canvas: HTMLCanvasElement) {
            const scanRegion = getScanRegion(
              video,
              scanGuideRef.current,
              canvas.width,
              canvas.height,
            );
            const candidateRegion = getExpandedBarcodeRegion(
              barcodeRegionRef.current,
              scanRegion,
              canvas.width,
              canvas.height,
            );

            const decodeRegion = (region: ScanRegion) => {
              const width = Math.max(1, Math.round(region.width));
              const height = Math.max(1, Math.round(region.height));
              if (scanCanvas.width !== width) scanCanvas.width = width;
              if (scanCanvas.height !== height) scanCanvas.height = height;
              scanContext.clearRect(0, 0, width, height);
              scanContext.drawImage(
                canvas,
                region.left,
                region.top,
                region.width,
                region.height,
                0,
                0,
                width,
                height,
              );
              const source = new NonRotatingCanvasLuminanceSource(scanCanvas);
              return this.decodeBitmap(
                new BinaryBitmap(new HybridBinarizer(source)),
              );
            };

            if (candidateRegion) {
              try {
                return decodeRegion(candidateRegion);
              } catch {}
            }
            return decodeRegion(scanRegion);
          }
        }

        const hints = new Map<DecodeHintType, BarcodeFormat[] | boolean>();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.CODABAR,
          BarcodeFormat.CODE_39,
          BarcodeFormat.CODE_93,
          BarcodeFormat.CODE_128,
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.ITF,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);
        const reader = new ExhaustiveOneDReader(hints, {
          delayBetweenScanAttempts: 250,
          delayBetweenScanSuccess: 250,
        });
        const controls = await reader.decodeFromVideoElement(
          video,
          (result, scanError, activeControls) => {
            if (!isActive) return;
            const scanErrorInfo = scanError ? getScanErrorInfo(scanError) : null;
            if (scanErrorInfo && !isRetryableScanError(scanErrorInfo.kind)) {
              activeControls.stop();
              controlsRef.current = null;
              handleScannerError(
                new Error(
                  `El lector no pudo analizar la imagen (${scanErrorInfo.kind}${scanErrorInfo.message ? `: ${scanErrorInfo.message}` : ''}).`,
                ),
              );
              return;
            }
            if (!result) return;
            const value = result.getText().trim();
            if (!value) return;
            handleBarcodeDetected(value, activeControls);
          },
        );
        if (!isActive) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
      } catch (cause) {
        handleScannerError(cause);
      }
    }

    async function startScanner() {
      try {
        const acquiredStream = await cameraRequest;
        stream = acquiredStream;
        if (!isActive) return;

        video.srcObject = acquiredStream;
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;

        previewTimeout = setTimeout(() => {
          if (!isActive || hasVideoStarted) return;
          handleScannerError(
            new Error(
              'La cámara respondió, pero no se está mostrando imagen. Revisá el permiso de cámara e intentá de nuevo.',
            ),
          );
        }, 12000);

        await video.play();
        if (!isActive) return;
        scanForBarcodeRegion();
        void scanBarcodeDigits();
        await requestContinuousFocus(acquiredStream);
        if (!isActive) return;
        const nativeScannerStarted = await startNativeScanner();
        if (!isActive || nativeScannerStarted) return;
        await startZxingScanner();
      } catch (cause) {
        handleScannerError(cause);
      }
    }

    void startScanner();

    return () => {
      isActive = false;
      nativeScanActive = false;
      if (previewTimeout) clearTimeout(previewTimeout);
      if (nativeScanTimeout) clearTimeout(nativeScanTimeout);
      if (nativeFallbackTimeout) clearTimeout(nativeFallbackTimeout);
      if (barcodeRegionTimeout) clearTimeout(barcodeRegionTimeout);
      stopOcrWorker();
      video.removeEventListener('playing', handleVideoPlaying);
      video.removeEventListener('loadeddata', handleVideoPlaying);
      controlsRef.current?.stop();
      controlsRef.current = null;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      } else {
        void cameraRequest.then((requestedStream) => {
          requestedStream.getTracks().forEach((track) => track.stop());
        }).catch(() => undefined);
      }
      if (video.srcObject instanceof MediaStream) video.srcObject = null;
    };
  }, [isOpen]);

  function openScanner() {
    setError(null);
    setOcrStatus('idle');
    updateBarcodeRegion(null);
    setIsCameraActive(false);
    setIsStarting(true);
    setIsOpen(true);

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setIsStarting(false);
      setError(getCameraError(null));
      return;
    }

    try {
      const preferredCameraRequest = navigator.mediaDevices.getUserMedia({
        audio: false,
        video: getCameraVideoConstraints({ exact: 'environment' }),
      });
      cameraRequestRef.current = preferredCameraRequest.catch((cause) => {
        if (
          cause instanceof DOMException &&
          (cause.name === 'OverconstrainedError' || cause.name === 'NotFoundError')
        ) {
          return navigator.mediaDevices.getUserMedia({
            audio: false,
            video: getCameraVideoConstraints({ ideal: 'environment' }),
          });
        }
        throw cause;
      });
    } catch (cause) {
      setIsStarting(false);
      setError(getCameraError(cause));
    }
  }

  function closeScanner() {
    if (cameraRequestRef.current) {
      void cameraRequestRef.current.then((stream) => {
        stream.getTracks().forEach((track) => track.stop());
      }).catch(() => undefined);
      cameraRequestRef.current = null;
    }
    setIsOpen(false);
    setIsStarting(false);
    setIsCameraActive(false);
    setOcrStatus('idle');
    updateBarcodeRegion(null);
    setError(null);
  }

  async function requestCameraFocus() {
    const stream = videoRef.current?.srcObject;
    if (!(stream instanceof MediaStream)) return;
    const track = stream.getVideoTracks()[0];
    if (!track || typeof track.getCapabilities !== 'function') return;

    try {
      const capabilities = track.getCapabilities() as MediaTrackCapabilities & {
        focusMode?: string[];
      };
      const focusMode = capabilities.focusMode?.includes('single-shot')
        ? 'single-shot'
        : capabilities.focusMode?.includes('continuous')
          ? 'continuous'
          : null;
      if (!focusMode) return;
      await track.applyConstraints({
        advanced: [{ focusMode } as MediaTrackConstraintSet],
      });
    } catch {}
  }

  return (
    <>
      <button
        type="button"
        aria-label="Escanear código de barras"
        title="Escanear código de barras"
        onClick={openScanner}
        className={`flex size-10 shrink-0 items-center justify-center rounded-button text-muted transition hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${className}`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-8 fill-current"
        >
          <g id="Barcode">
            <g>
              <path d="M8.066,4.065H3.648a1.732,1.732,0,0,0-.963.189A1.368,1.368,0,0,0,2.066,5.48v4.585a.5.5,0,0,0,1,0V5.785a1.794,1.794,0,0,1,.014-.518c.077-.236.319-.2.514-.2H8.066a.5.5,0,0,0,0-1Z" />
              <path d="M2.063,13.937v4.418a1.733,1.733,0,0,0,.189.963,1.369,1.369,0,0,0,1.227.619H8.063a.5.5,0,0,0,0-1H3.783a1.831,1.831,0,0,1-.518-.014c-.236-.077-.2-.319-.2-.514V13.937a.5.5,0,0,0-1,0Z" />
              <path d="M15.934,19.935h4.418a1.732,1.732,0,0,0,.963-.189,1.368,1.368,0,0,0,.619-1.226V13.935a.5.5,0,0,0-1,0v4.28a1.794,1.794,0,0,1-.014.518c-.077.236-.319.2-.514.2H15.934a.5.5,0,0,0,0,1Z" />
              <path d="M21.937,10.063V5.645a1.733,1.733,0,0,0-.189-.963,1.369,1.369,0,0,0-1.227-.619H15.937a.5.5,0,0,0,0,1h4.28a1.831,1.831,0,0,1,.518.014c.236.077.2.319.2.514v4.472a.5.5,0,0,0,1,0Z" />
              <g>
                <rect x="10.999" y="7.643" width="1" height="8.709" rx="0.5" />
                <rect x="14.249" y="7.643" width="1" height="8.709" rx="0.5" />
                <rect x="16.499" y="7.643" width="1" height="8.709" rx="0.5" />
                <rect x="6.499" y="7.643" width="1" height="8.709" rx="0.5" />
                <rect x="8.499" y="7.643" width="1.5" height="8.709" rx="0.75" />
              </g>
            </g>
          </g>
        </svg>
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
        className="m-auto w-[calc(100%-2rem)] max-w-xl border-0 bg-transparent p-0 text-foreground backdrop:bg-black/75"
      >
        <section className="rounded-card border border-border bg-surface p-5 shadow-2xl sm:p-7">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 id="barcode-scanner-title" className="text-lg font-semibold">
                Escanear código de barras
              </h2>
              <p className="mt-1 text-sm text-muted">
                Centrá el código en el recuadro. Tocá la imagen para reenfocar.
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

          <div
            onClick={() => void requestCameraFocus()}
            className="relative h-[min(70vh,42rem,calc(100dvh_-_10rem))] w-full overflow-hidden rounded-record bg-black"
          >
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="block size-full object-cover"
            />
            <div
              ref={scanGuideRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-[20.6%] top-1/2 h-[16.8%] -translate-y-1/2 border-2 border-brand/80"
            />
            {barcodeRegion ? (
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 size-full"
                viewBox={`0 0 ${barcodeRegion.sourceWidth} ${barcodeRegion.sourceHeight}`}
                preserveAspectRatio="xMidYMid slice"
              >
                <rect
                  x={barcodeRegion.left + 1}
                  y={barcodeRegion.top + 1}
                  width={barcodeRegion.width - 2}
                  height={barcodeRegion.height - 2}
                  fill="var(--color-stock-high)"
                  fillOpacity="0.12"
                  stroke="var(--color-stock-high)"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            ) : null}
            {isStarting || isCameraActive ? (
              <p
                role="status"
                className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-black/70 px-3 py-2 text-center text-sm text-white"
              >
                {isStarting || ocrStatus === 'loading' ? (
                  <LoaderCircle aria-hidden="true" className="size-4 shrink-0 animate-spin" />
                ) : (
                  <Camera aria-hidden="true" className="size-4 shrink-0" />
                )}
                {isStarting
                  ? 'Solicitando permiso e iniciando cámara…'
                  : barcodeRegion?.source === 'digits'
                    ? 'Dígitos impresos localizados; verificando código…'
                  : barcodeRegion
                      ? 'Zona candidata localizada; intentando leer…'
                      : ocrStatus === 'loading'
                        ? 'Preparando reconocimiento numérico…'
                        : ocrStatus === 'unavailable'
                          ? 'OCR no disponible; buscando un código…'
                          : 'Buscando un código centrado…'}
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

function isRetryableScanError(kind: string) {
  return (
    kind === 'NotFoundException' ||
    kind === 'ChecksumException' ||
    kind === 'FormatException'
  );
}

interface ScanRegion {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface BarcodeRegionEstimate extends BarcodeImageRegion {
  sourceWidth: number;
  sourceHeight: number;
  source: 'pattern' | 'digits';
}

function getScanRegion(
  video: HTMLVideoElement,
  guide: HTMLElement | null,
  sourceWidth: number,
  sourceHeight: number,
): ScanRegion {
  if (!guide || sourceWidth <= 0 || sourceHeight <= 0) {
    return { left: 0, top: 0, width: sourceWidth, height: sourceHeight };
  }

  const videoRect =
    video.parentElement?.getBoundingClientRect() ??
    video.getBoundingClientRect();
  const guideRect = guide.getBoundingClientRect();
  if (videoRect.width <= 0 || videoRect.height <= 0) {
    return { left: 0, top: 0, width: sourceWidth, height: sourceHeight };
  }

  const scale = Math.max(videoRect.width / sourceWidth, videoRect.height / sourceHeight);
  const renderedWidth = sourceWidth * scale;
  const renderedHeight = sourceHeight * scale;
  const offsetX = (renderedWidth - videoRect.width) / 2;
  const offsetY = (renderedHeight - videoRect.height) / 2;
  const left = (guideRect.left - videoRect.left + offsetX) / scale;
  const top = (guideRect.top - videoRect.top + offsetY) / scale;
  const right = left + guideRect.width / scale;
  const bottom = top + guideRect.height / scale;
  const clippedLeft = Math.max(0, Math.min(sourceWidth, left));
  const clippedTop = Math.max(0, Math.min(sourceHeight, top));
  const clippedRight = Math.max(clippedLeft, Math.min(sourceWidth, right));
  const clippedBottom = Math.max(clippedTop, Math.min(sourceHeight, bottom));

  return {
    left: clippedLeft,
    top: clippedTop,
    width: clippedRight - clippedLeft,
    height: clippedBottom - clippedTop,
  };
}

function getExpandedBarcodeRegion(
  candidate: BarcodeRegionEstimate | null,
  scanRegion: ScanRegion,
  sourceWidth: number,
  sourceHeight: number,
): ScanRegion | null {
  if (
    !candidate ||
    candidate.sourceWidth <= 0 ||
    candidate.sourceHeight <= 0 ||
    sourceWidth <= 0 ||
    sourceHeight <= 0
  ) {
    return null;
  }

  const scaleX = sourceWidth / candidate.sourceWidth;
  const scaleY = sourceHeight / candidate.sourceHeight;
  const left = candidate.left * scaleX;
  const top = candidate.top * scaleY;
  const width = candidate.width * scaleX;
  const height = candidate.height * scaleY;
  const horizontalPadding = Math.max(10, width * 0.25);
  const verticalPadding = Math.max(8, height * 0.4);
  const expandedLeft = Math.max(scanRegion.left, left - horizontalPadding);
  const expandedTop = Math.max(scanRegion.top, top - verticalPadding);
  const expandedRight = Math.min(
    scanRegion.left + scanRegion.width,
    left + width + horizontalPadding,
  );
  const expandedBottom = Math.min(
    scanRegion.top + scanRegion.height,
    top + height + verticalPadding,
  );

  if (expandedRight <= expandedLeft || expandedBottom <= expandedTop) return null;
  return {
    left: expandedLeft,
    top: expandedTop,
    width: expandedRight - expandedLeft,
    height: expandedBottom - expandedTop,
  };
}

interface BarcodeDigitsCandidate {
  value: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

async function createBarcodeOcrWorker() {
  const { createWorker, OEM, PSM } = await import('tesseract.js');
  const worker = await createWorker('eng', OEM.LSTM_ONLY);
  await worker.setParameters({
    tessedit_char_whitelist: '0123456789',
    tessedit_pageseg_mode: PSM.SPARSE_TEXT,
    user_defined_dpi: '300',
  });
  return worker;
}

function findBarcodeDigitsCandidate(page: BarcodeOcrPage): BarcodeDigitsCandidate | null {
  const candidates: BarcodeDigitsCandidate[] = [];
  for (const block of page.blocks ?? []) {
    for (const paragraph of block.paragraphs) {
      for (const line of paragraph.lines) {
        const words = line.words
          .map((word) => ({
            value: word.text.replace(/\D/g, ''),
            confidence: word.confidence,
            bbox: word.bbox,
          }))
          .filter((word) => word.value.length > 0);

        for (let start = 0; start < words.length; start += 1) {
          let value = '';
          let confidenceTotal = 0;
          let left = Number.POSITIVE_INFINITY;
          let top = Number.POSITIVE_INFINITY;
          let right = 0;
          let bottom = 0;
          for (let end = start; end < words.length; end += 1) {
            value += words[end].value;
            confidenceTotal += words[end].confidence;
            left = Math.min(left, words[end].bbox.x0);
            top = Math.min(top, words[end].bbox.y0);
            right = Math.max(right, words[end].bbox.x1);
            bottom = Math.max(bottom, words[end].bbox.y1);
            if (value.length > 20) break;
            if (value.length < 8) continue;
            const wordCount = end - start + 1;
            candidates.push({
              value,
              confidence: confidenceTotal / wordCount,
              bbox: { x0: left, y0: top, x1: right, y1: bottom },
            });
          }
        }
      }
    }
  }

  return (
    candidates
      .filter((candidate) => candidate.confidence >= 35)
      .sort(
        (first, second) =>
          Number(hasValidGs1CheckDigit(second.value)) -
            Number(hasValidGs1CheckDigit(first.value)) ||
          second.confidence - first.confidence ||
          second.value.length - first.value.length,
      )[0] ?? null
  );
}

function hasValidGs1CheckDigit(value: string) {
  if (![8, 12, 13, 14].includes(value.length)) return false;
  const checkDigit = Number(value[value.length - 1]);
  let sum = 0;
  let weight = 3;
  for (let index = value.length - 2; index >= 0; index -= 1) {
    sum += Number(value[index]) * weight;
    weight = weight === 3 ? 1 : 3;
  }
  return (10 - (sum % 10)) % 10 === checkDigit;
}

function getBarcodeRegionFromOcrCandidate(
  candidate: BarcodeDigitsCandidate,
  scanRegion: ScanRegion,
  scale: number,
): BarcodeImageRegion {
  const digitHeight = Math.max(1, (candidate.bbox.y1 - candidate.bbox.y0) / scale);
  const digitsLeft = scanRegion.left + candidate.bbox.x0 / scale;
  const digitsTop = scanRegion.top + candidate.bbox.y0 / scale;
  const digitsRight = scanRegion.left + candidate.bbox.x1 / scale;
  const digitsBottom = scanRegion.top + candidate.bbox.y1 / scale;
  const left = Math.max(scanRegion.left, digitsLeft - digitHeight * 0.4);
  const top = Math.max(scanRegion.top, digitsTop - digitHeight * 4);
  const right = Math.min(
    scanRegion.left + scanRegion.width,
    digitsRight + digitHeight * 0.4,
  );
  const bottom = Math.min(
    scanRegion.top + scanRegion.height,
    digitsBottom + digitHeight * 0.25,
  );
  return { left, top, width: right - left, height: bottom - top };
}

async function requestContinuousFocus(stream: MediaStream) {
  const track = stream.getVideoTracks()[0];
  if (!track || typeof track.getCapabilities !== 'function') return;

  try {
    const capabilities = track.getCapabilities() as MediaTrackCapabilities & {
      focusMode?: string[];
    };
    const focusMode = capabilities.focusMode?.includes('continuous')
      ? 'continuous'
      : capabilities.focusMode?.includes('single-shot')
        ? 'single-shot'
        : null;
    if (!focusMode) return;
    await track.applyConstraints({
      advanced: [{ focusMode } as MediaTrackConstraintSet],
    });
  } catch {}
}

function getCameraVideoConstraints(
  facingMode: MediaTrackConstraints['facingMode'],
): MediaTrackConstraints {
  return {
    facingMode,
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 30 },
    focusMode: { ideal: 'continuous' },
  } as MediaTrackConstraints;
}

function isBarcodeInScanRegion(
  boundingBox: NativeBarcodeDetection['boundingBox'],
  region: ScanRegion,
) {
  if (!boundingBox) return false;
  const centerX = boundingBox.x + boundingBox.width / 2;
  const centerY = boundingBox.y + boundingBox.height / 2;
  return (
    centerX >= region.left &&
    centerX <= region.left + region.width &&
    centerY >= region.top &&
    centerY <= region.top + region.height
  );
}

function getBoundingBoxDistance(
  boundingBox: NativeBarcodeDetection['boundingBox'],
  region: ScanRegion,
) {
  if (!boundingBox || region.width <= 0 || region.height <= 0) return Number.POSITIVE_INFINITY;
  const x =
    (boundingBox.x + boundingBox.width / 2 - (region.left + region.width / 2)) / region.width;
  const y =
    (boundingBox.y + boundingBox.height / 2 - (region.top + region.height / 2)) / region.height;
  return x * x + y * y;
}

function getScanErrorInfo(cause: unknown) {
  if (cause && typeof cause === 'object') {
    const error = cause as {
      getKind?: () => string;
      name?: string;
      message?: string;
    };
    const kind =
      typeof error.getKind === 'function'
        ? error.getKind()
        : error.name ?? 'UnknownError';
    return { kind, message: error.message?.trim() ?? '' };
  }
  return { kind: 'UnknownError', message: String(cause) };
}

function getCameraError(cause: unknown) {
  if (cause instanceof DOMException && cause.name === 'NotAllowedError') {
    return 'No se concedió permiso para usar la cámara.';
  }
  if (cause instanceof DOMException && cause.name === 'NotFoundError') {
    return 'No se encontró una cámara disponible en este dispositivo.';
  }
  if (cause instanceof DOMException && cause.name === 'NotReadableError') {
    return 'La cámara está ocupada o no pudo iniciarse. Cerrá otras aplicaciones que la estén usando e intentá de nuevo.';
  }
  if (cause instanceof DOMException && cause.name === 'OverconstrainedError') {
    return 'La cámara no admite la resolución solicitada. Cerrá y volvé a abrir el escáner.';
  }
  if (cause === false) {
    return 'El video no quedó listo para el lector de códigos. Cerrá y volvé a abrir el escáner.';
  }
  if (!window.isSecureContext) {
    return 'Para usar la cámara, abrí el catálogo por HTTPS. En desarrollo, iniciá el front con pnpm dev:mobile.';
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return 'Este navegador no permite acceder a la cámara.';
  }
  if (cause instanceof Error) {
    const details = cause.message.trim();
    return details
      ? `No se pudo iniciar el escáner: ${details}`
      : `No se pudo iniciar el escáner (${cause.name}). Cerrá y volvé a abrirlo.`;
  }
  return 'No se pudo iniciar el escáner. Revisá el permiso de la cámara e intentá nuevamente.';
}
