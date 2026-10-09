"use client";

import { useState } from "react";
import { CatalogManagement } from "@/features/catalogo/components/catalog-management";
import { CatalogExcelImportPanel } from "@/features/importacion/components/catalog-excel-import-panel";

export function CompanyCatalogSection({
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
      <CatalogManagement key={refreshKey} empresaId={empresaId} />
    </div>
  );
}
