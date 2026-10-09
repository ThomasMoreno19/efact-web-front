"use client";

import { CompanyCard } from "@/features/empresa/components/company-card";
import { CompanyFormDialog } from "@/features/empresa/components/company-form-dialog";
import { CreateCompanyCard } from "@/features/empresa/components/create-company-card";
import { DeleteCompanyDialog } from "@/features/empresa/components/delete-company-dialog";
import type { Empresa } from "@/features/empresa/types/empresa";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ActiveDialog =
  | { type: "create" }
  | { type: "edit"; empresa: Empresa }
  | { type: "delete"; empresa: Empresa }
  | null;

interface CompanyDashboardProps {
  empresas: Empresa[];
  loadError: boolean;
}

export function CompanyDashboard({
  empresas,
  loadError,
}: CompanyDashboardProps) {
  const router = useRouter();
  const [dialog, setDialog] = useState<ActiveDialog>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function finishMutation(message?: string) {
    setDialog(null);
    setNotice(message ?? null);
    router.refresh();
  }

  return (
    <section>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Empresas
          </h1>
        </div>
        <span className="text-sm text-muted">
          {empresas.length} {empresas.length === 1 ? "empresa" : "empresas"}
        </span>
      </div>

      {loadError ? (
        <div
          role="alert"
          className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-card border border-border bg-surface p-4"
        >
          <p className="text-sm text-muted">
            No se pudo cargar la lista de empresas desde el servidor.
          </p>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="rounded-button border border-border px-4 py-2 text-sm font-medium transition hover:bg-surface-raised"
          >
            Reintentar
          </button>
        </div>
      ) : null}
      {notice ? (
        <p
          role="status"
          className="mb-6 rounded-card border border-brand/30 bg-brand/10 p-4 text-sm text-foreground"
        >
          {notice}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <CreateCompanyCard onClick={() => setDialog({ type: "create" })} />
        {empresas.map((empresa) => (
          <CompanyCard
            key={empresa.id}
            empresa={empresa}
            onEdit={(selected) =>
              setDialog({ type: "edit", empresa: selected })
            }
            onDelete={(selected) =>
              setDialog({ type: "delete", empresa: selected })
            }
          />
        ))}
      </div>

      {dialog?.type === "create" ? (
        <CompanyFormDialog
          key="create"
          onClose={() => setDialog(null)}
          onSaved={finishMutation}
        />
      ) : null}
      {dialog?.type === "edit" ? (
        <CompanyFormDialog
          key={`edit-${dialog.empresa.id}`}
          empresa={dialog.empresa}
          onClose={() => setDialog(null)}
          onSaved={finishMutation}
        />
      ) : null}
      {dialog?.type === "delete" ? (
        <DeleteCompanyDialog
          key={`delete-${dialog.empresa.id}`}
          empresa={dialog.empresa}
          onClose={() => setDialog(null)}
          onDeleted={finishMutation}
        />
      ) : null}
    </section>
  );
}
