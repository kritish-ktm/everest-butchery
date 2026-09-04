import { adminAuth } from "./adminAuth";

// Base URL of the PHP backend. During local dev with XAMPP, the backend/
// folder is served from http://localhost/everest-butchery/backend
// (i.e. this project's backend/ folder is placed inside XAMPP's htdocs).
// Adjust VITE_API_URL in a .env file if your setup differs.
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost/everest-butchery/backend/api";

async function request(path, options = {}, { auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = adminAuth.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/${path}`, { headers, ...options });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && auth) {
    // Token missing/expired — drop the stale session so the UI can redirect to login.
    adminAuth.clearSession();
  }
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

  // --- Admin auth ---
  adminLogin: (email, password) =>
    request("admin_login.php", { method: "POST", body: JSON.stringify({ email, password }) }),
  adminLogout: () => request("admin_logout.php", { method: "POST" }, { auth: true }),

  // --- Admin: products (all require a logged-in admin token) ---
  adminGetProducts: () => request("products.php?include_out_of_stock=1", {}, { auth: true }),
  createProduct: (payload) =>
    request("products.php", { method: "POST", body: JSON.stringify(payload) }, { auth: true }),
  updateProduct: (payload) =>
    request("products.php", { method: "PUT", body: JSON.stringify(payload) }, { auth: true }),
  deleteProduct: (id) =>
    request(`products.php?id=${id}`, { method: "DELETE" }, { auth: true }),

  // --- Admin: product image upload ---
  uploadProductImage: async (file) => {
    const token = adminAuth.getToken();
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(`${API_URL}/upload.php`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData, // no Content-Type header — the browser sets the multipart boundary itself
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
    return data; // { path: "uploads/products/xxxx.jpg" }
  },

  // --- Admin: orders ---
  adminGetOrders: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`orders.php${qs ? `?${qs}` : ""}`, {}, { auth: true });
  },
  adminGetDashboard: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`dashboard.php${qs ? `?${qs}` : ""}`, {}, { auth: true });
  },
  getOrder: (id) => request(`orders.php?id=${id}`, {}, { auth: true }),
  updateOrderStatus: (payload) =>
    request("orders.php", { method: "PUT", body: JSON.stringify(payload) }, { auth: true }),
};
