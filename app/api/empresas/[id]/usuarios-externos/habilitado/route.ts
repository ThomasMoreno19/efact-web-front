import { fetchBackend } from "@/services/backend-api";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^\d+$/.test(id)) return Response.json({ message: "Empresa no válida." }, { status: 400 });
  try {
    const response = await fetchBackend(`/empresas/${id}/usuarios-externos/habilitado`, { cache: "no-store" });
    return Response.json(await response.json(), { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ message: "No se pudo verificar el acceso." }, { status: 503 });
  }
}
