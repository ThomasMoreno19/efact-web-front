import { NextResponse } from "next/server";
import { proxyAdminBackendRequest } from "@/services/admin-backend-proxy.service";

export async function getHorariosByEmpresaId(id: string) {
  if (!isValidId(id)) return invalidEmpresaId();
  return proxyAdminBackendRequest(`/empresas/${id}/horarios`, "GET");
}

export async function replaceHorariosByEmpresaId(
  request: Request,
  id: string,
) {
  if (!isValidId(id)) return invalidEmpresaId();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalidHorarioData();
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return invalidHorarioData();
  }
  return proxyAdminBackendRequest(
    `/empresas/${id}/horarios`,
    "PUT",
    JSON.stringify(body),
  );
}

function isValidId(id: string) {
  return /^\d+$/.test(id);
}

function invalidEmpresaId() {
  return NextResponse.json(
    { message: "El identificador de empresa no es válido." },
    { status: 400 },
  );
}

function invalidHorarioData() {
  return NextResponse.json(
    { message: "Los datos del horario no son válidos." },
    { status: 400 },
  );
}
