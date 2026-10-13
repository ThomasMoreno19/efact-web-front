import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { CatalogoPublicoPage } from '@/features/catalogo/components/catalogo-publico-page';
import {
  parseCatalogoCarritoEntries,
} from '@/features/catalogo/utils/catalogo-carrito-url';
import { parseCatalogoCodigoInterno } from '@/features/catalogo/utils/catalogo-share-url';
import { getEmpresaPublicaBySlug } from '@/features/empresa/services/empresa-public-query.service';

interface CatalogoPageProps {
  params: Promise<{ empresa: string }>;
  searchParams: Promise<{
    articulo?: string | string[];
    producto?: string | string[];
    detalle?: string | string[];
  }>;
}

export async function generateMetadata({
  params,
}: CatalogoPageProps): Promise<Metadata> {
  const { empresa: slug } = await params;
  const empresa = await getEmpresaPublicaBySlug(slug);
  return empresa ? { title: `${empresa.nombre} Catálogo` } : {};
}

export default async function CompanyCatalogPage({
  params,
  searchParams,
}: CatalogoPageProps) {
  const [{ empresa: slug }, query] = await Promise.all([params, searchParams]);
  const empresa = await getEmpresaPublicaBySlug(slug);
  if (!empresa) redirect('/');
  if (!empresa.catalogoHabilitado) notFound();
  const initialArticleCode = parseCatalogoCodigoInterno(query.producto);
  const detailParam = Array.isArray(query.detalle)
    ? query.detalle[0]
    : query.detalle;

  return (
    <CatalogoPublicoPage
      empresa={empresa}
      initialView="catalogo"
      initialCartEntries={parseCatalogoCarritoEntries(query.articulo)}
      initialArticleCode={initialArticleCode}
      initialOpenArticleDetails={Boolean(initialArticleCode && detailParam === '1')}
    />
  );
}
