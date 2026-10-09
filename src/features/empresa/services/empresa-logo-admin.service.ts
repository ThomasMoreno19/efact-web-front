import { NextResponse } from "next/server";
import {
  ACCEPTED_LOGO_MIME_TYPES,
  MAX_LOGO_SIZE_BYTES,
} from "@/features/empresa/constants/logo-upload";
import { proxyAdminBackendRequest } from "@/services/admin-backend-proxy.service";

export async function uploadEmpresaLogoFromRequest(
  request: Request,
  id: string,
) {
  if (!/^\d+$/.test(id)) {
    return NextResponse.json(
      { message: "El identificador de empresa no es válido." },
      { status: 400 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return invalidLogoRequest();
  }

  const file = formData.get("file");
  if (!(file instanceof File)) return invalidLogoRequest();
  if (file.size > MAX_LOGO_SIZE_BYTES) {
    return NextResponse.json(
      { message: "El logo no puede superar los 50 MB." },
      { status: 413 },
    );
  }
  if (
    !ACCEPTED_LOGO_MIME_TYPES.includes(
      file.type as (typeof ACCEPTED_LOGO_MIME_TYPES)[number],
    )
  ) {
    return NextResponse.json(
      { message: "El logo debe estar en formato PNG, JPG o WebP." },
      { status: 415 },
    );
  }

  const backendFormData = new FormData();
  backendFormData.append("file", file, file.name);
  return proxyAdminBackendRequest(`/empresas/${id}/logo`, "POST", backendFormData);
}

function invalidLogoRequest() {
  return NextResponse.json(
    { message: "Seleccioná una imagen para el logo." },
    { status: 400 },
  );
}
