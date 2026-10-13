import { NextResponse } from "next/server";
import { proxyInternalBackendRequest } from "@/services/internal-backend-proxy.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const searchParams = new URL(request.url).searchParams;
  const offset = searchParams.get("offset") ?? "0";
  const limit = searchParams.get("limit") ?? "30";
  const lista = searchParams.get("lista") ?? "articulos";
  const search = searchParams.get("search") ?? "";
  const codigoProveedor = searchParams.get("codigoProveedor") ?? "";
  const codigoInterno = searchParams.get("codigoInterno") ?? "";
  const codigoBarra = searchParams.get("codigoBarra") ?? "";
  const filterNames = ["marcaId", "rubroId", "proveedorId", "ubicacionId"];
  const filterValues = filterNames.flatMap((name) => searchParams.getAll(name));
  if (
    !/^\d+$/.test(offset) ||
    !Number.isSafeInteger(Number(offset)) ||
    !/^\d+$/.test(limit) ||
    !Number.isInteger(Number(limit)) ||
    Number(limit) < 1 ||
      Number(limit) > 100
  ) {
    return invalidRequest("La paginación del catálogo no es válida.");
  }

  if (!isCatalogoInternoLista(lista)) {
    return invalidRequest("La lista del catálogo interno no es válida.");
  }
  if (search.length > 100) {
    return invalidRequest("La búsqueda no puede superar 100 caracteres.");
  }
  if (codigoProveedor.length > 200) {
    return invalidRequest("El código de proveedor no puede superar 200 caracteres.");
  }
  if (codigoBarra.length > 20) {
    return invalidRequest("El código de barras no puede superar 20 caracteres.");
  }
  if (
    codigoInterno &&
    (!/^\d+$/.test(codigoInterno) ||
      !Number.isSafeInteger(Number(codigoInterno)) ||
      Number(codigoInterno) > 2_147_483_647)
  ) {
    return invalidRequest("El código interno no es válido.");
  }
  if (
    filterValues.some(
      (value) =>
        !/^\d+$/.test(value) ||
        !Number.isSafeInteger(Number(value)) ||
        Number(value) > 2_147_483_647,
    )
  ) {
    return invalidRequest("Los filtros del catálogo no son válidos.");
  }

  const query = new URLSearchParams({ offset, limit, lista });
  if (search) query.set("search", search);
  if (codigoProveedor) query.set("codigoProveedor", codigoProveedor);
  if (codigoInterno) query.set("codigoInterno", codigoInterno);
  if (codigoBarra) query.set("codigoBarra", codigoBarra);
  for (const name of filterNames) {
    searchParams.getAll(name).forEach((value) => query.append(name, value));
  }

  return proxyInternalBackendRequest(
    id,
    "catalogo",
    "GET",
    query,
  );
}

function isCatalogoInternoLista(value: string) {
  return ["articulos", "marcas", "rubros", "ofertas", "proveedores", "ubicaciones"].includes(value);
}

function invalidRequest(message: string) {
  return NextResponse.json(
    { message },
    { status: 400, headers: { "Cache-Control": "no-store" } },
  );
}
