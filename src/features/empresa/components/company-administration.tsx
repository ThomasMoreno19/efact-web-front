"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logoutSuperadmin } from "@/features/auth/services/auth-client.service";
import { CompanyAdminContent } from "@/features/empresa/components/company-admin-content";
import { CompanyAdminSidebar } from "@/features/empresa/components/company-admin-sidebar";
import { COMPANY_ADMIN_SECTIONS } from "@/features/empresa/types/company-admin-section";
import type { CompanyAdminSection } from "@/features/empresa/types/company-admin-section";
import type { Empresa } from "@/features/empresa/types/empresa";
import { isCompanyAdminSectionEnabled } from "@/features/empresa/utils/company-module-access";

function defaultSection(empresa: Empresa): CompanyAdminSection {
  return (
    COMPANY_ADMIN_SECTIONS.find((section) =>
      isCompanyAdminSectionEnabled(empresa, section.id),
    )?.id ?? "configuracion"
  );
}

export function CompanyAdministration({
  empresa,
  isSuperadmin,
}: {
  empresa: Empresa;
  isSuperadmin: boolean;
}) {
  const router = useRouter();
  const [activeSection, setActiveSection] =
    useState<CompanyAdminSection>(() => defaultSection(empresa));
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const visibleActiveSection = isCompanyAdminSectionEnabled(
    empresa,
    activeSection,
  )
    ? activeSection
    : defaultSection(empresa);

  function changeSection(section: CompanyAdminSection) {
    if (isCompanyAdminSectionEnabled(empresa, section)) setActiveSection(section);
  }

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await logoutSuperadmin().catch(() => undefined);
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background text-foreground sm:flex">
      <CompanyAdminSidebar
        empresa={empresa}
        isSuperadmin={isSuperadmin}
        activeSection={visibleActiveSection}
        onSectionChange={changeSection}
        isLoggingOut={isLoggingOut}
        onLogout={handleLogout}
        isOpen={isMobileSidebarOpen}
        onOpen={() => setIsMobileSidebarOpen(true)}
        onClose={() => setIsMobileSidebarOpen(false)}
      />
      <CompanyAdminContent
        empresa={empresa}
        activeSection={visibleActiveSection}
      />
    </div>
  );
}
