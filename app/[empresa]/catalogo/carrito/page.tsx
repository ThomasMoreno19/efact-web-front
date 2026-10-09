import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { CatalogoPublicoPage } from '@/features/catalogo/components/catalogo-publico-page';
import { parseCatalogoCarritoEntries } from '@/features/catalogo/utils/catalogo-carrito-url';
import { getEmpresaPublicaBySlug } from '@/features/empresa/services/empresa-public-query.service';

interface CatalogoCarritoPageProps {
  params: Promise<{ empresa: string }>;
  searchParams: Promise<{ articulo?: string | string[] }>;
}

export async function generateMetadata({
  params,
}: CatalogoCarritoPageProps): Promise<Metadata> {
  const { empresa: slug } = await params;
  const empresa = await getEmpresaPublicaBySlug(slug);
  return empresa ? { title: `${empresa.nombre} Carrito` } : {};
}

export default async function CompanyCatalogCartPage({
  params,
  searchParams,
}: CatalogoCarritoPageProps) {
  const [{ empresa: slug }, query] = await Promise.all([params, searchParams]);
  const empresa = await getEmpresaPublicaBySlug(slug);
  if (!empresa) redirect('/');
  if (!empresa.catalogoHabilitado || !empresa.tieneCarrito) notFound();

  return (
    <CatalogoPublicoPage
      empresa={empresa}
      initialView="carrito"
      initialCartEntries={parseCatalogoCarritoEntries(query.articulo)}
    />
  );
}
