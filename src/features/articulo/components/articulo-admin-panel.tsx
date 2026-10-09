"use client";

import {
  CatalogAdminPanel,
} from "@/components/admin/catalog-admin-panel";
import type {
  CatalogAdminDefinition,
  CatalogAdminValues,
} from "@/components/admin/catalog-admin-panel";
import {
  deleteArticulo,
  getArticulos,
  updateArticulo,
  updateArticuloWithImage,
} from "@/features/articulo/services/articulo-admin.service";
import type { Articulo } from "@/features/articulo/types/articulo";
import { getArticuloStockStatus } from "@/features/articulo/utils/articulo-stock-status";
import { getAccessibleImageUrl } from "@/services/image-url";

const definition: CatalogAdminDefinition<Articulo> = {
  label: "Artículos",
  presentation: "article",
  fields: [
    { id: "codigo_interno", label: "Código interno", type: "number", required: true },
    { id: "nombre", label: "Descripción", maxLength: 100, required: true },
    { id: "codigo_barra", label: "Código de barra", maxLength: 20 },
    { id: "precio1", label: "Precio 1", type: "number" },
    { id: "precio2", label: "Precio 2", type: "number" },
    { id: "precio3", label: "Precio 3", type: "number" },
    { id: "existencia", label: "Existencia", type: "number", required: true },
    { id: "minima_existencia", label: "Existencia mínima", type: "number" },
    { id: "maxima_existencia", label: "Existencia máxima", type: "number" },
  ],
  checkboxes: [
    { id: "tiene_existencia", label: "Controla existencia" },
    { id: "no_procesado", label: "No disponible" },
    { id: "oferta", label: "En oferta" },
  ],
  loadPage: getArticulos,
  updateRecord: updateArticulo,
  updateRecordWithImage: updateArticuloWithImage,
  deleteRecord: deleteArticulo,
  getTitle: (articulo) => articulo.nombre,
  getListDetails: (articulo) => ({
    code: articulo.codigo_interno,
    existence:
      articulo.tiene_existencia === true &&
      Number.isFinite(articulo.existencia)
      ? String(articulo.existencia)
      : undefined,
    stockTracked: articulo.tiene_existencia === true,
    price: articulo.precio1 === null ? null : formatPrice(articulo.precio1),
    stockStatus:
      articulo.tiene_existencia === true
        ? getArticuloStockStatus(
            articulo.existencia,
            articulo.minima_existencia,
            articulo.maxima_existencia,
          )
        : null,
  }),
  getImageUrl: (articulo) => getAccessibleImageUrl(articulo.logo_url),
  getInitialValues: (articulo) => ({
    codigo_interno: String(articulo.codigo_interno),
    nombre: articulo.nombre,
    codigo_barra: articulo.codigo_barra ?? "",
    precio1: nullableNumber(articulo.precio1),
    precio2: nullableNumber(articulo.precio2),
    precio3: nullableNumber(articulo.precio3),
    existencia: String(articulo.existencia),
    minima_existencia: nullableNumber(articulo.minima_existencia),
    maxima_existencia: nullableNumber(articulo.maxima_existencia),
    tiene_existencia: articulo.tiene_existencia,
    no_procesado: articulo.no_procesado === 1,
    oferta: articulo.oferta,
  }),
  toUpdatePayload: articuloUpdatePayload,
};

const priceFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function ArticuloAdminPanel({
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

function articuloUpdatePayload(values: CatalogAdminValues) {
  return {
    nombre: requiredText(values, "nombre"),
    codigo_interno: requiredInteger(values, "codigo_interno"),
    codigo_barra: optionalText(values, "codigo_barra"),
    precio1: optionalInteger(values, "precio1"),
    precio2: optionalInteger(values, "precio2"),
    precio3: optionalInteger(values, "precio3"),
    existencia: requiredInteger(values, "existencia"),
    minima_existencia: optionalInteger(values, "minima_existencia"),
    maxima_existencia: optionalInteger(values, "maxima_existencia"),
    tiene_existencia: Boolean(values.tiene_existencia),
    no_procesado: values.no_procesado ? 1 : 0,
    oferta: Boolean(values.oferta),
  };
}

function requiredText(values: CatalogAdminValues, field: string) {
  const value = String(values[field] ?? "").trim();
  if (!value) throw new Error("Completá los campos obligatorios.");
  return value;
}

function optionalText(values: CatalogAdminValues, field: string) {
  const value = String(values[field] ?? "").trim();
  return value || null;
}

function requiredInteger(values: CatalogAdminValues, field: string) {
  const value = Number(values[field]);
  if (!Number.isInteger(value)) {
    throw new Error("Los códigos y las existencias deben ser números enteros.");
  }
  return value;
}

function optionalInteger(values: CatalogAdminValues, field: string) {
  const text = String(values[field] ?? "").trim();
  if (!text) return null;
  const value = Number(text);
  if (!Number.isInteger(value)) {
    throw new Error("Los precios y niveles de existencia deben ser enteros.");
  }
  return value;
}

function nullableNumber(value: number | null) {
  return value === null ? "" : String(value);
}

function formatPrice(value: number | null) {
  return value === null ? "—" : priceFormatter.format(value);
}
