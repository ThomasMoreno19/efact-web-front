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
  if (
    !/^\d+$/.test(offset) ||
    !Number.isSafeInteger(Number(offset)) ||
    !/^\d+$/.test(limit) ||
    !Number.isInteger(Number(limit)) ||
    Number(limit) < 1 ||
    Number(limit) > 100
  ) {
    return NextResponse.json(
      { message: "La paginación del catálogo no es válida." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  return proxyInternalBackendRequest(
    id,
    "catalogo",
    "GET",
    new URLSearchParams({ offset, limit }),
  );
}
