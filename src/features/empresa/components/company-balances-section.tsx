"use client";

import { useState } from "react";
import { ClientBalancesList } from "@/features/cliente/components/client-balances-list";
import { CatalogExcelImportPanel } from "@/features/importacion/components/catalog-excel-import-panel";

export function CompanyBalancesSection({
  empresaId,
  excelDisabled,
}: {
  empresaId: number;
  excelDisabled: boolean;
}) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <CatalogExcelImportPanel
        empresaId={empresaId}
        excelDisabled={excelDisabled}
        onImportSuccess={() => setRefreshKey((current) => current + 1)}
      />
      <ClientBalancesList key={refreshKey} empresaId={empresaId} />
    </div>
  );
}
