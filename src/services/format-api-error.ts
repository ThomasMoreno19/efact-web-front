export function formatApiError(message: string | string[] | undefined) {
  if (Array.isArray(message)) return message.join("\n");
  return (
    message ?? "No se pudo completar la operación. Revisá los datos e intentá otra vez."
  );
}
