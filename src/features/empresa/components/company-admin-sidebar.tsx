"use client";

import { CompanyLogo } from "@/features/empresa/components/company-logo";
import type { CompanyAdminSection } from "@/features/empresa/types/company-admin-section";
import { COMPANY_ADMIN_SECTIONS } from "@/features/empresa/types/company-admin-section";
import type { Empresa } from "@/features/empresa/types/empresa";
import { isCompanyAdminSectionEnabled } from "@/features/empresa/utils/company-module-access";
import { Building2, LogOut, QrCode, Settings } from "lucide-react";
import type { ReactNode } from "react";

interface CompanyAdminSidebarProps {
  empresa: Empresa;
  isSuperadmin: boolean;
  activeSection: CompanyAdminSection;
  onSectionChange: (section: CompanyAdminSection) => void;
  isLoggingOut: boolean;
  onLogout: () => void;
}

export function CompanyAdminSidebar({
  empresa,
  isSuperadmin,
  activeSection,
  onSectionChange,
  isLoggingOut,
  onLogout,
}: CompanyAdminSidebarProps) {
  return (
    <aside className="flex flex-col border-b border-border bg-surface px-4 py-5 sm:sticky sm:top-0 sm:h-screen sm:w-72 sm:shrink-0 sm:overflow-y-auto sm:border-b-0 sm:border-r sm:px-5 sm:py-7">
      <div className="flex justify-end">
        <div className="flex min-w-0 max-w-full items-center gap-3">
          <div className="min-w-0 text-right">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
              Administración
            </p>
            <p
              className="mt-1 max-w-44 truncate text-sm font-semibold"
              title={empresa.nombre}
            >
              {empresa.nombre}
            </p>
          </div>
          <div className="relative size-12 shrink-0 overflow-hidden rounded-button border border-border bg-field">
            <CompanyLogo empresa={empresa} />
          </div>
        </div>
      </div>

      <nav
        aria-label="Secciones de administración"
        className="mt-6 flex gap-2 overflow-x-auto pb-1 sm:mt-10 sm:flex-col sm:overflow-visible sm:pb-0"
      >
        {COMPANY_ADMIN_SECTIONS.filter((section) =>
          isCompanyAdminSectionEnabled(empresa, section.id),
        ).map((section) => {
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              type="button"
              aria-current={isActive ? "page" : undefined}
              onClick={() => onSectionChange(section.id)}
              className={`flex h-11 shrink-0 items-center gap-3 rounded-button px-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                isActive
                  ? "bg-brand text-brand-foreground"
                  : "text-muted hover:bg-surface-raised hover:text-foreground"
              }`}
            >
              <SectionIcon section={section.id} />
              {section.label}
            </button>
          );
        })}
      </nav>
      <div className="mt-6 space-y-2 sm:mt-auto sm:pt-6">
        {isSuperadmin ? (
          <a
            href="/administracion"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 items-center gap-3 rounded-button border border-border px-3 text-sm font-medium text-muted transition hover:bg-surface-raised hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <Building2 aria-hidden="true" className="size-5 shrink-0" />
            Ir al panel de empresas
          </a>
        ) : null}
        <button
          type="button"
          disabled={isLoggingOut}
          onClick={onLogout}
          className="flex h-11 w-full items-center gap-3 rounded-button px-3 text-sm font-medium text-danger transition hover:bg-danger/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LogOut aria-hidden="true" className="size-5 shrink-0" />
          {isLoggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
        </button>
      </div>
    </aside>
  );
}

function SectionIcon({ section }: { section: CompanyAdminSection }) {
  if (section === "configuracion") {
    return (
      <Settings
        aria-hidden="true"
        className="size-5 shrink-0"
        strokeWidth={1.7}
      />
    );
  }
  if (section === "navegacion") {
    return (
      <QrCode
        aria-hidden="true"
        className="size-5 shrink-0"
        strokeWidth={1.7}
      />
    );
  }

  const paths: Record<
    Exclude<CompanyAdminSection, "configuracion" | "navegacion">,
    ReactNode
  > = {
    catalogo: (
      <>
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </>
    ),
    saldos: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18m-5 5h2" />
      </>
    ),
    reparacion: (
      <>
        <path d="M14.5 6.5a5 5 0 0 0-6.4 6.4l-4.8 4.8a2.1 2.1 0 0 0 3 3l4.8-4.8a5 5 0 0 0 6.4-6.4l-3 3-3-3 3-3Z" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5 shrink-0"
    >
      {paths[section]}
    </svg>
  );
}
