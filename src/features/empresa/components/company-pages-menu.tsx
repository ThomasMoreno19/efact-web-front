"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Settings, ShoppingBag, Wallet, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
  module?: CompanyPublicModule;
  label: string;
  icon: LucideIcon;
  getHref: (slug: string) => string;
}> = [
  {
    module: "catalogo",
    label: "Catálogo",
    icon: ShoppingBag,
    getHref: (slug) => `/${slug}/catalogo`,
  },
  {
    module: "saldo",
    label: "Saldo de clientes",
    icon: Wallet,
    getHref: (slug) => `/${slug}/saldo`,
  },
  {
    module: "reparacion",
    label: "Reparación",
    icon: Wrench,
    getHref: (slug) => `/${slug}/reparacion`,
  },
  {
    label: "Configuración",
    icon: Settings,
    getHref: (slug) => `/${slug}/administracion`,
  },
];

export function CompanyPagesMenu({ empresa }: CompanyPagesMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useDismissLayer(menuRef, () => setIsOpen(false), isOpen);
  const enabledLinks = COMPANY_PAGE_LINKS.filter(
    ({ module }) =>
      module === undefined || isCompanyModuleEnabled(empresa, module),
  );

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-10 w-full items-center justify-center gap-1 rounded-button bg-brand px-3 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        Ver páginas
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
          {enabledLinks.map(({ module, label, icon, getHref }) => (
            <PageLink
              key={module ?? "configuracion"}
              href={getHref(empresa.slug)}
              label={label}
              icon={icon}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PageLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      role="menuitem"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-button px-3 py-2 text-sm transition hover:bg-surface-raised"
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.7} />
      {label}
    </Link>
  );
}
