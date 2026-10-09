import { fetchWithAdminSession } from "@/features/auth/services/auth-client.service";
import type {
  Empresa,
  EmpresaConfiguracionCatalogoInput,
  EmpresaInput,
} from "@/features/empresa/types/empresa";
import { formatApiError } from "@/services/format-api-error";

export async function createEmpresa(input: EmpresaInput): Promise<Empresa> {
  return sendEmpresaRequest("/api/admin/empresas", "POST", input);
}

export async function updateEmpresa(id: number, input: EmpresaInput) {
  await sendEmpresaRequest(`/api/admin/empresas/${id}`, "PATCH", input);
}

export async function updateEmpresaCatalogSettings(
  id: number,
  input: EmpresaConfiguracionCatalogoInput,
) {
  await sendEmpresaRequest(`/api/admin/empresas/${id}`, "PATCH", input);
}

export async function deleteEmpresa(id: number) {
  const response = await fetchWithAdminSession(`/api/admin/empresas/${id}`, {
    method: "DELETE",
  });
  await ensureSuccess(response);
}

export async function getEmpresaExcelImportToken(id: number): Promise<string> {
  const response = await fetchWithAdminSession(
    `/api/admin/empresas/${id}/excel-token`,
    { cache: "no-store" },
  );
  const body = await ensureSuccess(response);
  const token = (body as { token?: unknown } | null)?.token;
  if (typeof token !== 'string' || token.length === 0) {
    throw new Error('No se pudo recuperar el token de importación.');
  }
  return token;
}

export async function uploadEmpresaLogo(id: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetchWithAdminSession(
    `/api/admin/empresas/${id}/logo`,
    {
      method: "POST",
      body: formData,
    },
  );
  await ensureSuccess(response);
}

async function sendEmpresaRequest<TInput extends object>(
  url: string,
  method: "POST" | "PATCH",
  input: TInput,
): Promise<Empresa> {
  const response = await fetchWithAdminSession(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await ensureSuccess(response);
  return body as Empresa;
}

async function ensureSuccess(response: Response): Promise<unknown> {
  const result = await response.json().catch(() => null);
  if (response.ok) return result;

  const error = result as {
    message?: string | string[];
  } | null;
  throw new Error(formatApiError(error?.message));
}
