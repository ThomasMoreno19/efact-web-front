"use client";

import { CatalogAdminPanel } from "@/components/admin/catalog-admin-panel";
import type { CatalogAdminDefinition } from "@/components/admin/catalog-admin-panel";
import {
  deleteProveedor,
  getProveedores,
  updateProveedor,
} from "@/features/proveedor/services/proveedor-admin.service";
import type { Proveedor } from "@/features/proveedor/types/proveedor";

const definition: CatalogAdminDefinition<Proveedor> = {
  label: "Proveedores",
  presentation: "rows",
  fields: [
    { id: "nombre", label: "Nombre", maxLength: 255, required: true },
    { id: "abreviatura", label: "Abreviatura", maxLength: 30 },
  ],
  loadPage: getProveedores,
  updateRecord: updateProveedor,
  deleteRecord: deleteProveedor,
  getTitle: (proveedor) => proveedor.nombre,
  getSubtitle: (proveedor) => proveedor.abreviatura,
  getInitialValues: (proveedor) => ({
    nombre: proveedor.nombre,
    abreviatura: proveedor.abreviatura ?? "",
  }),
  toUpdatePayload: (values) => ({
    nombre: requiredText(values.nombre),
    abreviatura: optionalText(values.abreviatura),
  }),
};

export function ProveedorAdminPanel({
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
