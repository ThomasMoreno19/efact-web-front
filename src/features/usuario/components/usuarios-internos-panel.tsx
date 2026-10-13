"use client";

import { useEffect, useState, type FormEvent } from "react";
import { UserRound } from "lucide-react";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { DialogShell } from "@/components/ui/dialog-shell";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { UsuarioInternoCard } from "@/features/usuario/components/usuario-interno-card";
import {
  createUsuarioInterno,
  deleteUsuarioInterno,
  getUsuariosInternos,
  updateUsuarioInterno,
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
  const [editingUsuario, setEditingUsuario] = useState<UsuarioInterno | null>(null);
  const [deletingUsuario, setDeletingUsuario] = useState<UsuarioInterno | null>(null);
  const [editingNombre, setEditingNombre] = useState("");
  const [editingContrasena, setEditingContrasena] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
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

  function openEditDialog(usuario: UsuarioInterno) {
    setEditingUsuario(usuario);
    setEditingNombre(usuario.nombre);
    setEditingContrasena("");
    setDialogError(null);
  }

  function openDeleteDialog(usuario: UsuarioInterno) {
    setDeletingUsuario(usuario);
    setDialogError(null);
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingUsuario || isSaving) return;
    if (editingNombre.trim().length === 0) {
      setDialogError("Ingresá un nombre de usuario.");
      return;
    }

    setIsSaving(true);
    setDialogError(null);
    setError(null);
    setNotice(null);
    try {
      const updatedUsuario = await updateUsuarioInterno(
        empresaId,
        editingUsuario.id,
        {
          nombre: editingNombre.trim(),
          ...(editingContrasena
            ? { contrasena: editingContrasena }
            : {}),
        },
      );
      setUsuarios((current) =>
        current.map((usuario) =>
          usuario.id === updatedUsuario.id ? updatedUsuario : usuario,
        ),
      );
      setNotice("El usuario interno se actualizó correctamente.");
      setEditingUsuario(null);
      setEditingContrasena("");
    } catch (cause) {
      setDialogError(
        cause instanceof Error
          ? cause.message
          : "No se pudo actualizar el usuario interno.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteUsuario() {
    if (!deletingUsuario || isSaving) return;

    setIsSaving(true);
    setDialogError(null);
    setError(null);
    setNotice(null);
    try {
      await deleteUsuarioInterno(empresaId, deletingUsuario.id);
      setUsuarios((current) =>
        current.filter((usuario) => usuario.id !== deletingUsuario.id),
      );
      setNotice("El usuario interno se eliminó correctamente.");
      setDeletingUsuario(null);
    } catch (cause) {
      setDialogError(
        cause instanceof Error
          ? cause.message
          : "No se pudo eliminar el usuario interno.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <CollapsibleSection
        title="Usuarios internos"
        icon={
          <UserRound
            aria-hidden="true"
            className="size-6 text-muted"
            strokeWidth={1.7}
          />
        }
      >
        <p className="text-sm leading-6 text-muted">
          Pueden consultar el catálogo interno y los saldos de esta empresa.
        </p>

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
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {usuarios.map((usuario) => (
                <UsuarioInternoCard
                  key={usuario.id}
                  usuario={usuario}
                  onEdit={() => openEditDialog(usuario)}
                  onDelete={() => openDeleteDialog(usuario)}
                />
              ))}
            </ul>
          ) : null}
        </div>

        <div className="mt-7 border-t border-border pt-5">
          <h3 className="text-sm font-semibold">Agregar usuario interno</h3>
          <form
            onSubmit={handleSubmit}
            className="mt-4 grid gap-4 sm:grid-cols-2"
          >
            <fieldset
              disabled={isSaving}
              className="contents"
            >
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
            </fieldset>
            <div className="sm:col-span-2 sm:flex sm:justify-end">
              <button
                type="submit"
                disabled={
                  isSaving ||
                  nombre.trim().length === 0 ||
                  contrasena.length === 0
                }
                className="inline-flex min-h-11 w-full items-center justify-center rounded-button bg-brand px-5 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isSaving ? "Guardando…" : "Agregar usuario interno"}
              </button>
            </div>
          </form>
        </div>
      </CollapsibleSection>

      {editingUsuario ? (
        <DialogShell
          title="Editar usuario interno"
          onClose={() => {
            if (isSaving) return;
            setEditingUsuario(null);
            setDialogError(null);
          }}
        >
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4">
              <Input
                id="usuario-interno-editar-nombre"
                label="Nombre de usuario"
                value={editingNombre}
                maxLength={255}
                autoComplete="off"
                required
                disabled={isSaving}
                onChange={(event) =>
                  setEditingNombre(event.currentTarget.value)
                }
              />
              <PasswordInput
                id="usuario-interno-editar-contrasena"
                label="Nueva contraseña"
                value={editingContrasena}
                maxLength={72}
                autoComplete="new-password"
                disabled={isSaving}
                onChange={(event) =>
                  setEditingContrasena(event.currentTarget.value)
                }
              />
              <p className="text-xs leading-5 text-muted">
                Dejá la contraseña vacía para conservar la actual.
              </p>
            </div>
            {dialogError ? (
              <p role="alert" className="mt-4 text-sm text-danger">
                {dialogError}
              </p>
            ) : null}
            <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setEditingUsuario(null)}
                disabled={isSaving}
                className="h-11 rounded-button border border-border px-5 text-sm font-semibold transition hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="h-11 rounded-button bg-brand px-5 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </form>
        </DialogShell>
      ) : null}

      {deletingUsuario ? (
        <DialogShell
          title="Eliminar usuario interno"
          onClose={() => {
            if (isSaving) return;
            setDeletingUsuario(null);
            setDialogError(null);
          }}
        >
          <p className="text-sm leading-6 text-muted">
            ¿Querés eliminar el usuario <strong>{deletingUsuario.nombre}</strong>?
            Esta acción no se puede deshacer.
          </p>
          {dialogError ? (
            <p role="alert" className="mt-4 text-sm text-danger">
              {dialogError}
            </p>
          ) : null}
          <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setDeletingUsuario(null)}
              disabled={isSaving}
              className="h-11 rounded-button border border-border px-5 text-sm font-semibold transition hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteUsuario()}
              disabled={isSaving}
              className="h-11 rounded-button bg-danger px-5 text-sm font-semibold text-background transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Eliminando…" : "Eliminar usuario"}
            </button>
          </div>
        </DialogShell>
      ) : null}
    </>
  );
}
