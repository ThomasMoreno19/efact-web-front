import { CompanyPageQrSection } from "@/features/empresa/components/company-page-qr-section";
import type { Empresa } from "@/features/empresa/types/empresa";
import {
  isCompanyModuleEnabled,
  type CompanyPublicModule,
} from "@/features/empresa/utils/company-module-access";

const QR_MODULES: Array<{
  id: CompanyPublicModule;
  section: "catalogo" | "saldo" | "reparacion";
}> = [
  { id: "catalogo", section: "catalogo" },
  { id: "saldo", section: "saldo" },
  { id: "reparacion", section: "reparacion" },
];

export function CompanyNavigationSection({
  empresa,
}: {
  empresa: Empresa;
}) {
  const enabledModules = QR_MODULES.filter(({ id }) =>
    isCompanyModuleEnabled(empresa, id),
  );

  return (
    <div className="space-y-6">
      {enabledModules.length ? (
        enabledModules.map(({ id, section }) => (
          <CompanyPageQrSection
            key={id}
            empresaSlug={empresa.slug}
            modulo={section}
          />
        ))
      ) : (
        <p className="text-sm text-muted">
          Esta empresa no tiene módulos públicos habilitados.
        </p>
      )}
    </div>
  );
}
