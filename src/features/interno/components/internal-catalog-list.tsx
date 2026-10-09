"use client";

import { useEffect, useRef, useState } from "react";
import { getCatalogoInternoPage } from "@/features/interno/services/interno-client.service";
import type { CatalogoInternoArticulo } from "@/features/interno/types/interno";

const priceFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function InternalCatalogList({ empresaId }: { empresaId: number }) {
  const [articulos, setArticulos] = useState<CatalogoInternoArticulo[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    getCatalogoInternoPage(empresaId, offset, controller.signal)
      .then((page) => {
        setArticulos((current) =>
          offset === 0 ? page.records : [...current, ...page.records],
        );
        setTotal(page.total);
        setHasMore(page.hasMore);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "No se pudo cargar el catálogo interno.",
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
          setOffset(articulos.length);
        }
      },
      { rootMargin: "240px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [articulos.length, error, hasMore, isLoading, isLoadingMore]);

  function retryLoading() {
    if (articulos.length === 0) setIsLoading(true);
    else setIsLoadingMore(true);
    setError(null);
    setReloadKey((current) => current + 1);
  }

  return (
    <section className="rounded-card border border-border bg-surface p-6 sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold">Artículos</h1>
        {!isLoading && !error ? (
          <p className="text-sm text-muted">
            {total.toLocaleString("es-AR")} {total === 1 ? "artículo" : "artículos"}
          </p>
        ) : null}
      </div>

      {isLoading ? (
        <p role="status" className="mt-5 text-sm text-muted">
          Cargando catálogo…
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
      {!isLoading && !error && articulos.length === 0 ? (
        <p className="mt-5 text-sm text-muted">
          No hay artículos cargados para esta empresa.
        </p>
      ) : null}
      {!isLoading && articulos.length > 0 ? (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead>
              <tr className="text-muted">
                <th scope="col" className="pb-3 pr-4 font-medium">
                  Código
                </th>
                <th scope="col" className="pb-3 pr-4 font-medium">
                  Artículo
                </th>
                <th scope="col" className="pb-3 pr-4 font-medium">
                  Precio 1
                </th>
                <th scope="col" className="pb-3 pr-4 font-medium">
                  Precio 2
                </th>
                <th scope="col" className="pb-3 pr-4 font-medium">
                  Precio 3
                </th>
                <th scope="col" className="pb-3 font-medium">
                  Existencia
                </th>
              </tr>
            </thead>
            <tbody>
              {articulos.map((articulo) => (
                <tr
                  key={articulo.id}
                  className="border-t border-border odd:bg-row-alternate"
                >
                  <td className="py-3 pr-4 tabular-nums">
                    {articulo.codigoInterno}
                  </td>
                  <td className="py-3 pr-4 font-medium">{articulo.nombre}</td>
                  <td className="whitespace-nowrap py-3 pr-4 tabular-nums">
                    {formatPrice(articulo.precio1)}
                  </td>
                  <td className="whitespace-nowrap py-3 pr-4 tabular-nums">
                    {formatPrice(articulo.precio2)}
                  </td>
                  <td className="whitespace-nowrap py-3 pr-4 tabular-nums">
                    {formatPrice(articulo.precio3)}
                  </td>
                  <td className="whitespace-nowrap py-3 tabular-nums">
                    {articulo.tieneExistencia
                      ? articulo.existencia.toLocaleString("es-AR")
                      : "Sin control"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {hasMore && !isLoading ? (
        <div ref={loadMoreRef} className="mt-5 min-h-8">
          {isLoadingMore ? (
            <p role="status" className="text-center text-sm text-muted">
              Cargando más artículos…
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function formatPrice(value: number | null) {
  return value === null ? "—" : priceFormatter.format(value);
}
