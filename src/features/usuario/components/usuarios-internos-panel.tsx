"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  createUsuarioInterno,
  getUsuariosInternos,
} from "@/features/usuario/services/usuario-interno.service";
import type { UsuarioInterno } from "@/features/usuario/types/usuario-interno";

export function UsuariosInternosPanel({
  empresaId,
}: {
  empresaId: number;
}) {
  const [usuarios, setUsuarios] = useState<UsuarioInterno[]>([]);
  const [nombre, setNombre] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getUsuariosInternos(empresaId, controller.signal)
      .then(setUsuarios)
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "No se pudieron cargar los usuarios internos.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [empresaId, reloadKey]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      await createUsuarioInterno(empresaId, { nombre: nombre.trim(), contrasena });
      setNombre("");
      setContrasena("");
      setNotice("El usuario interno se agregó correctamente.");
      setIsLoading(true);
      setReloadKey((current) => current + 1);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo agregar el usuario interno.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <CollapsibleSection title="Usuarios internos">
      <p className="text-sm leading-6 text-muted">
        Pueden consultar el catálogo interno y los saldos de esta empresa.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <Input
          id="usuario-interno-nombre"
          label="Nombre de usuario"
          value={nombre}
          maxLength={255}
          autoComplete="off"
          required
          onChange={(event) => setNombre(event.currentTarget.value)}
        />
        <PasswordInput
          id="usuario-interno-contrasena"
          label="Contraseña"
          value={contrasena}
          maxLength={72}
          autoComplete="new-password"
          required
          onChange={(event) => setContrasena(event.currentTarget.value)}
        />
        <div className="sm:col-span-2 sm:flex sm:justify-end">
          <button
            type="submit"
            disabled={isSaving || nombre.trim().length === 0 || contrasena.length === 0}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-button bg-brand px-5 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isSaving ? "Agregando…" : "Agregar usuario interno"}
          </button>
        </div>
      </form>

      {error ? (
        <p role="alert" className="mt-5 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="mt-5 text-sm text-muted">
          {notice}
        </p>
      ) : null}

      <div className="mt-6 border-t border-border pt-5">
        <h3 className="text-sm font-semibold">Usuarios de esta empresa</h3>
        {isLoading ? (
          <p role="status" className="mt-3 text-sm text-muted">
            Cargando usuarios…
          </p>
        ) : null}
        {!isLoading && !error && usuarios.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Todavía no hay usuarios internos.
          </p>
        ) : null}
        {!isLoading && usuarios.length > 0 ? (
          <ul className="mt-3 divide-y divide-border">
            {usuarios.map((usuario) => (
              <li key={usuario.id} className="py-3 text-sm font-medium">
                {usuario.nombre}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </CollapsibleSection>
  );
}
