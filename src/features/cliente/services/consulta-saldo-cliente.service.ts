import type {
  ClienteSaldo,
  ConsultaSaldoClienteResult,
} from "@/features/cliente/types/cliente";

export async function consultarSaldoCliente(
  empresaId: number,
  cuil: string,
  contrasena?: string,
): Promise<ConsultaSaldoClienteResult> {
  const response = await fetch(`/api/empresas/${empresaId}/clientes/saldo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cuil,
      ...(contrasena === undefined ? {} : { contrasena }),
    }),
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as
    | Partial<ClienteSaldo & { requiereContrasena: boolean }>
    | null;

  if (!response.ok) {
    if (response.status === 400) {
      throw new Error("Revisá el formato de tu DNI o CUIL.");
    }
    if (response.status === 401) {
      throw new Error("La contraseña ingresada no es correcta.");
    }
    if (response.status === 404) {
      throw new Error("No encontramos un cliente con ese DNI o CUIL.");
    }
    throw new Error("No se pudo consultar el saldo. Intentá nuevamente.");
  }

  if (payload?.requiereContrasena === true) {
    return { requiereContrasena: true };
  }
  if (
    payload?.requiereContrasena === false &&
    (typeof payload.nombre === "string" || payload.nombre === null) &&
    (typeof payload.saldo === "number" || payload.saldo === null) &&
    (typeof payload.updatedAt === "string" || payload.updatedAt === null)
  ) {
    return {
      requiereContrasena: false,
      nombre: payload.nombre,
      saldo: payload.saldo,
      updatedAt: payload.updatedAt,
    };
  }

  throw new Error("La respuesta del saldo no tiene un formato válido.");
}
