import {
  deleteEmpresaById,
  updateEmpresaFromRequest,
} from "@/features/empresa/services/empresa-admin.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  return updateEmpresaFromRequest(request, id);
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  return deleteEmpresaById(id);
}
