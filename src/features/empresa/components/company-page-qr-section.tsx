"use client";

import {
  Download,
  ShoppingBag,
  UserRound,
  UsersRound,
  Wallet,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

type CompanyPageModule = "catalogo" | "saldo" | "reparacion";

const MODULE_LABELS: Record<CompanyPageModule, string> = {
  catalogo: "Catálogo",
  saldo: "Saldos",
  reparacion: "Reparación",
};

const MODULE_ICONS: Record<CompanyPageModule, LucideIcon> = {
  catalogo: ShoppingBag,
  saldo: Wallet,
  reparacion: Wrench,
};

export function CompanyPageQrSection({
  empresaSlug,
  modulo,
}: {
  empresaSlug: string;
  modulo: CompanyPageModule;
}) {
  const [siteOrigin, setSiteOrigin] = useState("");

  useEffect(() => {
    setSiteOrigin(window.location.origin);
  }, []);

  const encodedSlug = encodeURIComponent(empresaSlug);
  const clientUrl = siteOrigin ? `${siteOrigin}/${encodedSlug}/${modulo}` : "";
  const internalUrl = `${clientUrl}/interno`;
  const ModuleIcon = MODULE_ICONS[modulo];

  return (
    <section className="rounded-card border border-border bg-surface p-6 sm:p-8">
      <h2 className="flex items-center gap-3 text-[21px] font-semibold">
        <ModuleIcon
          aria-hidden="true"
          className="size-7 shrink-0 text-muted"
          strokeWidth={1.7}
        />
        {MODULE_LABELS[modulo]}
      </h2>
      {siteOrigin ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <QrCodeCard
            title="Clientes"
            icon={UsersRound}
            value={clientUrl}
            filename={`efact-${empresaSlug}-${modulo}-clientes.png`}
          />
          <QrCodeCard
            title="Internos"
            icon={UserRound}
            value={internalUrl}
            filename={`efact-${empresaSlug}-${modulo}-internos.png`}
          />
        </div>
      ) : (
        <p role="status" className="mt-5 text-sm text-muted">
          Preparando códigos QR…
        </p>
      )}
    </section>
  );
}

function QrCodeCard({
  title,
  icon: Icon,
  value,
  filename,
}: {
  title: string;
  icon: LucideIcon;
  value: string;
  filename: string;
}) {
  const qrContainerRef = useRef<HTMLDivElement>(null);

  function downloadQr() {
    const canvas = qrContainerRef.current?.querySelector("canvas");
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <article className="relative flex flex-col items-center gap-4 rounded-card border border-border bg-surface-raised p-5 text-center transition hover:border-brand">
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Abrir la página de ${title.toLowerCase()} en una pestaña nueva`}
        className="absolute inset-0 z-10 rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      />
      <div className="pointer-events-none relative z-0 flex flex-col items-center gap-4 text-foreground">
        <h3 className="flex items-center gap-2 text-[19px] font-semibold">
          <Icon
            aria-hidden="true"
            className="size-5 shrink-0 text-muted"
            strokeWidth={1.7}
          />
          {title}
        </h3>
        <div ref={qrContainerRef} className="rounded-input bg-white p-3">
          <QRCodeCanvas
            value={value}
            size={192}
            level="M"
            includeMargin
            title={`Código QR para ${title.toLowerCase()}`}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={downloadQr}
        className="relative z-20 inline-flex h-10 items-center justify-center gap-2 rounded-button border border-border px-4 text-sm font-medium transition hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <Download aria-hidden="true" className="size-4" />
        Descargar QR
      </button>
    </article>
  );
}
