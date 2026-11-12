"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import { CompanyLogo } from "@/features/empresa/components/company-logo";
import { CompanyPublicPageNavigation } from "@/features/empresa/components/company-public-page-navigation";
import type { EmpresaPublica } from "@/features/empresa/types/empresa";
import type { CompanyPublicModule } from "@/features/empresa/utils/company-module-access";

export function CompanyPublicPageHeader({
  empresa,
  currentPage,
  compact,
  rightAction,
  showContactDetails = false,
}: {
  empresa: EmpresaPublica;
  currentPage: CompanyPublicModule;
  compact?: boolean;
  rightAction?: ReactNode;
  showContactDetails?: boolean;
}) {
  const [isCompactOnScroll, setIsCompactOnScroll] = useState(false);
  const compactHeader = compact ?? isCompactOnScroll;
  const hasCompanyLogo = Boolean(empresa.logo_url?.trim());
  const whatsappNumber = empresa.telefono?.replace(/\D/g, "").replace(/^00/, "");

  useEffect(() => {
    if (compact !== undefined) return;

    function updateScrollState() {
      const scrollY = window.scrollY;
      setIsCompactOnScroll((current) =>
        current ? scrollY > 20 : scrollY > 100,
      );
    }

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollState);
  }, [compact]);

  return (
    <header
      className={`fixed inset-x-0 z-40 bg-background/95 px-4 backdrop-blur transition-[top,box-shadow] duration-300 sm:px-6 ${
        compactHeader
          ? "top-0 border-b border-border shadow-lg"
          : "top-8 border-b border-transparent sm:top-12"
      }`}
    >
      <div
        className={`relative mx-auto flex max-w-5xl flex-col items-center px-12 text-center transition-all duration-300 ${
          compactHeader ? "gap-0 py-2" : "py-0"
        }`}
      >
        <CompanyPublicPageNavigation
          empresa={empresa}
          currentPage={currentPage}
          containerClassName="absolute left-0 top-1 z-30"
        />
        {rightAction}
        <div
          className={`relative flex w-fit max-w-full items-center justify-center overflow-hidden rounded-record bg-surface transition-all duration-300 ${
            compactHeader ? "h-12" : "h-28 sm:h-36"
          }`}
        >
          <CompanyLogo empresa={empresa} fitToHeight />
        </div>
        {!hasCompanyLogo || empresa.mostrarNombreConLogo ? (
          <h1
            className={`font-semibold tracking-tight transition-all duration-300 ${
              compactHeader ? "mt-1 text-lg" : "mt-4 text-2xl sm:text-3xl"
            }`}
          >
            {empresa.nombre}
          </h1>
        ) : null}
        {showContactDetails ? (
          <div
            className={`flex flex-col items-center gap-1 overflow-hidden transition-all duration-300 ${
              compactHeader
                ? "pointer-events-none mt-0 max-h-0 -translate-y-1 opacity-0"
                : "mt-2 max-h-20 translate-y-0 opacity-100"
            }`}
          >
            {empresa.ubicacion ? (
              <p className="flex items-center gap-2 text-sm text-muted">
                <Image
                  src="/location.svg"
                  alt=""
                  aria-hidden="true"
                  width={16}
                  height={16}
                  className="size-4 shrink-0"
                />
                <span>{empresa.ubicacion}</span>
              </p>
            ) : null}
            {empresa.telefono && whatsappNumber ? (
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Contactar a ${empresa.nombre} por WhatsApp`}
                className="flex items-center gap-2 text-sm text-muted transition hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <Image
                  src="/whatsapp.svg"
                  alt=""
                  aria-hidden="true"
                  width={16}
                  height={16}
                  className="size-4 shrink-0"
                />
                <span>{empresa.telefono}</span>
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}
