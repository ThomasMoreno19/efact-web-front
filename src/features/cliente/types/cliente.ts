export interface ClienteSaldo {
  nombre: string | null;
  saldo: number | null;
  updatedAt: string | null;
}

export interface ClienteApiError {
  message?: string;
}

export type ConsultaSaldoClienteResult =
  | { requiereContrasena: true }
  | ({ requiereContrasena: false } & ClienteSaldo);
