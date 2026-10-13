"use client";

import { useEffect, useState, type FormEvent } from "react";
import { DialogShell } from "@/components/ui/dialog-shell";
import {
  createEmpresa,
  uploadEmpresaLogo,
  updateEmpresa,
} from "@/features/empresa/services/empresa-client.service";
import type { Empresa } from "@/features/empresa/types/empresa";
import {
  normalizeSlugInput,
  toSlug,
} from "@/features/empresa/utils/to-slug";
import { CompanyFormFields } from "@/features/empresa/components/company-form-fields";
import {
  getCompanyAdminUser,
  saveCompanyAdminUser,
} from "@/features/empresa/services/company-admin-user.service";
import {
  ACCEPTED_LOGO_MIME_TYPES,
  MAX_LOGO_SIZE_BYTES,
} from "@/features/empresa/constants/logo-upload";

interface CompanyFormDialogProps {
  empresa?: Empresa;
  onClose: () => void;
  onSaved: (notice?: string) => void;
}

export function CompanyFormDialog({
  empresa,
  onClose,
  onSaved,
}: CompanyFormDialogProps) {
  const [nombre, setNombre] = useState(empresa?.nombre ?? "");
  const [slug, setSlug] = useState(empresa?.slug ?? "");
  const [telefono, setTelefono] = useState(empresa?.telefono ?? "");
  const [ubicacion, setUbicacion] = useState(empresa?.ubicacion ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(empresa));
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminUserExists, setAdminUserExists] = useState(false);
  const [isLoadingAdminUser, setIsLoadingAdminUser] = useState(Boolean(empresa));
  const [adminUserLoadError, setAdminUserLoadError] = useState<string | null>(
    null,
  );
  const [adminUserLoadAttempt, setAdminUserLoadAttempt] = useState(0);
  const [createdEmpresaId, setCreatedEmpresaId] = useState<number | null>(null);
  const [tieneCarrito, setTieneCarrito] = useState(
    empresa?.tieneCarrito ?? false,
  );
  const [catalogoHabilitado, setCatalogoHabilitado] = useState(
    empresa?.catalogoHabilitado ?? false,
  );
  const [saldosHabilitados, setSaldosHabilitados] = useState(
    empresa?.saldosHabilitados ?? false,
  );
  const [reparacionesHabilitadas, setReparacionesHabilitadas] = useState(
    empresa?.reparacionesHabilitadas ?? false,
  );
  const [habilitarExcel, setHabilitarExcel] = useState(
    empresa?.habilitarExcel ?? true,
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!empresa) return;
    const controller = new AbortController();
    getCompanyAdminUser(empresa.id, controller.signal)
      .then((adminUser) => {
        setAdminUserExists(adminUser !== null);
        setAdminUsername(adminUser?.nombre ?? "");
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setAdminUserLoadError(
            cause instanceof Error
              ? cause.message
              : "No se pudo cargar el usuario Admin de la empresa.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingAdminUser(false);
      });
    return () => controller.abort();
  }, [empresa, adminUserLoadAttempt]);

  function handleNombreChange(value: string) {
    setNombre(value);
    if (!slugEdited) setSlug(toSlug(value));
  }

  function handleSlugChange(value: string) {
    setSlugEdited(true);
    setSlug(normalizeSlugInput(value));
  }

  function retryLoadAdminUser() {
    setAdminUserLoadError(null);
    setIsLoadingAdminUser(true);
    setAdminUserLoadAttempt((attempt) => attempt + 1);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    setError(null);
    if (isLoadingAdminUser || adminUserLoadError) return;
    if (!adminUsername.trim()) {
      setError("Ingresá el nombre de usuario Admin de la empresa.");
      return;
    }
    if (!adminUserExists && !adminPassword) {
      setError("Ingresá una contraseña para el usuario Admin.");
      return;
    }
    if (logoFile && logoFile.size > MAX_LOGO_SIZE_BYTES) {
      setError("El logo no puede superar los 50 MB.");
      return;
    }
    if (
      logoFile &&
      !ACCEPTED_LOGO_MIME_TYPES.includes(
        logoFile.type as (typeof ACCEPTED_LOGO_MIME_TYPES)[number],
      )
    ) {
      setError("El logo debe estar en formato PNG, JPG o WebP.");
      return;
    }

    const normalizedSlug = normalizeSlugInput(slug);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)) {
      setError(
        "El slug debe tener letras o números y usar un solo guion entre ellos, sin guiones al inicio ni al final.",
      );
      return;
    }

    const normalizedTelefono = telefono.trim();
    if (
      normalizedTelefono &&
      !/^\+[1-9](?:[ -]?\d){7,14}$/.test(normalizedTelefono)
    ) {
      setError(
        "Ingresá el teléfono en formato WhatsApp, por ejemplo: +54 9 3535 64-6689.",
      );
      return;
    }

    setIsSaving(true);
    const input = {
      nombre: nombre.trim(),
      slug: normalizedSlug,
      telefono: normalizedTelefono || null,
      ubicacion: ubicacion.trim() || null,
      tieneCarrito,
      habilitarExcel,
      catalogoHabilitado,
      saldosHabilitados,
      reparacionesHabilitadas,
    };

    try {
      let empresaId: number;
      if (empresa) {
        await updateEmpresa(empresa.id, input);
        empresaId = empresa.id;
      } else if (createdEmpresaId !== null) {
        await updateEmpresa(createdEmpresaId, input);
        empresaId = createdEmpresaId;
      } else {
        const createdEmpresa = await createEmpresa(input);
        empresaId = createdEmpresa.id;
        setCreatedEmpresaId(createdEmpresa.id);
      }

      await saveCompanyAdminUser(empresaId, {
        nombre: adminUsername.trim(),
        ...(adminPassword ? { contrasena: adminPassword } : {}),
      });
      setAdminUserExists(true);
      setAdminPassword("");

      if (logoFile) await uploadEmpresaLogo(empresaId, logoFile);
      onSaved();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "No se pudo guardar la empresa.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <DialogShell
      title={empresa ? "Editar empresa" : "Agregar empresa"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <CompanyFormFields
          nombre={nombre}
          onNombreChange={handleNombreChange}
          slug={slug}
          onSlugChange={handleSlugChange}
          telefono={telefono}
          onTelefonoChange={setTelefono}
          ubicacion={ubicacion}
          onUbicacionChange={setUbicacion}
          currentLogoUrl={empresa?.logo_url ?? null}
          logoFile={logoFile}
          onLogoFileChange={setLogoFile}
          adminUsername={adminUsername}
          onAdminUsernameChange={setAdminUsername}
          adminPassword={adminPassword}
          onAdminPasswordChange={setAdminPassword}
          adminUserExists={adminUserExists}
          isLoadingAdminUser={isLoadingAdminUser}
          adminUserLoadError={adminUserLoadError}
          onRetryAdminUserLoad={retryLoadAdminUser}
          tieneCarrito={tieneCarrito}
          onTieneCarritoChange={setTieneCarrito}
          catalogoHabilitado={catalogoHabilitado}
          onCatalogoHabilitadoChange={setCatalogoHabilitado}
          saldosHabilitados={saldosHabilitados}
          onSaldosHabilitadosChange={setSaldosHabilitados}
          reparacionesHabilitadas={reparacionesHabilitadas}
          onReparacionesHabilitadasChange={setReparacionesHabilitadas}
          habilitarExcel={habilitarExcel}
          onHabilitarExcelChange={setHabilitarExcel}
        />
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-button border border-border px-4 text-sm font-medium transition hover:bg-surface-raised"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving || isLoadingAdminUser || Boolean(adminUserLoadError)}
            className="h-11 rounded-button bg-brand px-5 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </DialogShell>
  );
}
