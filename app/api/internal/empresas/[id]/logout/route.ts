import { proxyInternalBackendRequest } from "@/services/internal-backend-proxy.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  return proxyInternalBackendRequest(id, "logout", "POST");
}
