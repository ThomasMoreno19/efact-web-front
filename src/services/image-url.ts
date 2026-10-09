export function getAccessibleImageUrl(imageUrl: string | null) {
  if (
    imageUrl?.startsWith("/empresas/logos/") ||
    imageUrl?.startsWith("/empresas/media/")
  ) {
    return `/api${imageUrl}`;
  }
  return imageUrl;
}
