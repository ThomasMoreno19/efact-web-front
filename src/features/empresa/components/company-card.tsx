import Link from "next/link";
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

        <div
          className={`mt-4 grid gap-2 ${
            empresa.catalogoHabilitado ||
            empresa.saldosHabilitados ||
            empresa.reparacionesHabilitadas
              ? "grid-cols-2"
              : "grid-cols-1"
          }`}
        >
          <Link
            href={`/${empresa.slug}/administración`}
            className="flex h-10 items-center justify-center rounded-button border border-border bg-surface-raised px-3 text-sm font-medium transition hover:border-brand/50 hover:bg-surface"
          >
            Configurar
          </Link>
          <CompanyPagesMenu empresa={empresa} />
        </div>
        <div className="mt-2">
          <CompanyExcelTokenButton empresaId={empresa.id} />
        </div>
      </div>
    </article>
  );
}
