"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, ShoppingBag, Wallet, Wrench, X } from "lucide-react";
import type { CompanyPublicModule } from "@/features/empresa/utils/company-module-access";
import type { EmpresaPublica } from "@/features/empresa/types/empresa";

const PAGE_LABELS: Record<CompanyPublicModule, string> = {
  catalogo: "Catálogo",
  saldo: "Saldos",
  reparacion: "Reparación",
};

export function CompanyPublicPageNavigation({
  empresa,
  currentPage,
  containerClassName,
}: {
  empresa: EmpresaPublica;
  currentPage: CompanyPublicModule;
  containerClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const enabledPages = getEnabledPages(empresa).filter(
    (page) => page !== currentPage,
  );

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!empresa.mostrarNavegacionPaginas || enabledPages.length === 0) {
    return null;
  }

  return (
    <>
      <div className={containerClassName ?? "shrink-0"}>
        <button
          type="button"
          aria-label="Abrir navegación de páginas"
          aria-expanded={isOpen}
          aria-controls="company-public-page-navigation"
          onClick={() => setIsOpen(true)}
          className="flex size-11 shrink-0 items-center justify-center rounded-button border border-border bg-surface text-foreground transition hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <Menu aria-hidden="true" className="size-5" />
        </button>
      </div>

      {isOpen
        ? createPortal(
            <div className="fixed inset-0 z-50">
              <button
                type="button"
                aria-label="Cerrar navegación de páginas"
                onClick={() => setIsOpen(false)}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              />
              <aside
                id="company-public-page-navigation"
                aria-label={`Páginas de ${empresa.nombre}`}
                className="absolute inset-y-0 left-0 flex w-72 max-w-[calc(100vw-3rem)] flex-col border-r border-border bg-surface px-5 py-6 shadow-xl"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
                      Páginas
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold">
                      {empresa.nombre}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Cerrar navegación de páginas"
                    onClick={() => setIsOpen(false)}
                    className="flex size-10 shrink-0 items-center justify-center rounded-button text-muted transition hover:bg-surface-raised hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    <X aria-hidden="true" className="size-5" />
                  </button>
                </div>
                <nav
                  aria-label="Otras páginas habilitadas"
                  className="mt-8 flex flex-col gap-2"
                >
                  {enabledPages.map((page) => (
                    <Link
                      key={page}
                      href={`/${empresa.slug}/${page}`}
                      onClick={() => setIsOpen(false)}
                      className="flex min-h-11 items-center gap-3 rounded-button px-3 text-sm font-medium text-foreground transition hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      <PageIcon page={page} />
                      {PAGE_LABELS[page]}
                    </Link>
                  ))}
                </nav>
              </aside>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function getEnabledPages(empresa: EmpresaPublica): CompanyPublicModule[] {
  const pages: CompanyPublicModule[] = [];
  if (empresa.catalogoHabilitado) pages.push("catalogo");
  if (empresa.saldosHabilitados) pages.push("saldo");
  if (empresa.reparacionesHabilitadas) pages.push("reparacion");
  return pages;
}

function PageIcon({ page }: { page: CompanyPublicModule }) {
  const className = "size-5 shrink-0 text-muted";

  if (page === "catalogo") {
    return <ShoppingBag aria-hidden="true" className={className} />;
  }
  if (page === "saldo") {
    return <Wallet aria-hidden="true" className={className} />;
  }
  return <Wrench aria-hidden="true" className={className} />;
}
