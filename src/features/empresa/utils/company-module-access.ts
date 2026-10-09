import type { Empresa } from "@/features/empresa/types/empresa";
import type { CompanyAdminSection } from "@/features/empresa/types/company-admin-section";

export type CompanyPublicModule = "catalogo" | "saldo" | "reparacion";

export function isCompanyModuleEnabled(
  empresa: Empresa,
  module: CompanyPublicModule,
) {
  if (module === "catalogo") return empresa.catalogoHabilitado;
  if (module === "saldo") return empresa.saldosHabilitados;
  return empresa.reparacionesHabilitadas;
}

export function isCompanyAdminSectionEnabled(
  empresa: Empresa,
  section: CompanyAdminSection,
) {
  if (section === "catalogo") return isCompanyModuleEnabled(empresa, "catalogo");
  if (section === "saldos") return isCompanyModuleEnabled(empresa, "saldo");
  if (section === "reparacion") {
    return isCompanyModuleEnabled(empresa, "reparacion");
  }
  return true;
}
