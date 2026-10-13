import { fetchBackend } from "@/services/backend-api";
import type { Empresa } from "@/features/empresa/types/empresa";

export async function getAllEmpresas(token: string): Promise<Empresa[]> {
  const response = await fetchBackend("/empresas", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("No se pudo cargar la lista de empresas.");
  return response.json();
}

export async function getEmpresaById(
  id: number,
  token: string,
): Promise<Empresa> {
  const response = await fetchBackend(`/empresas/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("No se pudo cargar la empresa.");
  return response.json();
}
