import { NextResponse } from "next/server";
import {
  ACCEPTED_CATALOG_RECORD_IMAGE_MIME_TYPES,
  MAX_CATALOG_RECORD_IMAGE_SIZE_BYTES,
} from "@/features/catalogo/constants/catalog-record-image-upload";
import { proxyAdminBackendRequest } from "@/services/admin-backend-proxy.service";
import {
  CATALOG_RECORD_RESOURCES,
  type CatalogRecordResource,
} from "@/services/catalog-record-resources";

const CATALOG_LISTS = new Set<CatalogRecordResource>(CATALOG_RECORD_RESOURCES);

export function isCatalogRecordResource(value: string): value is CatalogRecordResource {
  return CATALOG_LISTS.has(value as CatalogRecordResource);
}

export function getCatalogList(
  id: string,
  lista: string,
  offset: string,
  search: string,
) {
  if (!isValidId(id)) return invalidId();
  if (!isCatalogRecordResource(lista)) return invalidList();
  if (!isValidOffset(offset)) return invalidOffset();
  if (search.length > 100) return invalidSearch();
  const query = new URLSearchParams({ offset, search });
  return proxyAdminBackendRequest(
    `empresas/${id}/catalogo/${lista}?${query.toString()}`,
    "GET",
  );
}

export async function updateCatalogRecord(
  request: Request,
  id: string,
  lista: string,
  recordId: string,
) {
  if (!isValidId(id)) return invalidId();
  if (!isCatalogRecordResource(lista)) return invalidList();
  if (!isValidId(recordId)) return invalidRecordId();

  const body = await readJsonObject(request);
  if (body instanceof NextResponse) return body;
  return proxyAdminBackendRequest(
    `empresas/${id}/catalogo/${lista}/${recordId}`,
    "PATCH",
    JSON.stringify(body),
  );
}

export async function updateCatalogRecordWithImage(
  request: Request,
  id: string,
  lista: string,
  recordId: string,
) {
  if (!isValidId(id)) return invalidId();
  if (!isCatalogRecordResource(lista)) return invalidList();
  if (!isValidId(recordId)) return invalidRecordId();
  if (!isImageCatalogResource(lista)) return invalidImageList();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return invalidImageRequest();
  }

  const file = formData.get("file");
  const data = formData.get("data");
  if (!(file instanceof File) || typeof data !== "string" || data.length > 20_000) {
    return invalidImageRequest();
  }
  if (file.size === 0 || file.size > MAX_CATALOG_RECORD_IMAGE_SIZE_BYTES) {
    return NextResponse.json(
      { message: "La imagen debe tener contenido y no superar los 50 MB." },
      { status: 413 },
    );
  }
  if (
    !ACCEPTED_CATALOG_RECORD_IMAGE_MIME_TYPES.includes(
      file.type as (typeof ACCEPTED_CATALOG_RECORD_IMAGE_MIME_TYPES)[number],
    )
  ) {
    return NextResponse.json(
      { message: "La imagen debe estar en formato PNG, JPG o WebP." },
      { status: 415 },
    );
  }

  const backendFormData = new FormData();
  backendFormData.append("file", file, file.name);
  backendFormData.append("data", data);
  return proxyAdminBackendRequest(
    `empresas/${id}/catalogo/${lista}/${recordId}/imagen`,
    "PATCH",
    backendFormData,
  );
}

export function deleteCatalogRecord(
  id: string,
  lista: string,
  recordId: string,
) {
  if (!isValidId(id)) return invalidId();
  if (!isCatalogRecordResource(lista)) return invalidList();
  if (!isValidId(recordId)) return invalidRecordId();
  return proxyAdminBackendRequest(
    `empresas/${id}/catalogo/${lista}/${recordId}`,
    "DELETE",
  );
}

async function readJsonObject(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalidData();
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return invalidData();
  }
  return body as Record<string, unknown>;
}

function isValidId(value: string) {
  return /^\d+$/.test(value);
}

function isImageCatalogResource(
  value: CatalogRecordResource,
): value is "articulos" | "marcas" | "proveedores" | "rubros" {
  return (
    value === "articulos" ||
    value === "marcas" ||
    value === "proveedores" ||
    value === "rubros"
  );
}

function isValidOffset(value: string) {
  return /^\d+$/.test(value) && Number.isSafeInteger(Number(value));
}

function invalidId() {
  return NextResponse.json(
    { message: "El identificador de empresa no es válido." },
    { status: 400 },
  );
}

function invalidRecordId() {
  return NextResponse.json(
    { message: "El identificador del registro no es válido." },
    { status: 400 },
  );
}

function invalidList() {
  return NextResponse.json(
    { message: "La lista de catálogo no es válida." },
    { status: 400 },
  );
}

function invalidOffset() {
  return NextResponse.json(
    { message: "El desplazamiento de la lista no es válido." },
    { status: 400 },
  );
}

function invalidSearch() {
  return NextResponse.json(
    { message: "La búsqueda no puede superar 100 caracteres." },
    { status: 400 },
  );
}

function invalidData() {
  return NextResponse.json(
    { message: "Los datos del registro no son válidos." },
    { status: 400 },
  );
}

function invalidImageRequest() {
  return NextResponse.json(
    { message: "Seleccioná una imagen y revisá los datos del registro." },
    { status: 400 },
  );
}

function invalidImageList() {
  return NextResponse.json(
    { message: "Esta lista no admite imágenes." },
    { status: 400 },
  );
}
