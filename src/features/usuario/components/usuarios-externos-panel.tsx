"use client";

import { useEffect, useState, type FormEvent } from "react";
import { UserRound } from "lucide-react";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { DialogShell } from "@/components/ui/dialog-shell";
import { PasswordInput } from "@/components/ui/password-input";
import { useStatusToast } from "@/components/ui/status-toast";
import { UsuarioAccesoCard } from "@/features/usuario/components/usuario-acceso-card";
import { createUsuarioExterno, deleteUsuarioExterno, getUsuariosExternos, updateUsuarioExterno } from "@/features/usuario/services/usuario-externo.service";
import type { UsuarioExterno } from "@/features/usuario/types/usuario-externo";

export function UsuariosExternosPanel({ empresaId }: { empresaId: number }) {
  const showStatusToast = useStatusToast();
  const [usuarios, setUsuarios] = useState<UsuarioExterno[]>([]);
  const [password, setPassword] = useState("");
  const [editingUsuario, setEditingUsuario] = useState<UsuarioExterno | null>(null);
  const [deletingUsuario, setDeletingUsuario] = useState<UsuarioExterno | null>(null);
  const [editingPassword, setEditingPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getUsuariosExternos(empresaId, controller.signal).then(setUsuarios).catch((cause: unknown) => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "No se pudieron cargar los usuarios externos.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [empresaId]);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password || saving) return;
    setSaving(true); setError(null);
    try {
      const created = await createUsuarioExterno(empresaId, password);
      setUsuarios((current) => [...current, created]); setPassword(""); showStatusToast("La cuenta externa se agregó correctamente.", "success");
    } catch (cause) { showStatusToast(cause instanceof Error ? cause.message : "No se pudo agregar la cuenta externa.", "error"); }
    finally { setSaving(false); }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingUsuario || !editingPassword || saving) return;
    setSaving(true); setError(null);
    try {
      await updateUsuarioExterno(empresaId, editingUsuario.id, editingPassword);
      showStatusToast("La contraseña externa se actualizó correctamente.", "success");
      setEditingUsuario(null); setEditingPassword("");
    } catch (cause) { showStatusToast(cause instanceof Error ? cause.message : "No se pudo actualizar la contraseña.", "error"); }
    finally { setSaving(false); }
  }

  async function remove(usuario: UsuarioExterno) {
    if (saving) return;
    setSaving(true); setError(null);
    try {
      await deleteUsuarioExterno(empresaId, usuario.id);
      setUsuarios((current) => current.filter((item) => item.id !== usuario.id)); showStatusToast("La cuenta externa se eliminó correctamente.", "success"); setDeletingUsuario(null);
    } catch (cause) { showStatusToast(cause instanceof Error ? cause.message : "No se pudo eliminar la cuenta externa.", "error"); }
    finally { setSaving(false); }
  }

  return (
    <>
    <CollapsibleSection title="Usuarios externos" icon={<UserRound aria-hidden="true" className="size-6 text-muted" strokeWidth={1.7} />}>
      <p className="mt-3 text-sm leading-6 text-muted">Cada cuenta externa ingresa al catálogo de esta empresa usando su contraseña.</p>
      {error ? <p role="alert" className="mt-4 text-sm text-danger">{error}</p> : null}
      {loading ? <p role="status" className="mt-4 text-sm text-muted">Cargando cuentas…</p> : null}
      {!loading && usuarios.length === 0 ? <p className="mt-4 text-sm text-muted">Todavía no hay cuentas externas.</p> : null}
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {usuarios.map((usuario) => (
          <UsuarioAccesoCard
            key={usuario.id}
            usuario={usuario}
            tipo="externo"
            onEdit={() => { setEditingUsuario(usuario); setEditingPassword(""); }}
            onDelete={() => setDeletingUsuario(usuario)}
          />
        ))}
      </ul>
      <form onSubmit={add} className="mt-6 grid gap-4">
        <h3 className="text-sm font-semibold">Agregar cuenta externa</h3>
        <PasswordInput id="usuario-externo-contrasena" label="Contraseña" value={password} maxLength={72} autoComplete="new-password" required onChange={(event) => setPassword(event.currentTarget.value)} />
        <div><button type="submit" disabled={saving || !password} className="inline-flex min-h-11 items-center justify-center rounded-button bg-brand px-5 text-sm font-semibold text-brand-foreground disabled:opacity-60">{saving ? "Guardando…" : "Agregar"}</button></div>
      </form>
    </CollapsibleSection>
      {editingUsuario ? (
        <DialogShell title="Cambiar contraseña externa" onClose={() => { if (!saving) setEditingUsuario(null); }}>
          <form onSubmit={changePassword}>
            <PasswordInput id="usuario-externo-editar-contrasena" label="Nueva contraseña" value={editingPassword} maxLength={72} autoComplete="new-password" required disabled={saving} onChange={(event) => setEditingPassword(event.currentTarget.value)} />
            {error ? <p role="alert" className="mt-4 text-sm text-danger">{error}</p> : null}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditingUsuario(null)} disabled={saving} className="h-11 rounded-button border border-border px-5 text-sm font-semibold">Cancelar</button>
              <button type="submit" disabled={saving || !editingPassword} className="h-11 rounded-button bg-brand px-5 text-sm font-semibold text-brand-foreground disabled:opacity-60">{saving ? "Guardando…" : "Guardar cambios"}</button>
            </div>
          </form>
        </DialogShell>
      ) : null}
      {deletingUsuario ? (
        <DialogShell title="Eliminar usuario externo" onClose={() => { if (!saving) setDeletingUsuario(null); }}>
          <p className="text-sm leading-6 text-muted">¿Querés eliminar este usuario externo? Esta acción no se puede deshacer.</p>
          {error ? <p role="alert" className="mt-4 text-sm text-danger">{error}</p> : null}
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => setDeletingUsuario(null)} disabled={saving} className="h-11 rounded-button border border-border px-5 text-sm font-semibold">Cancelar</button>
            <button type="button" onClick={() => void remove(deletingUsuario)} disabled={saving} className="h-11 rounded-button bg-danger px-5 text-sm font-semibold text-background disabled:opacity-60">{saving ? "Eliminando…" : "Eliminar usuario"}</button>
          </div>
        </DialogShell>
      ) : null}
    </>
  );
}
