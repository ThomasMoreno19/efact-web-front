"use client";

import { CompanyLogo } from "@/features/empresa/components/company-logo";
import type { CompanyAdminSection } from "@/features/empresa/types/company-admin-section";
import { COMPANY_ADMIN_SECTIONS } from "@/features/empresa/types/company-admin-section";
import type { Empresa } from "@/features/empresa/types/empresa";
import { isCompanyAdminSectionEnabled } from "@/features/empresa/utils/company-module-access";
import Image from "next/image";
import EfactLogo from "../../../../public/Logo.png";
import {
  Building2,
  LogOut,
  QrCode,
  Settings,
  ShoppingBag,
  X,
} from "lucide-react";
import { useEffect } from "react";
import type { ReactNode } from "react";

interface CompanyAdminSidebarProps {
  empresa: Empresa;
  isSuperadmin: boolean;
  activeSection: CompanyAdminSection;
  onSectionChange: (section: CompanyAdminSection) => void;
  isLoggingOut: boolean;
  onLogout: () => void;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export function CompanyAdminSidebar({
  empresa,
  isSuperadmin,
  activeSection,
  onSectionChange,
  isLoggingOut,
  onLogout,
  isOpen,
  onOpen,
  onClose,
}: CompanyAdminSidebarProps) {
  const activeSectionTitle = COMPANY_ADMIN_SECTIONS.find(
    (section) => section.id === activeSection,
  )?.label;

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      <header className="relative flex h-20 items-center border-b border-border bg-surface px-4 sm:hidden">
        <button
          type="button"
          aria-label="Abrir navegación"
          aria-expanded={isOpen}
          aria-controls="company-admin-sidebar-mobile"
          onClick={onOpen}
          className="relative z-10 size-12 shrink-0 overflow-hidden rounded-button border border-border bg-field focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <CompanyLogo empresa={empresa} />
        </button>
        <h1 className="absolute inset-x-16 truncate text-center text-base font-semibold">
          {activeSectionTitle}
        </h1>
      </header>

      <div
        className={`fixed inset-0 z-50 transition-[visibility] sm:hidden ${isOpen ? "visible" : "invisible pointer-events-none"}`}
      >
        <button
          type="button"
          aria-label="Cerrar navegación de administración"
          tabIndex={isOpen ? 0 : -1}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />
        <aside
          id="company-admin-sidebar-mobile"
          aria-label="Navegación de administración"
          aria-hidden={!isOpen}
          inert={!isOpen}
          className={`absolute inset-y-0 left-0 flex w-72 max-w-[calc(100vw-3rem)] flex-col overflow-y-auto bg-surface px-4 py-5 shadow-xl transition-transform duration-200 ease-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <SidebarContents
            empresa={empresa}
            isSuperadmin={isSuperadmin}
            activeSection={activeSection}
            onSectionChange={(section) => {
              onSectionChange(section);
              onClose();
            }}
            isLoggingOut={isLoggingOut}
            onLogout={onLogout}
            onClose={onClose}
          />
        </aside>
      </div>

      <aside className="hidden flex-col border-r border-border bg-surface px-5 py-7 sm:sticky sm:top-0 sm:flex sm:h-screen sm:w-72 sm:shrink-0 sm:overflow-y-auto">
        <SidebarContents
          empresa={empresa}
          isSuperadmin={isSuperadmin}
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          isLoggingOut={isLoggingOut}
          onLogout={onLogout}
        />
      </aside>
    </>
  );
}

function SidebarContents({
  empresa,
  isSuperadmin,
  activeSection,
  onSectionChange,
  isLoggingOut,
  onLogout,
  onClose,
}: Pick<
  CompanyAdminSidebarProps,
  | "empresa"
  | "isSuperadmin"
  | "activeSection"
  | "onSectionChange"
  | "isLoggingOut"
  | "onLogout"
> & { onClose?: () => void }) {
  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <Image
          src={EfactLogo}
          alt="E-fact"
          className="size-8 shrink-0 object-contain"
        />
        <div className="flex min-w-0 items-center gap-2">
          <div className="min-w-0 text-right">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
              Administración
            </p>
            <p
              className="mt-1 max-w-28 truncate text-sm font-semibold"
              title={empresa.nombre}
            >
              {empresa.nombre}
            </p>
          </div>
          <div className="relative size-10 shrink-0 overflow-hidden rounded-button border border-border bg-field">
            <CompanyLogo empresa={empresa} />
          </div>
        </div>
        {onClose ? (
          <button
            type="button"
            aria-label="Cerrar navegación de administración"
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-button text-muted transition hover:bg-surface-raised hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        ) : null}
      </div>

      <nav
        aria-label="Secciones de administración"
        className="mt-10 flex flex-col gap-2"
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
      <div className="mt-auto space-y-2 pt-6">
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
    </>
  );
}

function SectionIcon({ section }: { section: CompanyAdminSection }) {
  if (section === "catalogo") {
    return (
      <ShoppingBag
        aria-hidden="true"
        className="size-5 shrink-0"
        strokeWidth={1.7}
      />
    );
  }
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
    Exclude<CompanyAdminSection, "catalogo" | "configuracion" | "navegacion">,
    ReactNode
  > = {
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
