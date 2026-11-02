"use client";

import { CatalogAdminPanel } from "@/components/admin/catalog-admin-panel";
import type { CatalogAdminDefinition } from "@/components/admin/catalog-admin-panel";
import {
  deleteUbicacion,
  getUbicaciones,
  updateUbicacion,
} from "@/features/ubicacion/services/ubicacion-admin.service";
import type { Ubicacion } from "@/features/ubicacion/types/ubicacion";

const definition: CatalogAdminDefinition<Ubicacion> = {
  label: "Ubicaciones",
  presentation: "rows",
  fields: [
    { id: "descripcion", label: "Descripción", maxLength: 50, required: true },
    { id: "abreviatura", label: "Abreviatura", maxLength: 30 },
  ],
  loadPage: getUbicaciones,
  updateRecord: updateUbicacion,
  deleteRecord: deleteUbicacion,
  getTitle: (ubicacion) => ubicacion.descripcion,
  getInitialValues: (ubicacion) => ({
    descripcion: ubicacion.descripcion,
    abreviatura: ubicacion.abreviatura ?? "",
  }),
  toUpdatePayload: (values) => ({
    descripcion: requiredText(values.descripcion),
    abreviatura: optionalText(values.abreviatura),
  }),
};

export function UbicacionAdminPanel({
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
