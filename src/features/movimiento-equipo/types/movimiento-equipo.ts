export interface MovimientoExcelPreview {
  movimientosBd: number;
  movimientosExcel: number;
}

export interface MovimientoAdminRecord {
  id: number;
  idEquipo: number;
  estado: string | null;
  fecha: string | null;
  observacion: string | null;
  equipo: {
    nombreEquipo: string | null;
    marca: string | null;
    modelo: string | null;
    numeroSerie: string | null;
    nombreCliente: string | null;
  };
}

export interface MovimientoAdminPage {
  records: MovimientoAdminRecord[];
  total: number;
  hasMore: boolean;
}
