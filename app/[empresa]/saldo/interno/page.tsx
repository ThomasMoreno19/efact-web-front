import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { InternalModulePage } from "@/features/interno/components/internal-module-page";
import { getEmpresaPublicaBySlug } from "@/features/empresa/services/empresa-public-query.service";

interface InternalBalancePageProps {
  params: Promise<{ empresa: string }>;
}

export async function generateMetadata({
  params,
}: InternalBalancePageProps): Promise<Metadata> {
  const { empresa: slug } = await params;
  const empresa = await getEmpresaPublicaBySlug(slug);
  return empresa ? { title: `${empresa.nombre} Saldos internos` } : {};
}

export default async function CompanyInternalBalancePage({
  params,
}: InternalBalancePageProps) {
  const { empresa: slug } = await params;
  const empresa = await getEmpresaPublicaBySlug(slug);
  if (!empresa) redirect("/");
  if (!empresa.saldosHabilitados) notFound();

  return <InternalModulePage empresa={empresa} modulo="saldo" />;
}
