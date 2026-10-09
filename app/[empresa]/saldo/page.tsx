import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ClientBalancePage } from "@/features/cliente/components/client-balance-page";
import { getEmpresaPublicaBySlug } from "@/features/empresa/services/empresa-public-query.service";

interface CompanyBalancePageProps {
  params: Promise<{ empresa: string }>;
}

export async function generateMetadata({
  params,
}: CompanyBalancePageProps): Promise<Metadata> {
  const { empresa: slug } = await params;
  const empresa = await getEmpresaPublicaBySlug(slug);
  return empresa ? { title: `${empresa.nombre} Saldo` } : {};
}

export default async function CompanyBalancePage({
  params,
}: CompanyBalancePageProps) {
  const { empresa: slug } = await params;
  const empresa = await getEmpresaPublicaBySlug(slug);
  if (!empresa) redirect("/");
  if (!empresa.saldosHabilitados) notFound();

  return <ClientBalancePage empresa={empresa} />;
}
