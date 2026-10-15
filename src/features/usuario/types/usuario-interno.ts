export interface UsuarioInterno {
  id: number;
  role: "Interno";
  id_empresa: number;
}

export interface UsuarioInternoInput {
  contrasena: string;
}
