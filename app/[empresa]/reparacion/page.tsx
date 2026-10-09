import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ReparacionConsultaPage } from "@/features/reparacion/components/reparacion-consulta-page";
import { getEmpresaPublicaBySlug } from "@/features/empresa/services/empresa-public-query.service";

interface CompanyRepairPageProps {
  params: Promise<{ empresa: string }>;
}

export async function generateMetadata({
  params,
}: CompanyRepairPageProps): Promise<Metadata> {
  const { empresa: slug } = await params;
  const empresa = await getEmpresaPublicaBySlug(slug);
  return empresa ? { title: `${empresa.nombre} Reparación` } : {};
}

export default async function CompanyRepairPage({
  params,
}: CompanyRepairPageProps) {
  const { empresa: slug } = await params;
  const empresa = await getEmpresaPublicaBySlug(slug);
  if (!empresa) redirect("/");
  if (!empresa.reparacionesHabilitadas) notFound();

  return <ReparacionConsultaPage empresa={empresa} />;
}
