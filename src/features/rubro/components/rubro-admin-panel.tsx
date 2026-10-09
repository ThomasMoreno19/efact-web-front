"use client";

import { CatalogAdminPanel } from "@/components/admin/catalog-admin-panel";
import type { CatalogAdminDefinition } from "@/components/admin/catalog-admin-panel";
import {
  deleteRubro,
  getRubros,
  updateRubro,
  updateRubroWithImage,
} from "@/features/rubro/services/rubro-admin.service";
import type { Rubro } from "@/features/rubro/types/rubro";
import { getAccessibleImageUrl } from "@/services/image-url";

const definition: CatalogAdminDefinition<Rubro> = {
  label: "Rubros",
  presentation: "tiles",
  fields: [
    { id: "nombre", label: "Nombre", maxLength: 80, required: true },
    { id: "abreviatura", label: "Abreviatura", maxLength: 30 },
  ],
  loadPage: getRubros,
  updateRecord: updateRubro,
  updateRecordWithImage: updateRubroWithImage,
  deleteRecord: deleteRubro,
  getTitle: (rubro) => rubro.nombre,
  getImageUrl: (rubro) => getAccessibleImageUrl(rubro.logo_url?.trim() ?? null),
  getInitialValues: (rubro) => ({
    nombre: rubro.nombre,
    abreviatura: rubro.abreviatura ?? "",
  }),
  toUpdatePayload: (values) => ({
    nombre: requiredText(values.nombre),
    abreviatura: optionalText(values.abreviatura),
  }),
};

export function RubroAdminPanel({
  empresaId,
  onTotalChange,
}: {
  empresaId: number;
  onTotalChange: (total: number) => void;
}) {
  return (
    <CatalogAdminPanel
      empresaId={empresaId}
      definition={definition}
      onTotalChange={onTotalChange}
    />
  );
}

function requiredText(value: string | boolean | undefined) {
  const text = String(value ?? "").trim();
  if (!text) throw new Error("Completá los campos obligatorios.");
  return text;
}

function optionalText(value: string | boolean | undefined) {
  const text = String(value ?? "").trim();
  return text || null;
}
