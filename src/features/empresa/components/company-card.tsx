import Image from "next/image";
import { ShoppingBag, Wallet, Wrench } from "lucide-react";
import type { Empresa } from "@/features/empresa/types/empresa";
import { CompanyLogo } from "@/features/empresa/components/company-logo";
import { CompanyOptionsMenu } from "@/features/empresa/components/company-options-menu";
import { CompanyPagesMenu } from "@/features/empresa/components/company-pages-menu";
import { CompanyExcelTokenButton } from "@/features/empresa/components/company-excel-token-button";

interface CompanyCardProps {
  empresa: Empresa;
  onDelete: (empresa: Empresa) => void;
  onEdit: (empresa: Empresa) => void;
}

export function CompanyCard({ empresa, onDelete, onEdit }: CompanyCardProps) {
  const hasStatusIcons =
    empresa.catalogoHabilitado ||
    empresa.saldosHabilitados ||
    empresa.reparacionesHabilitadas ||
    !empresa.habilitarExcel;

  return (
    <article className="relative rounded-card border border-border bg-surface transition hover:border-brand/40">
      <div className="relative aspect-[16/9] overflow-hidden rounded-t-card bg-field">
        <CompanyLogo empresa={empresa} />
        <CompanyOptionsMenu
          empresa={empresa}
          onEdit={() => onEdit(empresa)}
          onDelete={() => onDelete(empresa)}
        />
      </div>

      <div className="rounded-b-card p-4">
        <h2 className="truncate text-base font-semibold" title={empresa.nombre}>
          {empresa.nombre}
        </h2>
        <p className="mt-1 truncate text-xs text-muted">/{empresa.slug}</p>
        {hasStatusIcons ? (
          <div
            role="group"
            aria-label="Módulos habilitados y estado de carga Excel"
            className="mt-2 flex items-center gap-2"
          >
            {empresa.catalogoHabilitado ? (
              <span
                role="img"
                aria-label="Catálogo habilitado"
                title="Catálogo habilitado"
              >
                <ShoppingBag
                  aria-hidden="true"
                  className="size-5 text-muted"
                  strokeWidth={1.7}
                />
              </span>
            ) : null}
            {empresa.saldosHabilitados ? (
              <span
                role="img"
                aria-label="Saldo de clientes habilitado"
                title="Saldo de clientes habilitado"
              >
                <Wallet
                  aria-hidden="true"
                  className="size-5 text-muted"
                  strokeWidth={1.7}
                />
              </span>
            ) : null}
            {empresa.reparacionesHabilitadas ? (
              <span
                role="img"
                aria-label="Reparación habilitada"
                title="Reparación habilitada"
              >
                <Wrench
                  aria-hidden="true"
                  className="size-5 text-muted"
                  strokeWidth={1.7}
                />
              </span>
            ) : null}
            {!empresa.habilitarExcel ? (
              <span
                role="img"
                aria-label="Carga de Excel deshabilitada"
                title="Carga de Excel deshabilitada"
                className="relative size-5"
              >
                <Image
                  src="/excel.svg"
                  alt=""
                  aria-hidden="true"
                  width={20}
                  height={20}
                  className="opacity-60 grayscale"
                />
                <Image
                  src="/forbidden.svg"
                  alt=""
                  aria-hidden="true"
                  width={24}
                  height={24}
                  className="absolute left-1/2 top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 brightness-0 invert"
                />
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4">
          <CompanyPagesMenu empresa={empresa} />
        </div>
        <div className="mt-2">
          <CompanyExcelTokenButton empresaId={empresa.id} />
        </div>
      </div>
    </article>
  );
}
