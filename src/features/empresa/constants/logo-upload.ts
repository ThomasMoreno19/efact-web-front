export const MAX_LOGO_SIZE_BYTES = 50 * 1024 * 1024;
export const ACCEPTED_LOGO_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;
export const LOGO_FILE_ACCEPT = ACCEPTED_LOGO_MIME_TYPES.join(",");
