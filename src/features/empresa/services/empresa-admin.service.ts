import { NextResponse } from "next/server";
import { proxyAdminBackendRequest } from "@/services/admin-backend-proxy.service";

export async function createEmpresaFromRequest(request: Request) {
  const body = await readJsonObject(request);
  if (body instanceof NextResponse) return body;
  return proxyAdminBackendRequest("/empresas", "POST", JSON.stringify(body));
}

export async function updateEmpresaFromRequest(
  request: Request,
  id: string,
) {
  if (!isValidId(id)) return invalidCompanyId();

  const body = await readJsonObject(request);
  if (body instanceof NextResponse) return body;
  return proxyAdminBackendRequest(
    `/empresas/${id}`,
    "PATCH",
    JSON.stringify(body),
  );
}

export async function deleteEmpresaById(id: string) {
  if (!isValidId(id)) return invalidCompanyId();
  return proxyAdminBackendRequest(`/empresas/${id}`, "DELETE");
}

async function readJsonObject(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalidCompanyData();
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return invalidCompanyData();
  }
  return body as Record<string, unknown>;
}

function isValidId(id: string) {
  return /^\d+$/.test(id);
}

function invalidCompanyId() {
  return NextResponse.json(
    { message: "El identificador de empresa no es válido." },
    { status: 400 },
  );
}

function invalidCompanyData() {
  return NextResponse.json(
    { message: "Los datos de la empresa no son válidos." },
    { status: 400 },
  );
}
