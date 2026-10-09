export function formatApiError(message: string | string[] | undefined) {
  if (Array.isArray(message)) return message.join(" ");
  return (
    message ?? "No se pudo completar la operación. Revisá los datos e intentá otra vez."
  );
}
