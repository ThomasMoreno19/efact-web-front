export const MAX_CATALOG_RECORD_IMAGE_SIZE_BYTES = 50 * 1024 * 1024;
export const ACCEPTED_CATALOG_RECORD_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;
export const CATALOG_RECORD_IMAGE_FILE_ACCEPT =
  ACCEPTED_CATALOG_RECORD_IMAGE_MIME_TYPES.join(",");
