import { INTERNAL_PAGE_SIZE } from "@/features/interno/constants/internal-page-size";
import type {
  CatalogoInternoArticulo,
  CatalogoInternoCategoria,
  CatalogoInternoFiltros,
  CatalogoInternoLista,
  CatalogoInternoPagina,
  CatalogoInternoRelacion,
  InternalSession,
  SaldoInternoCliente,
} from "@/features/interno/types/interno";

export class InternalRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function loginInterno(
  empresaId: number,
  contrasena: string,
) {
  const response = await fetch("/api/auth/internal-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ empresaId, contrasena }),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw toError(payload, response.status);
}

export async function getInternalSession(
  empresaId: number,
): Promise<InternalSession> {
  const response = await fetch(
    `/api/internal/empresas/${empresaId}/session`,
    { cache: "no-store" },
  );
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw toError(payload, response.status);
  if (!isInternalSession(payload)) {
    throw new Error("La respuesta de sesión interna no es válida.");
  }
  return payload;
}

export async function logoutInterno(empresaId: number) {
  const response = await fetch(`/api/internal/empresas/${empresaId}/logout`, {
    method: "POST",
    cache: "no-store",
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw toError(payload, response.status);
  }
}

export async function getCatalogoInternoPage(
  empresaId: number,
  lista: CatalogoInternoLista,
  offset: number,
  filters: CatalogoInternoFiltros = {},
  signal?: AbortSignal,
): Promise<CatalogoInternoPagina> {
  const query = new URLSearchParams({
    offset: String(offset),
    limit: String(INTERNAL_PAGE_SIZE),
    lista,
  });
  if (filters.search?.trim()) query.set("search", filters.search.trim());
  if (filters.codigoProveedor?.trim()) {
    query.set("codigoProveedor", filters.codigoProveedor.trim());
  }
  if (filters.codigoInterno?.trim()) {
    query.set("codigoInterno", filters.codigoInterno.trim());
  }
  if (filters.codigoBarra?.trim()) {
    query.set("codigoBarra", filters.codigoBarra.trim());
  }
  filters.marcaIds?.forEach((id) => query.append("marcaId", String(id)));
  filters.rubroIds?.forEach((id) => query.append("rubroId", String(id)));
  filters.proveedorIds?.forEach((id) => query.append("proveedorId", String(id)));
  filters.ubicacionIds?.forEach((id) => query.append("ubicacionId", String(id)));
  const response = await fetch(
    `/api/internal/empresas/${empresaId}/catalogo?${query.toString()}`,
    { cache: "no-store", signal },
  );
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw toError(payload, response.status);
  if (!isCatalogoInternoPagina(payload, lista)) {
    throw new Error("La respuesta del catálogo interno no es válida.");
  }
  return payload;
}

export async function getSaldosInternos(
  empresaId: number,
  signal?: AbortSignal,
): Promise<SaldoInternoCliente[]> {
  const response = await fetch(
    `/api/internal/empresas/${empresaId}/saldos`,
    { cache: "no-store", signal },
  );
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw toError(payload, response.status);
  if (!Array.isArray(payload) || !payload.every(isSaldoInternoCliente)) {
    throw new Error("La respuesta de saldos internos no es válida.");
  }
  return payload;
}

function isInternalSession(value: unknown): value is InternalSession {
  if (typeof value !== "object" || value === null) return false;
  const session = value as Partial<InternalSession>;
  return (
    Number.isSafeInteger(session.id) &&
    Number.isSafeInteger(session.idEmpresa) &&
    session.role === "Interno"
  );
}

function isCatalogoInternoPagina(
  value: unknown,
  lista: CatalogoInternoLista,
): value is CatalogoInternoPagina {
  if (typeof value !== "object" || value === null) return false;
  const page = value as Partial<CatalogoInternoPagina>;
  const isArticleList = lista === "articulos" || lista === "ofertas";
  return (
    Array.isArray(page.records) &&
    page.records.every((record) =>
      isArticleList ? isCatalogoInternoArticulo(record) : isCatalogoInternoCategoria(record),
    ) &&
    Number.isSafeInteger(page.total) &&
    (page.total as number) >= 0 &&
    typeof page.hasMore === "boolean"
  );
}

function isCatalogoInternoArticulo(
  value: unknown,
): value is CatalogoInternoArticulo {
  if (typeof value !== "object" || value === null) return false;
  const articulo = value as Partial<CatalogoInternoArticulo>;
  return (
    typeof articulo.id === "string" &&
    Number.isSafeInteger(articulo.codigoInterno) &&
    isNullableString(articulo.codigoProveedor) &&
    isNullableString(articulo.codigoBarra) &&
    typeof articulo.nombre === "string" &&
    isNullableString(articulo.logoUrl) &&
    isNullableNumber(articulo.precio1) &&
    isNullableNumber(articulo.precio2) &&
    isNullableNumber(articulo.precio3) &&
    Number.isSafeInteger(articulo.existencia) &&
    typeof articulo.tieneExistencia === "boolean" &&
    isNullableNumber(articulo.minimaExistencia) &&
    isNullableNumber(articulo.maximaExistencia) &&
    typeof articulo.oferta === "boolean" &&
    isNullableString(articulo.actualizadoEn) &&
    isNullableCatalogoRelacion(articulo.marca) &&
    isNullableCatalogoRelacion(articulo.rubro) &&
    isNullableCatalogoRelacion(articulo.proveedor) &&
    isNullableCatalogoRelacion(articulo.ubicacion)
  );
}

function isCatalogoInternoCategoria(
  value: unknown,
): value is CatalogoInternoCategoria {
  if (typeof value !== "object" || value === null) return false;
  const categoria = value as Partial<CatalogoInternoCategoria>;
  return (
    Number.isSafeInteger(categoria.id) &&
    typeof categoria.nombre === "string" &&
    isNullableString(categoria.logoUrl)
  );
}

function isNullableCatalogoRelacion(
  value: unknown,
): value is CatalogoInternoRelacion | null {
  if (value === null) return true;
  if (typeof value !== "object") return false;
  const relacion = value as Partial<CatalogoInternoRelacion>;
  return (
    Number.isSafeInteger(relacion.id) &&
    typeof relacion.nombre === "string" &&
    (relacion.abreviatura === undefined || isNullableString(relacion.abreviatura))
  );
}

function isSaldoInternoCliente(value: unknown): value is SaldoInternoCliente {
  if (typeof value !== "object" || value === null) return false;
  const cliente = value as Partial<SaldoInternoCliente>;
  return (
    isNullableString(cliente.nombre) &&
    isNullableNumber(cliente.saldo) &&
    isNullableString(cliente.updatedAt)
  );
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || typeof value === "number";
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function toError(payload: unknown, status: number) {
  let message = "No se pudo completar la solicitud.";
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload
  ) {
    const bodyMessage = (payload as { message?: string | string[] }).message;
    if (Array.isArray(bodyMessage)) message = bodyMessage.join(" ");
    else if (typeof bodyMessage === "string") message = bodyMessage;
  }
  return new InternalRequestError(message, status);
}
