import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/features/auth/components/admin-login-form";
import { getAdminSession } from "@/features/auth/services/admin-session.service";
import Logo from "../../../public/Logo.png";

export const metadata: Metadata = {
  title: "Acceso de superadmin | E-fact",
  description: "Iniciá sesión para administrar las empresas de E-fact.",
};

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin");
  }

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-10 text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-pill bg-brand/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-36 -left-24 size-96 rounded-pill bg-brand/5 blur-3xl"
      />

      <section className="relative w-full max-w-md overflow-hidden rounded-card border border-border bg-surface">
        <div aria-hidden="true" className="h-1 w-full bg-brand" />

        <div className="p-7 sm:p-10">
          <div className="mb-9 flex items-center gap-3">
            <Image
              src={Logo}
              alt="Logo de E-fact"
              priority
              className="size-10 object-contain"
            />
            <p className="text-base font-bold tracking-[0.16em] text-foreground">
              E-fact
            </p>
          </div>

          <div className="mb-8 space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Acceso de Adminitración
            </h1>
          </div>

          <AdminLoginForm />
        </div>
      </section>
    </main>
  );
}
