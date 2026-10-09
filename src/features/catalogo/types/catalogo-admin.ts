import type { CatalogRecordResource } from "@/services/catalog-record-resources";

export const CATALOGO_LISTAS: { id: CatalogRecordResource; label: string }[] = [
  { id: "articulos", label: "Artículos" },
  { id: "marcas", label: "Marcas" },
  { id: "proveedores", label: "Proveedores" },
  { id: "rubros", label: "Rubros" },
  { id: "ubicaciones", label: "Ubicaciones" },
];
