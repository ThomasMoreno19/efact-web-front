"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSaldosClientes } from "@/features/cliente/services/cliente-query.service";
import type { ClienteSaldo } from "@/features/cliente/types/cliente";
import { formatRelativeDate } from "@/services/format-relative-date";

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const clientNameCollator = new Intl.Collator("es-AR", {
  sensitivity: "base",
});
const PAGE_SIZE = 20;

export function ClientBalancesList({ empresaId }: { empresaId: number }) {
  const [clients, setClients] = useState<ClienteSaldo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nameFilter, setNameFilter] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadBalances() {
      try {
        setClients(await getSaldosClientes(empresaId, controller.signal));
        setVisibleCount(PAGE_SIZE);
      } catch (cause) {
        if (controller.signal.aborted) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "No se pudieron cargar los saldos de los clientes.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadBalances();
    return () => controller.abort();
  }, [empresaId]);

  const filteredClients = useMemo(() => {
    const normalizedFilter = nameFilter.trim();
    return clients
      .filter((client) =>
        clientNameCollator.compare(
          (client.nombre ?? "").slice(0, normalizedFilter.length),
          normalizedFilter,
        ) === 0,
      )
      .sort(
        (a, b) =>
          (b.saldo ?? Number.NEGATIVE_INFINITY) -
          (a.saldo ?? Number.NEGATIVE_INFINITY),
      );
  }, [clients, nameFilter]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [nameFilter]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || visibleCount >= filteredClients.length || isLoading || error) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((count) =>
            Math.min(count + PAGE_SIZE, filteredClients.length),
          );
        }
      },
      { rootMargin: "240px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [error, filteredClients.length, isLoading, visibleCount]);

  return (
    <section className="rounded-card border border-border bg-surface p-6 sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Saldos de clientes</h2>
          {!isLoading && !error ? (
            <p className="text-sm text-muted">
              {clients.length} {clients.length === 1 ? "registro" : "registros"}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 max-w-sm">
        <label htmlFor="client-balances-name-filter" className="mb-1 block text-sm font-medium">
          Filtrar por nombre
        </label>
        <input
          id="client-balances-name-filter"
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
      {!isLoading && !error && filteredClients.length === 0 ? (
        <p className="mt-5 text-sm text-muted">
          {clients.length === 0 ? "No hay saldos de clientes cargados." : "No se encontraron clientes con ese nombre."}
        </p>
      ) : null}
      {!isLoading && !error && filteredClients.length > 0 ? (
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
              {filteredClients.slice(0, visibleCount).map((client, index) => (
                <tr
                  key={`${client.nombre ?? "cliente"}-${index}`}
                  className="border-t border-border odd:bg-row-alternate"
                >
                  <td className="py-3 pr-4 font-medium">
                    {client.nombre || "Sin nombre"}
                  </td>
                  <td className="py-3 pr-4 tabular-nums">
                    {client.saldo === null
                      ? "—"
                      : currencyFormatter.format(client.saldo)}
                  </td>
                  <td className="py-3 text-muted">
                    {formatRelativeDate(client.updatedAt, "Sin registrar")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleCount < filteredClients.length ? (
            <div ref={loadMoreRef} className="min-h-8" aria-hidden="true" />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
