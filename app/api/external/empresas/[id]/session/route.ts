import { proxyExternalBackendRequest } from "@/services/external-backend-proxy.service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^\d+$/.test(id)) return Response.json({ message: "Empresa no válida." }, { status: 400 });
  return proxyExternalBackendRequest(`empresas/${id}/catalogo-publico/session`);
}
