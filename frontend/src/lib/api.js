// Base URL of the PHP backend. During local dev with XAMPP, the backend/
// folder is served from http://localhost/everest-butchery/backend
// (i.e. this project's backend/ folder is placed inside XAMPP's htdocs).
// Adjust VITE_API_URL in a .env file if your setup differs.
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost/everest-butchery/backend/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}/${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  getCategories: () => request("categories.php"),
  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`products.php${qs ? `?${qs}` : ""}`);
  },
  getProduct: (id) => request(`products.php?id=${id}`),
  createOrder: (payload) =>
    request("orders.php", { method: "POST", body: JSON.stringify(payload) }),
  getOrder: (id) => request(`orders.php?id=${id}`),
};
