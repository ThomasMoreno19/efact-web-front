import type { CompanyAdminSection } from "@/features/empresa/types/company-admin-section";
import { COMPANY_ADMIN_SECTIONS } from "@/features/empresa/types/company-admin-section";
import { CompanyBalancesSection } from "@/features/empresa/components/company-balances-section";
import { CompanyCatalogSection } from "@/features/empresa/components/company-catalog-section";
import { CompanyRepairSection } from "@/features/empresa/components/company-repair-section";
import { CompanyNavigationSection } from "@/features/empresa/components/company-navigation-section";
import { CompanyConfigurationSection } from "@/features/empresa/components/company-configuration-section";
import type { Empresa } from "@/features/empresa/types/empresa";
import { isCompanyAdminSectionEnabled } from "@/features/empresa/utils/company-module-access";

export function CompanyAdminContent({
  empresa,
  activeSection,
}: {
  empresa: Empresa;
  activeSection: CompanyAdminSection;
}) {
  if (!isCompanyAdminSectionEnabled(empresa, activeSection)) {
    return (
      <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
        <p role="alert" className="text-sm text-danger">
          Este módulo no está habilitado para esta empresa.
        </p>
      </main>
    );
  }

  const section = COMPANY_ADMIN_SECTIONS.find(
    (item) => item.id === activeSection,
  );

  return (
    <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-8 border-b border-border pb-6">
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {section?.label}
          </h1>
        </header>

        {activeSection === "saldos" ? (
          <CompanyBalancesSection
            empresaId={empresa.id}
            excelDisabled={!empresa.habilitarExcel}
          />
        ) : activeSection === "catalogo" ? (
          <CompanyCatalogSection
            empresaId={empresa.id}
            excelDisabled={!empresa.habilitarExcel}
          />
        ) : activeSection === "reparacion" ? (
          <CompanyRepairSection
            empresaId={empresa.id}
            excelDisabled={!empresa.habilitarExcel}
          />
        ) : activeSection === "navegacion" ? (
          <CompanyNavigationSection empresa={empresa} />
        ) : activeSection === "configuracion" ? (
          <CompanyConfigurationSection empresa={empresa} />
        ) : null}
      </div>
    </main>
  );
}
