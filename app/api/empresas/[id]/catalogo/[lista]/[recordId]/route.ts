import {
  deleteCatalogRecord,
  updateCatalogRecord,
} from "@/services/catalog-records-proxy.service";

interface RouteContext {
  params: Promise<{ id: string; lista: string; recordId: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id, lista, recordId } = await params;
  return updateCatalogRecord(request, id, lista, recordId);
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id, lista, recordId } = await params;
  return deleteCatalogRecord(id, lista, recordId);
}
