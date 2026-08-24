import { API_URL } from "./api";

// The backend stores/returns image paths relative to the backend root
// (e.g. "uploads/products/xxxx.jpg"). API_URL points at .../backend/api,
// so we strip the trailing /api to get the backend's base URL.
const BACKEND_BASE = API_URL.replace(/\/api\/?$/, "");

export function productImageUrl(path) {
  if (!path) return null;
  return `${BACKEND_BASE}/${path}`;
}
