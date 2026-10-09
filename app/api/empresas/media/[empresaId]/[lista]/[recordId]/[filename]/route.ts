import { NextResponse } from "next/server";
import { fetchBackend } from "@/services/backend-api";

interface RouteContext {
  params: Promise<{
    empresaId: string;
    lista: string;
    recordId: string;
    filename: string;
  }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { empresaId, lista, recordId, filename } = await params;
  if (
    !/^\d+$/.test(empresaId) ||
    !isImageResource(lista) ||
    !isValidRecordId(lista, recordId) ||
    !/^catalogo-[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}\.(?:png|jpg|webp)$/i.test(
      filename,
    )
  ) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const response = await fetchBackend(
      `/empresas/media/${empresaId}/${lista}/${recordId}/${encodeURIComponent(filename)}`,
      { cache: "force-cache" },
    );
    if (!response.ok || !response.body) {
      return new NextResponse(null, { status: response.status || 404 });
    }

    return new NextResponse(response.body, {
      headers: {
        "Content-Type":
          response.headers.get("content-type") ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}

function isImageResource(
  value: string,
): value is "articulos" | "marcas" | "proveedores" | "rubros" {
  return (
    value === "articulos" ||
    value === "marcas" ||
    value === "proveedores" ||
    value === "rubros"
  );
}

function isValidRecordId(
  resource: "articulos" | "marcas" | "proveedores" | "rubros",
  value: string,
) {
  if (!/^\d+$/.test(value)) return false;
  if (resource === "articulos") {
    return (
      BigInt(value) > BigInt(0) &&
      BigInt(value) <= BigInt("9223372036854775807")
    );
  }
  return Number.isSafeInteger(Number(value)) && Number(value) > 0;
}
