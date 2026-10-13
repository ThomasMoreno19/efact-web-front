"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { UserRound } from "lucide-react";
import {
  getCompanyAdminUser,
  saveCompanyAdminUser,
  updateCompanyAdminUser,
  type CompanyAdminUser,
} from "@/features/empresa/services/company-admin-user.service";

export function CompanyAdminUserSettings({
  empresaId,
}: {
  empresaId: number;
}) {
  const [adminUser, setAdminUser] = useState<CompanyAdminUser | null>(null);
  const [nombre, setNombre] = useState("");
  const [contrasenaActual, setContrasenaActual] = useState("");
  const [contrasenaNueva, setContrasenaNueva] = useState("");
  const [repetirContrasenaNueva, setRepetirContrasenaNueva] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const passwordChangeRequested = Boolean(
    contrasenaActual || contrasenaNueva || repetirContrasenaNueva,
  );

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setLoadError(null);

    getCompanyAdminUser(empresaId, controller.signal)
      .then((user) => {
        if (controller.signal.aborted) return;
        setAdminUser(user);
        setNombre(user?.nombre ?? "");
      })
      .catch((cause) => {
        if (controller.signal.aborted) return;
        setLoadError(
          cause instanceof Error
            ? cause.message
            : "No se pudo cargar el usuario de la empresa.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [empresaId, reloadKey]);

  async function saveAdminUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    setError(null);
    setNotice(null);

    if (nombre.trim().length === 0) {
      setError("Ingresá un nombre de usuario.");
      return;
    }
    if (
      !adminUser &&
      (!contrasenaNueva || !repetirContrasenaNueva)
    ) {
      setError("Ingresá una contraseña y repetila para crear el usuario.");
      return;
    }
    if (
      (passwordChangeRequested || !adminUser) &&
      adminUser &&
      (!contrasenaActual || !contrasenaNueva || !repetirContrasenaNueva)
    ) {
      setError(
        "Para cambiar la contraseña, completá la actual, la nueva y su repetición.",
      );
      return;
    }
    if (
      (passwordChangeRequested || !adminUser) &&
      contrasenaNueva.length < 6
    ) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (
      (passwordChangeRequested || !adminUser) &&
      contrasenaNueva !== repetirContrasenaNueva
    ) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsSaving(true);
    try {
      const savedUser = adminUser
        ? await updateCompanyAdminUser(empresaId, {
            nombre: nombre.trim(),
            ...(passwordChangeRequested
              ? { contrasenaActual, contrasenaNueva }
              : {}),
          })
        : await saveCompanyAdminUser(empresaId, {
            nombre: nombre.trim(),
            contrasena: contrasenaNueva,
          });
      setAdminUser(savedUser);
      setNombre(savedUser.nombre);
      setContrasenaActual("");
      setContrasenaNueva("");
      setRepetirContrasenaNueva("");
      setNotice(
        adminUser
          ? "Los datos del usuario se guardaron correctamente."
          : "El usuario se creó correctamente.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudieron guardar los datos del usuario.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <CollapsibleSection
      title="Usuario"
      icon={
        <UserRound
          aria-hidden="true"
          className="size-6 text-muted"
          strokeWidth={1.7}
        />
      }
    >
      {isLoading ? (
        <p role="status" className="text-sm text-muted">
          Cargando el usuario…
        </p>
      ) : loadError ? (
        <div className="flex flex-wrap items-center gap-3">
          <p role="alert" className="text-sm text-danger">
            {loadError}
          </p>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="text-sm font-medium text-foreground underline underline-offset-2"
          >
            Reintentar
          </button>
        </div>
      ) : !adminUser ? (
        <AdminUserForm
          nombre={nombre}
          onNombreChange={setNombre}
          contrasenaNueva={contrasenaNueva}
          onContrasenaNuevaChange={setContrasenaNueva}
          repetirContrasenaNueva={repetirContrasenaNueva}
          onRepetirContrasenaNuevaChange={setRepetirContrasenaNueva}
          error={error}
          notice={notice}
          isSaving={isSaving}
          isExistingUser={false}
          onSubmit={saveAdminUser}
        />
      ) : (
        <AdminUserForm
          nombre={nombre}
          onNombreChange={setNombre}
          contrasenaActual={contrasenaActual}
          onContrasenaActualChange={setContrasenaActual}
          contrasenaNueva={contrasenaNueva}
          onContrasenaNuevaChange={setContrasenaNueva}
          repetirContrasenaNueva={repetirContrasenaNueva}
          onRepetirContrasenaNuevaChange={setRepetirContrasenaNueva}
          error={error}
          notice={notice}
          isSaving={isSaving}
          isExistingUser
          onSubmit={saveAdminUser}
        />
      )}
    </CollapsibleSection>
  );
}

function AdminUserForm({
  nombre,
  onNombreChange,
  contrasenaActual,
  onContrasenaActualChange,
  contrasenaNueva,
  onContrasenaNuevaChange,
  repetirContrasenaNueva,
  onRepetirContrasenaNuevaChange,
  error,
  notice,
  isSaving,
  isExistingUser,
  onSubmit,
}: {
  nombre: string;
  onNombreChange: (value: string) => void;
  contrasenaActual?: string;
  onContrasenaActualChange?: (value: string) => void;
  contrasenaNueva: string;
  onContrasenaNuevaChange: (value: string) => void;
  repetirContrasenaNueva: string;
  onRepetirContrasenaNuevaChange: (value: string) => void;
  error: string | null;
  notice: string | null;
  isSaving: boolean;
  isExistingUser: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <>
      {!isExistingUser ? (
        <p className="mb-5 text-sm text-muted">
          Esta empresa todavía no tiene un usuario asociado. Podés crearlo acá.
        </p>
      ) : null}
      <form onSubmit={onSubmit}>
        <fieldset disabled={isSaving} className="space-y-5">
          <Input
            id="company-admin-username"
            label="Nombre de usuario"
            value={nombre}
            onChange={(event) => onNombreChange(event.currentTarget.value)}
            autoComplete="username"
            maxLength={255}
            required
          />

          <div className="space-y-4 border-t border-border pt-5">
            <div>
              <h3 className="text-sm font-semibold">
                {isExistingUser ? "Cambiar contraseña" : "Crear contraseña"}
              </h3>
              <p className="mt-1 text-xs leading-5 text-muted">
                {isExistingUser
                  ? "Dejá los campos vacíos si no querés cambiarla. La nueva contraseña requiere al menos 6 caracteres."
                  : "La contraseña debe tener al menos 6 caracteres."}
              </p>
            </div>
            {isExistingUser ? (
              <PasswordInput
                id="company-admin-current-password"
                label="Contraseña actual"
                value={contrasenaActual ?? ""}
                onChange={(event) =>
                  onContrasenaActualChange?.(event.currentTarget.value)
                }
                autoComplete="current-password"
                maxLength={72}
              />
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <PasswordInput
                id="company-admin-new-password"
                label={isExistingUser ? "Nueva contraseña" : "Contraseña"}
                value={contrasenaNueva}
                onChange={(event) =>
                  onContrasenaNuevaChange(event.currentTarget.value)
                }
                autoComplete="new-password"
                maxLength={72}
              />
              <PasswordInput
                id="company-admin-repeat-password"
                label={
                  isExistingUser
                    ? "Repetir nueva contraseña"
                    : "Repetir contraseña"
                }
                value={repetirContrasenaNueva}
                onChange={(event) =>
                  onRepetirContrasenaNuevaChange(event.currentTarget.value)
                }
                autoComplete="new-password"
                maxLength={72}
              />
            </div>
          </div>
        </fieldset>

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
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="h-11 rounded-button bg-brand px-5 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving
              ? "Guardando…"
              : isExistingUser
                ? "Guardar usuario"
                : "Crear usuario"}
          </button>
        </div>
      </form>
    </>
  );
}
