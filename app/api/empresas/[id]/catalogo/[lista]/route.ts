import { getCatalogList } from "@/services/catalog-records-proxy.service";

interface RouteContext {
  params: Promise<{ id: string; lista: string }>;
}

export async function GET(request: Request, { params }: RouteContext) {
  const { id, lista } = await params;
  const query = new URL(request.url).searchParams;
  const offset = query.get("offset") ?? "0";
  const search = query.get("search") ?? "";
  return getCatalogList(id, lista, offset, search);
}
