"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatRelativeDate } from "@/services/format-relative-date";
import { getSaldosInternos } from "@/features/interno/services/interno-client.service";
import type { SaldoInternoCliente } from "@/features/interno/types/interno";

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const clientNameCollator = new Intl.Collator("es-AR", { sensitivity: "base" });
const PAGE_SIZE = 20;

export function InternalBalancesList({ empresaId }: { empresaId: number }) {
  const [clientes, setClientes] = useState<SaldoInternoCliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nameFilter, setNameFilter] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    getSaldosInternos(empresaId, controller.signal)
      .then((records) => {
        setClientes(records);
        setVisibleCount(PAGE_SIZE);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "No se pudieron cargar los saldos internos.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [empresaId]);

  const filteredClientes = useMemo(() => {
    const normalizedFilter = nameFilter.trim();
    return clientes
      .filter((cliente) =>
        clientNameCollator.compare(
          (cliente.nombre ?? "").slice(0, normalizedFilter.length),
          normalizedFilter,
        ) === 0,
      )
      .sort(
        (a, b) =>
          (b.saldo ?? Number.NEGATIVE_INFINITY) -
          (a.saldo ?? Number.NEGATIVE_INFINITY),
      );
  }, [clientes, nameFilter]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [nameFilter]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || visibleCount >= filteredClientes.length || isLoading || error) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((count) =>
            Math.min(count + PAGE_SIZE, filteredClientes.length),
          );
        }
      },
      { rootMargin: "240px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [error, filteredClientes.length, isLoading, visibleCount]);

  return (
    <section className="rounded-card border border-border bg-surface p-6 sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">Saldos de clientes</h1>
          {!isLoading && !error ? (
            <p className="text-sm text-muted">
              {clientes.length.toLocaleString("es-AR")} {clientes.length === 1 ? "registro" : "registros"}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-4 max-w-sm">
        <label htmlFor="internal-balances-name-filter" className="mb-1 block text-sm font-medium">
          Filtrar por nombre
        </label>
        <input
          id="internal-balances-name-filter"
          type="search"
          value={nameFilter}
          onChange={(event) => setNameFilter(event.currentTarget.value)}
          placeholder="Nombre del cliente"
          className="min-h-11 w-full rounded-input border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        />
      </div>
      {isLoading ? (
        <p role="status" className="mt-5 text-sm text-muted">
          Cargando saldos…
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-input border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
        >
          {error}
        </p>
      ) : null}
      {!isLoading && !error && filteredClientes.length === 0 ? (
        <p className="mt-5 text-sm text-muted">
          {clientes.length === 0 ? "No hay saldos cargados." : "No se encontraron clientes con ese nombre."}
        </p>
      ) : null}
      {!isLoading && !error && filteredClientes.length > 0 ? (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead>
              <tr className="text-muted">
                <th scope="col" className="pb-3 pr-4 font-medium">
                  Cliente
                </th>
                <th scope="col" className="pb-3 pr-4 font-medium">
                  Saldo
                </th>
                <th scope="col" className="pb-3 font-medium">
                  Fecha de actualización
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.slice(0, visibleCount).map((cliente, index) => (
                <tr
                  key={`${cliente.nombre ?? "cliente"}-${index}`}
                  className="border-t border-border odd:bg-row-alternate"
                >
                  <td className="py-3 pr-4 font-medium">
                    {cliente.nombre || "Sin nombre"}
                  </td>
                  <td className="py-3 pr-4 tabular-nums">
                    {cliente.saldo === null
                      ? "—"
                      : currencyFormatter.format(cliente.saldo)}
                  </td>
                  <td className="py-3 text-muted">
                    {formatRelativeDate(cliente.updatedAt, "Sin registrar")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleCount < filteredClientes.length ? (
            <div ref={loadMoreRef} className="min-h-8" aria-hidden="true" />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
