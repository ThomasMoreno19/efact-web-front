export type TipoBusquedaReparacion = "cuil" | "serie";

export interface MovimientoReparacionPublico {
  equipo: {
    nombreEquipo: string | null;
    marca: string | null;
    modelo: string | null;
    numeroSerie: string | null;
  };
  estado: string | null;
  fecha: string | null;
  observacion: string | null;
}

export interface ConsultaReparacionesResult {
  requiereContrasena: false;
  nombreCliente: string | null;
  movimientos: MovimientoReparacionPublico[];
}

export interface ReparacionContrasenaRequerida {
  requiereContrasena: true;
}

export type ConsultaReparacionesResponse =
  | ConsultaReparacionesResult
  | ReparacionContrasenaRequerida;
