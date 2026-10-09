import { createEmpresaFromRequest } from "@/features/empresa/services/empresa-admin.service";

export async function POST(request: Request) {
  return createEmpresaFromRequest(request);
}
