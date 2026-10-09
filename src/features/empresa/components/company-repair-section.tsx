"use client";

import { useState } from "react";
import { EquipoExcelImportPanel } from "@/features/equipo/components/equipo-excel-import-panel";
import { MovimientosAdminList } from "@/features/movimiento-equipo/components/movimientos-admin-list";

export function CompanyRepairSection({
  empresaId,
  excelDisabled,
}: {
  empresaId: number;
  excelDisabled: boolean;
}) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <EquipoExcelImportPanel
        empresaId={empresaId}
        excelDisabled={excelDisabled}
        onImportSuccess={() => setRefreshKey((current) => current + 1)}
      />
      <MovimientosAdminList key={refreshKey} empresaId={empresaId} />
    </div>
  );
}
