import { NextResponse } from "next/server";
import { fetchBackend } from "@/services/backend-api";

interface RouteContext {
  params: Promise<{ empresaId: string; filename: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { empresaId, filename } = await params;
  if (
    !/^\d+$/.test(empresaId) ||
    !/^logoEmpresa1-[a-f\d-]{36}\.(?:png|jpe?g|webp)$/i.test(filename)
  ) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const response = await fetchBackend(
      `/empresas/logos/${empresaId}/${encodeURIComponent(filename)}`,
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
