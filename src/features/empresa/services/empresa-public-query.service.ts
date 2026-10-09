import { fetchBackend } from "@/services/backend-api";
import type { EmpresaPublica } from "@/features/empresa/types/empresa";

export async function getEmpresaPublicaBySlug(
  slug: string,
): Promise<EmpresaPublica | null> {
  const response = await fetchBackend(
    `/empresas/slug/${encodeURIComponent(slug)}`,
    { cache: "no-store" },
  );
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error("No se pudo cargar la empresa.");
  }
  return response.json();
}
