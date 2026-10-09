import { updateCatalogRecordWithImage } from "@/services/catalog-records-proxy.service";

interface RouteContext {
  params: Promise<{ id: string; lista: string; recordId: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id, lista, recordId } = await params;
  return updateCatalogRecordWithImage(request, id, lista, recordId);
}
