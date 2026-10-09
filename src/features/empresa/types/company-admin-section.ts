export type CompanyAdminSection =
  "catalogo" | "saldos" | "reparacion" | "navegacion" | "configuracion";

export interface CompanyAdminSectionItem {
  id: CompanyAdminSection;
  label: string;
}

export const COMPANY_ADMIN_SECTIONS: CompanyAdminSectionItem[] = [
  { id: "catalogo", label: "Catálogo" },
  { id: "saldos", label: "Saldos" },
  { id: "reparacion", label: "Reparación" },
  { id: "navegacion", label: "Navegación" },
  { id: "configuracion", label: "Configuración" },
];
