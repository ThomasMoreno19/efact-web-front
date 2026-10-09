import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12 text-foreground">
      <section className="w-full max-w-xl space-y-5 text-center">
        <p className="text-sm font-bold tracking-[0.2em] text-brand">E-FACT</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Gestión empresarial en un solo lugar
        </h1>
        <p className="mx-auto max-w-md text-sm leading-6 text-muted">
          Accedé a las herramientas y consultas disponibles para cada empresa.
        </p>
        <Link
          href="/administracion"
          className="inline-flex h-12 items-center justify-center rounded-button bg-brand px-6 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Administración
        </Link>
      </section>
    </main>
  );
}
