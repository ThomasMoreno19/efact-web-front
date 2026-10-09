import {
  getHorariosByEmpresaId,
  replaceHorariosByEmpresaId,
} from "@/features/horario/services/horario-admin-proxy.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  return getHorariosByEmpresaId(id);
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params;
  return replaceHorariosByEmpresaId(request, id);
}
