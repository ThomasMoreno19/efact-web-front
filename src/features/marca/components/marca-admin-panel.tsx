"use client";

import { CatalogAdminPanel } from "@/components/admin/catalog-admin-panel";
import type { CatalogAdminDefinition } from "@/components/admin/catalog-admin-panel";
import {
  deleteMarca,
  getMarcas,
  updateMarca,
  updateMarcaWithImage,
} from "@/features/marca/services/marca-admin.service";
import type { Marca } from "@/features/marca/types/marca";
import { getAccessibleImageUrl } from "@/services/image-url";

const definition: CatalogAdminDefinition<Marca> = {
  label: "Marcas",
  presentation: "tiles",
  fields: [
    { id: "nombre", label: "Nombre", maxLength: 255, required: true },
    { id: "abreviatura", label: "Abreviatura", maxLength: 30 },
  ],
  loadPage: getMarcas,
  updateRecord: updateMarca,
  updateRecordWithImage: updateMarcaWithImage,
  deleteRecord: deleteMarca,
  getTitle: (marca) => marca.nombre,
  getImageUrl: (marca) => getAccessibleImageUrl(marca.logo_url?.trim() ?? null),
  getInitialValues: (marca) => ({
    nombre: marca.nombre,
    abreviatura: marca.abreviatura ?? "",
  }),
  toUpdatePayload: (values) => ({
    nombre: requiredText(values.nombre),
    abreviatura: optionalText(values.abreviatura),
  }),
};

export function MarcaAdminPanel({
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
