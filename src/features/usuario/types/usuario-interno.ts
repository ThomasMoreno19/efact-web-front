export interface UsuarioInterno {
  id: number;
  nombre: string;
  role: "Interno";
  id_empresa: number;
}

export interface UsuarioInternoInput {
  nombre: string;
  contrasena: string;
}
