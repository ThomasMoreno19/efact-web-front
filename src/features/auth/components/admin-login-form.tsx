"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { loginAdmin } from "@/features/auth/services/auth-client.service";

export function AdminLoginForm() {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);
    const nombre = String(formData.get("nombre") ?? "");
    const contrasena = String(formData.get("contrasena") ?? "");

    setFeedback(null);
    setIsSubmitting(true);
    try {
      const session = await loginAdmin(nombre, contrasena);
      router.replace(
        session.role === "Superadmin"
          ? "/admin"
          : `/${encodeURIComponent(session.empresaSlug)}/administracion`,
      );
      router.refresh();
    } catch (cause) {
      setFeedback(
        cause instanceof Error
          ? cause.message
          : "No se pudo iniciar sesión. Intentá nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form method="post" onSubmit={handleSubmit} className="space-y-5">
      <Input
        id="username"
        name="nombre"
        label="Nombre de usuario"
        type="text"
        placeholder="Ingresá tu nombre de usuario"
        autoComplete="username"
        required
      />
      <PasswordInput
        id="password"
        name="contrasena"
        label="Contraseña"
        placeholder="Ingresá tu contraseña"
        required
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-button bg-brand px-4 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Ingresando..." : "Iniciar sesión"}
        {!isSubmitting ? <ArrowRightIcon /> : null}
      </button>
      {feedback ? (
        <p
          role="alert"
          aria-live="assertive"
          className="rounded-input border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {feedback}
        </p>
      ) : null}
    </form>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-4"
    >
      <path d="M3.5 10h13m-5-5 5 5-5 5" />
    </svg>
  );
}
