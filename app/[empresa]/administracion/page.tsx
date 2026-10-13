import type { Metadata } from "next";
import {
  getAdminAccessToken,
  getAdminSession,
} from "@/features/auth/services/admin-session.service";
import { CompanyAdministration } from "@/features/empresa/components/company-administration";
import { getEmpresaPublicaBySlug } from "@/features/empresa/services/empresa-public-query.service";
import {
  getAllEmpresas,
  getEmpresaById,
} from "@/features/empresa/services/empresa-query.service";
import { redirect } from "next/navigation";

interface CompanyAdministrationPageProps {
  params: Promise<{ empresa: string }>;
}

export async function generateMetadata({
  params,
}: CompanyAdministrationPageProps): Promise<Metadata> {
  const { empresa: slug } = await params;
  const empresa = await getEmpresaPublicaBySlug(slug);
  return empresa ? { title: `${empresa.nombre} Administración` } : {};
}

export default async function CompanyAdministrationPage({
  params,
}: CompanyAdministrationPageProps) {
  const { empresa: slug } = await params;
  const publicEmpresa = await getEmpresaPublicaBySlug(slug);
  if (!publicEmpresa) redirect("/");

  const session = await getAdminSession();
  if (!session) redirect("/administracion/login");
  if (
    session.role === "Admin" &&
    (session.empresaSlug !== slug || session.id_empresa !== publicEmpresa.id)
  ) {
    redirect(`/${session.empresaSlug}/administracion`);
  }

  const token = await getAdminAccessToken();
  if (!token) redirect("/administracion/login");

  const empresa =
    session.role === "Superadmin"
      ? (await getAllEmpresas(token)).find((item) => item.slug === slug)
      : await getEmpresaById(publicEmpresa.id, token);
  if (!empresa) redirect("/");

  return (
    <CompanyAdministration
      empresa={empresa}
      isSuperadmin={session.role === "Superadmin"}
    />
  );
}
