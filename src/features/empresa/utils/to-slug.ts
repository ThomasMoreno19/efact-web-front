export function normalizeSlugInput(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+/, "");
}

export function toSlug(value: string) {
  return normalizeSlugInput(value).replace(/-+$/, "");
}
