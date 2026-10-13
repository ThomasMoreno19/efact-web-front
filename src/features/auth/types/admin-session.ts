export type AdminSession =
  | {
      id: number;
      nombre: string;
      role: "Superadmin";
      id_empresa: null;
      empresaSlug: null;
    }
  | {
      id: number;
      nombre: string;
      role: "Admin";
      id_empresa: number;
      empresaSlug: string;
    };
