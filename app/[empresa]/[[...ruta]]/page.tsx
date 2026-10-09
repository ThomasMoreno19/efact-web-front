import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getEmpresaPublicaBySlug } from '@/features/empresa/services/empresa-public-query.service';

interface CompanyRouteFallbackProps {
  params: Promise<{ empresa: string; ruta?: string[] }>;
}

const ROUTE_TITLES: Record<string, string> = {
  catalogo: 'Catálogo',
  saldo: 'Saldo',
  reparacion: 'Reparación',
};

export async function generateMetadata({
  params,
}: CompanyRouteFallbackProps): Promise<Metadata> {
  const { empresa: slug, ruta = [] } = await params;

  if (slug === 'admin' || slug === 'api' || slug === '_next') return {};

  const empresa = await getEmpresaPublicaBySlug(slug);
  if (!empresa) return {};

  const routeTitle = ruta[0] ? ROUTE_TITLES[ruta[0]] : undefined;
  return {
    title: routeTitle ? `${empresa.nombre} ${routeTitle}` : empresa.nombre,
  };
}

const PUBLIC_MODULES = [
  { key: 'catalogoHabilitado', path: 'catalogo', label: 'Catálogo' },
  { key: 'saldosHabilitados', path: 'saldo', label: 'Consulta de saldos' },
  {
    key: 'reparacionesHabilitadas',
    path: 'reparacion',
    label: 'Consulta de reparaciones',
  },
] as const;

export default async function CompanyRouteFallback({
  params,
}: CompanyRouteFallbackProps) {
  const { empresa: slug, ruta = [] } = await params;

  if (slug === 'admin') {
    redirect(ruta[0] === 'login' ? '/administracion/login' : '/administracion');
  }

  if (slug === 'api' || slug === '_next') notFound();

  const empresa = await getEmpresaPublicaBySlug(slug);
  if (!empresa) redirect('/');
  if (ruta.length > 0) redirect(`/${empresa.slug}`);

  const availableModules = PUBLIC_MODULES.filter(({ key }) => empresa[key]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12 text-foreground">
      <section className="w-full max-w-xl space-y-6 text-center">
        <p className="text-sm font-bold tracking-[0.2em] text-brand">E-FACT</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {empresa.nombre}
        </h1>
        {availableModules.length > 0 ? (
          <nav aria-label={`Páginas de ${empresa.nombre}`} className="grid gap-3">
            {availableModules.map(({ path, label }) => (
              <Link
                key={path}
                href={`/${empresa.slug}/${path}`}
                className="inline-flex min-h-12 items-center justify-center rounded-button bg-brand px-6 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {label}
              </Link>
            ))}
          </nav>
        ) : (
          <p className="text-sm leading-6 text-muted">
            Esta empresa no tiene páginas públicas habilitadas.
          </p>
        )}
      </section>
    </main>
  );
}
