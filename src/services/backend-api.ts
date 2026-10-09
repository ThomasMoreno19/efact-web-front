const BACKEND_URL = (process.env.BACKEND_URL ?? "http://localhost:3000")
  .trim()
  .replace(/\/+$/, "");

export function backendApiUrl(path: string) {
  return `${BACKEND_URL}/${path.replace(/^\/+/, "")}`;
}

export function fetchBackend(path: string, init?: RequestInit) {
  return fetch(backendApiUrl(path), init);
}
