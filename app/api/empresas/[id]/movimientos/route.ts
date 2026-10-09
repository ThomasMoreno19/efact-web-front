import { NextResponse } from "next/server";
import { MOVIMIENTOS_PAGE_SIZE } from "@/features/movimiento-equipo/constants/movimientos-page";
import { proxyAdminBackendRequest } from "@/services/admin-backend-proxy.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json(
      { message: "El identificador de empresa no es válido." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const query = new URL(request.url).searchParams;
  const offset = query.get("offset") ?? "0";
  const limit = query.get("limit") ?? String(MOVIMIENTOS_PAGE_SIZE);
  if (!isValidOffset(offset) || !isValidLimit(limit)) {
    return NextResponse.json(
      { message: "La paginación de movimientos no es válida." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const backendResponse = await proxyAdminBackendRequest(
    `${id}/movimientos?${new URLSearchParams({ offset, limit }).toString()}`,
    "GET",
  );
  backendResponse.headers.set("Cache-Control", "no-store");
  return backendResponse;
}

function isValidOffset(value: string) {
  return /^\d+$/.test(value) && Number.isSafeInteger(Number(value));
}

function isValidLimit(value: string) {
  const limit = Number(value);
  return /^\d+$/.test(value) && Number.isInteger(limit) && limit > 0 && limit <= 100;
}
