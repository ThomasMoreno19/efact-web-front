import { getSaldosClientesFromBackend } from "@/features/cliente/services/cliente-proxy.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  return getSaldosClientesFromBackend(id);
}
