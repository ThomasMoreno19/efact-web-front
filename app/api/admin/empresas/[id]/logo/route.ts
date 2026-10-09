import { uploadEmpresaLogoFromRequest } from "@/features/empresa/services/empresa-logo-admin.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  return uploadEmpresaLogoFromRequest(request, id);
}
