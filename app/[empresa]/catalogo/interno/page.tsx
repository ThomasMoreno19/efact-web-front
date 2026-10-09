import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { InternalModulePage } from "@/features/interno/components/internal-module-page";
import { getEmpresaPublicaBySlug } from "@/features/empresa/services/empresa-public-query.service";

interface InternalCatalogPageProps {
  params: Promise<{ empresa: string }>;
}

export async function generateMetadata({
  params,
}: InternalCatalogPageProps): Promise<Metadata> {
  const { empresa: slug } = await params;
  const empresa = await getEmpresaPublicaBySlug(slug);
  return empresa ? { title: `${empresa.nombre} Catálogo interno` } : {};
}

export default async function CompanyInternalCatalogPage({
  params,
}: InternalCatalogPageProps) {
  const { empresa: slug } = await params;
  const empresa = await getEmpresaPublicaBySlug(slug);
  if (!empresa) redirect("/");
  if (!empresa.catalogoHabilitado) notFound();

  return <InternalModulePage empresa={empresa} modulo="catalogo" />;
}
