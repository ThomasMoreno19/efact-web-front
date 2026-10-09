"use client";

import { useEffect, useRef, useState } from "react";
import { getMovimientosAdminPage } from "@/features/movimiento-equipo/services/movimiento-admin.service";
import type { MovimientoAdminRecord } from "@/features/movimiento-equipo/types/movimiento-equipo";
import { formatRelativeDate } from "@/services/format-relative-date";

export function MovimientosAdminList({ empresaId }: { empresaId: number }) {
  const [movimientos, setMovimientos] = useState<MovimientoAdminRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [offset, setOffset] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    getMovimientosAdminPage(empresaId, offset, controller.signal)
      .then((page) => {
        setMovimientos((current) =>
          offset === 0 ? page.records : [...current, ...page.records],
        );
        setHasMore(page.hasMore);
        setTotal(page.total);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "No se pudieron cargar los movimientos de reparación.",
        );
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        if (offset === 0) setIsLoading(false);
        else setIsLoadingMore(false);
      });

    return () => controller.abort();
  }, [empresaId, offset, reloadKey]);

  useEffect(() => {
    if (!hasMore || isLoading || isLoadingMore || error) return;
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsLoadingMore(true);
          setOffset(movimientos.length);
        }
      },
      { rootMargin: "240px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [error, hasMore, isLoading, isLoadingMore, movimientos.length]);

  function retryLoading() {
    if (movimientos.length === 0) setIsLoading(true);
    else setIsLoadingMore(true);
    setError(null);
    setReloadKey((current) => current + 1);
  }

  return (
    <section className="rounded-card border border-border bg-surface p-6 sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Movimientos de reparación</h2>
        {!isLoading && !error ? (
          <p className="text-sm text-muted">
            {total.toLocaleString("es-AR")} {total === 1 ? "movimiento" : "movimientos"}
          </p>
        ) : null}
      </div>

      {isLoading ? (
        <p role="status" className="mt-5 text-sm text-muted">
          Cargando movimientos…
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-input border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
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
      {!isLoading && !error && movimientos.length === 0 ? (
        <p className="mt-5 text-sm text-muted">
          No hay movimientos de reparación cargados.
        </p>
      ) : null}
      {!isLoading && movimientos.length > 0 ? (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[62rem] text-left text-sm">
            <thead>
              <tr className="text-muted">
                <th scope="col" className="pb-3 pr-4 font-medium">
                  Equipo
                </th>
                <th scope="col" className="pb-3 pr-4 font-medium">
                  Cliente
                </th>
                <th scope="col" className="pb-3 pr-4 font-medium">
                  Estado
                </th>
                <th scope="col" className="pb-3 pr-4 font-medium">
                  Fecha
                </th>
                <th scope="col" className="pb-3 font-medium">
                  Observaciones
                </th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((movimiento) => (
                <MovimientoRow key={movimiento.id} movimiento={movimiento} />
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {hasMore && !isLoading ? (
        <div ref={loadMoreRef} className="mt-5 min-h-8">
          {isLoadingMore ? (
            <p role="status" className="text-center text-sm text-muted">
              Cargando más movimientos…
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function MovimientoRow({ movimiento }: { movimiento: MovimientoAdminRecord }) {
  return (
    <tr className="border-t border-border align-top odd:bg-row-alternate">
      <td className="py-3 pr-4 font-medium">
        {movimiento.equipo.nombreEquipo || "Sin nombre"}
      </td>
      <td className="py-3 pr-4 font-medium">
        {movimiento.equipo.nombreCliente || "Sin cliente"}
      </td>
      <td className="py-3 pr-4">{movimiento.estado || "Sin estado"}</td>
      <td className="whitespace-nowrap py-3 pr-4 text-muted">
        {formatRelativeDate(movimiento.fecha, "Sin fecha")}
      </td>
      <td className="max-w-sm py-3">
        {movimiento.observacion || "—"}
      </td>
    </tr>
  );
}
