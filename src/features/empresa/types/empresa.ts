export interface Empresa {
  id: number;
  nombre: string;
  slug: string;
  telefono: string | null;
  ubicacion: string | null;
  logo_url: string | null;
  tieneCarrito: boolean;
  habilitarExcel: boolean;
  catalogoHabilitado: boolean;
  saldosHabilitados: boolean;
  reparacionesHabilitadas: boolean;
  mostrarNavegacionPaginas: boolean;
  imagenesEnArticulos: boolean;
  incluirHorarios: boolean;
  pedidosFueraHorario: boolean;
  incluirCodigoBarra: boolean;
  toleranciaMinDias: number | null;
  toleranciaMaxDias: number | null;
}

export interface EmpresaPublica {
  id: number;
  nombre: string;
  slug: string;
  telefono: string | null;
  ubicacion: string | null;
  logo_url: string | null;
  tieneCarrito: boolean;
  catalogoHabilitado: boolean;
  saldosHabilitados: boolean;
  reparacionesHabilitadas: boolean;
  mostrarNavegacionPaginas: boolean;
  imagenesEnArticulos: boolean;
  pedidosFueraHorario: boolean;
  incluirCodigoBarra: boolean;
  toleranciaMinDias: number | null;
  toleranciaMaxDias: number | null;
}

export interface EmpresaInput {
  nombre: string;
  slug: string;
  telefono: string | null;
  ubicacion: string | null;
  tieneCarrito: boolean;
  habilitarExcel: boolean;
  catalogoHabilitado: boolean;
  saldosHabilitados: boolean;
  reparacionesHabilitadas: boolean;
}

export interface EmpresaInformationInput {
  nombre: string;
  telefono: string | null;
  ubicacion: string | null;
}

export interface EmpresaPageNavigationInput {
  mostrarNavegacionPaginas: boolean;
}

export interface EmpresaConfiguracionCatalogoInput {
  tieneCarrito: boolean;
  imagenesEnArticulos: boolean;
  incluirCodigoBarra: boolean;
  pedidosFueraHorario: boolean;
  toleranciaMinDias: number | null;
  toleranciaMaxDias: number | null;
}
