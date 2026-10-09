"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useDismissLayer } from "@/hooks/use-dismiss-layer";
import type { Empresa } from "@/features/empresa/types/empresa";
import {
  isCompanyModuleEnabled,
  type CompanyPublicModule,
} from "@/features/empresa/utils/company-module-access";

interface CompanyPagesMenuProps {
  empresa: Empresa;
}

const COMPANY_PAGE_LINKS: Array<{
  module: CompanyPublicModule;
  label: string;
}> = [
  { module: "catalogo", label: "Catálogo" },
  { module: "saldo", label: "Consulta de saldos" },
  { module: "reparacion", label: "Reparaciones" },
];

export function CompanyPagesMenu({ empresa }: CompanyPagesMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useDismissLayer(menuRef, () => setIsOpen(false), isOpen);
  const enabledLinks = COMPANY_PAGE_LINKS.filter(({ module }) =>
    isCompanyModuleEnabled(empresa, module),
  );

  if (enabledLinks.length === 0) return null;

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-10 w-full items-center justify-center gap-1 rounded-button bg-brand px-3 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        Ver página
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          className="size-4"
        >
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </button>

      {isOpen ? (
        <div
          role="menu"
          className="absolute bottom-12 right-0 z-20 w-48 rounded-card border border-border bg-surface p-1"
        >
          {enabledLinks.map(({ module, label }) => (
            <PageLink
              key={module}
              href={`/${empresa.slug}/${module}`}
              label={label}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PageLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      role="menuitem"
      href={href}
      className="block rounded-button px-3 py-2 text-sm transition hover:bg-surface-raised"
    >
      {label}
    </Link>
  );
}
