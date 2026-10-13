import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import Logo from "../../public/Logo.png";
import { AdminLogoutButton } from "@/features/auth/components/admin-logout-button";
import { CompanyDashboard } from "@/features/empresa/components/company-dashboard";
import { getAllEmpresas } from "@/features/empresa/services/empresa-query.service";
import {
  getAdminAccessToken,
  getAdminSession,
} from "@/features/auth/services/admin-session.service";
import type { Empresa } from "@/features/empresa/types/empresa";

export const metadata: Metadata = {
  title: "E-fact Web",
};

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  if (session.role === "Admin") {
    redirect(`/${session.empresaSlug}/administracion`);
  }

  const token = await getAdminAccessToken();
  if (!token) redirect("/admin/login");

  let empresas: Empresa[] = [];
  let loadError = false;

  try {
    empresas = await getAllEmpresas(token);
  } catch {
    loadError = true;
  }

  return (
    <main className="min-h-screen bg-background pb-16 pt-28 text-foreground">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center gap-3 px-5 sm:px-8">
          <Image
            src={Logo}
            alt="Logo de E-fact Web"
            priority
            className="h-11 w-11 object-contain"
          />
          <span className="text-lg font-semibold tracking-tight">
            E-fact Web
          </span>
          <AdminLogoutButton />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <CompanyDashboard empresas={empresas} loadError={loadError} />
      </div>
    </main>
  );
}
