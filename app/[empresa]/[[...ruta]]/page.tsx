import Link from 'next/link';
import type { Metadata } from 'next';
import { ShoppingBag } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import { CompanyLogo } from '@/features/empresa/components/company-logo';
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
  {
    key: 'catalogoHabilitado',
    path: 'catalogo',
    label: 'Catálogo',
    description: 'Explorá los artículos disponibles y armá tu pedido para enviar por WhatsApp.',
    icon: ShoppingBag,
  },
  {
    key: 'saldosHabilitados',
    path: 'saldo',
    label: 'Saldo',
    description: 'Consultá tus saldos disponibles ingresando tu DNI o CUIL.',
    icon: 'saldo',
  },
  {
    key: 'reparacionesHabilitadas',
    path: 'reparacion',
    label: 'Reparación',
    description: 'Revisá el estado de los equipos que dejaste para reparar.',
    icon: 'reparacion',
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
        <div className="mx-auto flex h-24 w-fit max-w-full items-center justify-center overflow-hidden rounded-record bg-surface px-4">
          <CompanyLogo empresa={empresa} fitToHeight />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {empresa.nombre}
        </h1>
        {availableModules.length > 0 ? (
          <nav aria-label={`Páginas de ${empresa.nombre}`} className="grid gap-3 text-left">
            {availableModules.map(({ path, label, description, icon }) => (
              <Link
                key={path}
                href={`/${empresa.slug}/${path}`}
                className="flex min-h-24 items-center gap-4 rounded-card border border-border bg-surface p-4 transition hover:border-brand/40 hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-button bg-brand/10 text-brand">
                  {icon === 'saldo' ? (
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-6">
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="M3 10h18m-5 5h2" />
                    </svg>
                  ) : icon === 'reparacion' ? (
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-6">
                      <path d="M14.5 6.5a5 5 0 0 0-6.4 6.4l-4.8 4.8a2.1 2.1 0 0 0 3 3l4.8-4.8a5 5 0 0 0 6.4-6.4l-3 3-3-3 3-3Z" />
                    </svg>
                  ) : (
                    <ShoppingBag aria-hidden="true" className="size-6" strokeWidth={1.7} />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-semibold text-foreground">{label}</span>
                  <span className="mt-1 block text-sm leading-5 text-muted">{description}</span>
                </span>
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
