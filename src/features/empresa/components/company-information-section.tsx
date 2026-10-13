"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { CompanyLogo } from "@/features/empresa/components/company-logo";
import { CompanyLogoUploadField } from "@/features/empresa/components/company-logo-upload-field";
import {
  updateEmpresaInformation,
  uploadEmpresaLogo,
} from "@/features/empresa/services/empresa-client.service";
import type { Empresa } from "@/features/empresa/types/empresa";

export function CompanyInformationSection({
  empresa,
}: {
  empresa: Empresa;
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState(empresa.nombre);
  const [telefono, setTelefono] = useState(empresa.telefono ?? "");
  const [ubicacion, setUbicacion] = useState(empresa.ubicacion ?? "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function saveCompanyInformation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      await updateEmpresaInformation(empresa.id, {
        nombre: nombre.trim(),
        telefono: telefono.trim() || null,
        ubicacion: ubicacion.trim() || null,
      });

      if (logoFile) {
        try {
          await uploadEmpresaLogo(empresa.id, logoFile);
        } catch (cause) {
          router.refresh();
          const detail =
            cause instanceof Error ? ` ${cause.message}` : "";
          throw new Error(
            `La información se guardó, pero no se pudo actualizar el logo.${detail}`,
          );
        }
        setLogoFile(null);
      }

      setNotice("La información de la empresa se guardó correctamente.");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo guardar la información de la empresa.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <CollapsibleSection
      title={`Información de ${empresa.nombre}`}
      icon={
        <span
          aria-hidden="true"
          className="relative inline-flex size-12 overflow-hidden rounded-button border border-border bg-field"
        >
          <CompanyLogo empresa={empresa} />
        </span>
      }
    >
      <form onSubmit={saveCompanyInformation}>
        <fieldset disabled={isSaving} className="space-y-5">
          <Input
            id="company-information-name"
            label="Nombre de la empresa"
            value={nombre}
            onChange={(event) => setNombre(event.currentTarget.value)}
            maxLength={100}
            required
          />
          <Input
            id="company-information-phone"
            label="Teléfono"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={telefono}
            onChange={(event) => setTelefono(event.currentTarget.value)}
            placeholder="+54 9 3535 12-3456"
            maxLength={18}
          />
          <Input
            id="company-information-location"
            label="Ubicación"
            value={ubicacion}
            onChange={(event) => setUbicacion(event.currentTarget.value)}
            placeholder="Antonio Sobral 299, Villa María"
            maxLength={50}
          />
          <CompanyLogoUploadField
            currentLogoUrl={empresa.logo_url}
            file={logoFile}
            onFileChange={setLogoFile}
            disabled={isSaving}
          />
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
            {isSaving ? "Guardando…" : "Guardar información"}
          </button>
        </div>
      </form>
    </CollapsibleSection>
  );
}
