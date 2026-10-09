export const CATALOG_RECORD_RESOURCES = [
  "articulos",
  "marcas",
  "proveedores",
  "rubros",
  "ubicaciones",
] as const;

export type CatalogRecordResource = (typeof CATALOG_RECORD_RESOURCES)[number];
