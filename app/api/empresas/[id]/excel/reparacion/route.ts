import { NextResponse } from "next/server";
import { proxyAdminBackendRequest } from "@/services/admin-backend-proxy.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const MAX_EXCEL_BYTES = 50 * 1024 * 1024;

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
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
    return NextResponse.json(
      { message: "No se pudo leer el formulario del archivo Excel." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  const mode = formData.get("mode");
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".xlsx")) {
    return NextResponse.json(
      { message: "Seleccioná un archivo de Excel con extensión .xlsx." },
      { status: 400 },
    );
  }
  if (file.size === 0 || file.size > MAX_EXCEL_BYTES) {
    return NextResponse.json(
      { message: "El archivo Excel debe tener contenido y no superar los 50 MB." },
      { status: 400 },
    );
  }
  if (mode !== "actualizar" && mode !== "sincronizar") {
    return NextResponse.json(
      { message: "El modo de importación no es válido." },
      { status: 400 },
    );
  }

  const forwardedForm = new FormData();
  forwardedForm.append("file", file, file.name);
  forwardedForm.append("mode", mode);
  return proxyAdminBackendRequest(
    `/empresas/${id}/excel/reparacion`,
    "POST",
    forwardedForm,
  );
}
