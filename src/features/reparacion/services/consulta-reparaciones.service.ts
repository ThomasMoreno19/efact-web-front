import type {
  ConsultaReparacionesResponse,
  ConsultaReparacionesResult,
  MovimientoReparacionPublico,
  TipoBusquedaReparacion,
} from "@/features/reparacion/types/reparacion";

export async function consultarReparaciones(
  empresaId: number,
  tipo: TipoBusquedaReparacion,
  valor: string,
  contrasena?: string,
): Promise<ConsultaReparacionesResponse> {
  const response = await fetch(
    `/api/empresas/${empresaId}/reparaciones/consulta`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo,
        valor,
        ...(contrasena === undefined ? {} : { contrasena }),
      }),
      cache: "no-store",
    },
  );
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 400) {
      throw new Error(
        tipo === "cuil"
          ? "Revisá el formato de tu DNI o CUIL."
          : "Ingresá un número de serie válido.",
      );
    }
    if (response.status === 404) {
      throw new Error("No encontramos movimientos vigentes para esos datos.");
    }
    if (response.status === 401) {
      throw new Error("La contraseña ingresada no es correcta.");
    }
    if (response.status === 400 && contrasena !== undefined) {
      throw new Error("La contraseña ingresada no es válida.");
    }
    throw new Error("No se pudo consultar la reparación. Intentá nuevamente.");
  }

  if (!isConsultaReparacionesResponse(payload)) {
    throw new Error("La respuesta de reparación no tiene un formato válido.");
  }
  return payload;
}

function isConsultaReparacionesResponse(
  value: unknown,
): value is ConsultaReparacionesResponse {
  if (typeof value !== "object" || value === null) return false;
  if ("requiereContrasena" in value && value.requiereContrasena === true) {
    return true;
  }
  return isConsultaReparacionesResult(value);
}

function isConsultaReparacionesResult(
  value: unknown,
): value is ConsultaReparacionesResult {
  if (typeof value !== "object" || value === null) return false;
  const result = value as Partial<ConsultaReparacionesResult>;
  return (
    result.requiereContrasena === false &&
    isNullableString(result.nombreCliente) &&
    Array.isArray(result.movimientos) &&
    result.movimientos.every(isMovimientoReparacionPublico)
  );
}

function isMovimientoReparacionPublico(
  value: unknown,
): value is MovimientoReparacionPublico {
  if (typeof value !== "object" || value === null) return false;
  const movimiento = value as Partial<MovimientoReparacionPublico>;
  if (typeof movimiento.equipo !== "object" || movimiento.equipo === null) {
    return false;
  }
  const equipo = movimiento.equipo as MovimientoReparacionPublico["equipo"];
  return (
    isNullableString(equipo.nombreEquipo) &&
    isNullableString(equipo.marca) &&
    isNullableString(equipo.modelo) &&
    isNullableString(equipo.numeroSerie) &&
    isNullableString(movimiento.estado) &&
    isNullableString(movimiento.fecha) &&
    isNullableString(movimiento.observacion)
  );
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}
