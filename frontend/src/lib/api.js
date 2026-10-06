import { adminAuth } from "./adminAuth";
import { supabase, usesSupabase } from "./supabase";

// Base URL of the PHP backend. During local dev with XAMPP, the backend/
// folder is served from http://localhost/everest-butchery/backend
// (i.e. this project's backend/ folder is placed inside XAMPP's htdocs).
// Adjust VITE_API_URL in a .env file if your setup differs.
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost/everest-butchery/backend/api";

const unwrap = ({ data, error }) => {
  if (error) throw new Error(error.message);
  return data;
};

async function supabaseApi(path, options = {}) {
  const method = options.method || "GET";
  const body = options.body ? JSON.parse(options.body) : {};
  const [endpoint, queryString = ""] = path.split("?");
  const query = new URLSearchParams(queryString);

  if (endpoint === "categories.php") {
    const { data, error } = await supabase.from("categories").select("*").order("sort_order");
    return { categories: unwrap({ data, error }) };
  }
  if (endpoint === "products.php") {
    if (method === "GET") {
      let request = supabase.from("products").select("*, categories(name_en,name_np,sort_order)");
      if (!query.has("include_out_of_stock")) request = request.eq("in_stock", true).eq("is_visible", true);
      if (query.has("category")) request = request.eq("category_id", Number(query.get("category")));
      request = request.order("is_featured", { ascending: false }).order("name_en");
      if (query.has("id")) {
        const { data, error } = await request.eq("id", Number(query.get("id"))).single();
        const product = unwrap({ data, error });
        return { ...product, category_name_en: product.categories?.name_en, category_name_np: product.categories?.name_np };
      }
      const { data, error } = await request;
      const products = unwrap({ data, error }).map((p) => ({ ...p, category_name_en: p.categories?.name_en, category_name_np: p.categories?.name_np }));
      products.sort((a, b) => (a.categories?.sort_order ?? 0) - (b.categories?.sort_order ?? 0) || Number(b.is_featured) - Number(a.is_featured) || a.name_en.localeCompare(b.name_en));
      return { products };
    }
    if (method === "POST") {
      const { data, error } = await supabase.from("products").insert(productPayload(body)).select("id").single();
      return unwrap({ data, error });
    }
    if (method === "PUT") {
      const { id, ...values } = body;
      const { error } = await supabase.from("products").update(productPayload(values)).eq("id", id);
      unwrap({ data: true, error });
      return { updated: true };
    }
    if (method === "DELETE") {
      const { error } = await supabase.from("products").delete().eq("id", Number(query.get("id")));
      unwrap({ data: true, error });
      return { deleted: true };
    }
  }
  if (endpoint === "orders.php") {
    if (method === "POST") return unwrap(await supabase.rpc("create_order", { payload: body }));
    if (method === "PUT") {
      const { id, ...values } = body;
      const { error } = await supabase.from("orders").update(values).eq("id", id);
      unwrap({ data: true, error });
      return { updated: true };
    }
    if (method === "GET" && query.has("id")) {
      const { data, error } = await supabase.from("orders").select("*, customers(*), order_items(*)").eq("id", Number(query.get("id"))).single();
      const order = unwrap({ data, error });
      return { ...order, ...order.customers, items: order.order_items };
    }
    if (method === "GET") {
      let request = supabase.from("orders").select("*, customers(full_name,phone)").order("created_at", { ascending: false }).limit(200);
      if (query.has("status")) request = request.eq("status", query.get("status"));
      if (query.has("source")) request = request.eq("source", query.get("source"));
      const { data, error } = await request;
      return { orders: unwrap({ data, error }).map((o) => ({ ...o, ...o.customers })) };
    }
  }
  if (endpoint === "dashboard.php") return dashboardData(query);
  if (endpoint === "admin_login.php") {
    const { data, error } = await supabase.auth.signInWithPassword(body);
    const user = unwrap({ data, error }).user;
    if (user?.app_metadata?.role !== "admin") {
      await supabase.auth.signOut();
      throw new Error("This account is not authorized for admin access.");
    }
    return { token: data.session.access_token, user: { id: user.id, full_name: user.user_metadata?.full_name || user.email, email: user.email, role: "admin" } };
  }
  if (endpoint === "admin_logout.php") {
    unwrap(await supabase.auth.signOut());
    return { loggedOut: true };
  }
  if (endpoint === "google_login.php") {
    const { data, error } = await supabase.auth.signInWithIdToken({ provider: "google", token: body.credential });
    const user = unwrap({ data, error }).user;
    return { user: { name: user.user_metadata?.full_name || user.user_metadata?.name, email: user.email } };
  }
  if (endpoint === "upload.php") {
    const file = options.file;
    if (file.size > 5 * 1024 * 1024) throw new Error("Image is too large (max 5MB)");
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) throw new Error("Please upload a JPG, PNG, WEBP or GIF image");
    const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: false, contentType: file.type });
    unwrap({ data: true, error });
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return { path: data.publicUrl };
  }
  throw new Error(`Unsupported Supabase API endpoint: ${endpoint}`);
}

function productPayload(values) {
  const fields = ["category_id", "name_en", "name_np", "description", "unit", "price_per_unit", "image_url", "is_halal", "in_stock", "is_visible", "is_featured"];
  return Object.fromEntries(Object.entries(values).filter(([key]) => fields.includes(key)).map(([key, value]) => [
    key,
    ["is_halal", "in_stock", "is_visible", "is_featured"].includes(key) ? Boolean(value) : value,
  ]));
}

async function dashboardData(query) {
  const from = query.get("from") || new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  const to = query.get("to") || new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase.from("orders").select("id,total,created_at,status,source,fulfillment,payment_method,customers(id,full_name,phone),order_items(quantity,product_name,line_total)").neq("status", "cancelled").gte("created_at", `${from}T00:00:00`).lte("created_at", `${to}T23:59:59.999`);
  const rows = unwrap({ data, error });
  const days = new Map();
  const topCustomers = new Map();
  const topProducts = new Map();
  const fulfillment = {};
  const payment = {};
  const status = {};
  const source = {};

  for (const order of rows) {
    const date = order.created_at.slice(0, 10);
    const row = days.get(date) || { date, label: new Date(`${date}T12:00:00`).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" }), orders: 0, sales: 0 };
    row.orders += 1;
    row.sales += Number(order.total);
    days.set(date, row);

    fulfillment[order.fulfillment || "unknown"] = (fulfillment[order.fulfillment || "unknown"] || 0) + 1;
    payment[order.payment_method || "unknown"] = (payment[order.payment_method || "unknown"] || 0) + 1;
    status[order.status || "unknown"] = (status[order.status || "unknown"] || 0) + 1;
    source[order.source || "online"] = (source[order.source || "online"] || 0) + 1;

    const customer = order.customers;
    if (customer?.id) {
      const existing = topCustomers.get(customer.id) || { id: customer.id, full_name: customer.full_name, phone: customer.phone, orders: 0, sales: 0 };
      existing.orders += 1;
      existing.sales += Number(order.total);
      topCustomers.set(customer.id, existing);
    }

    for (const item of order.order_items || []) {
      const name = item.product_name || "Unknown item";
      const existing = topProducts.get(name) || { product_name: name, quantity: 0, sales: 0 };
      existing.quantity += Number(item.quantity || 0);
      existing.sales += Number(item.line_total || 0);
      topProducts.set(name, existing);
    }
  }

  const series = [];
  for (let day = new Date(`${from}T12:00:00`); day <= new Date(`${to}T12:00:00`); day.setDate(day.getDate() + 1)) {
    const date = day.toISOString().slice(0, 10);
    series.push(days.get(date) || { date, label: day.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" }), orders: 0, sales: 0 });
  }
  const sales = rows.reduce((sum, row) => sum + Number(row.total), 0);
  const list = (value) => Object.entries(value).map(([key, count]) => ({ key, count }));
  return {
    range: { from, to },
    summary: { orders: rows.length, sales, average_order: rows.length ? sales / rows.length : 0, items_sold: rows.reduce((sum, row) => sum + row.order_items.reduce((n, item) => n + Number(item.quantity), 0), 0) },
    series,
    reports: {
      top_customers: [...topCustomers.values()].sort((a, b) => b.sales - a.sales || b.orders - a.orders).slice(0, 6),
      top_products: [...topProducts.values()].sort((a, b) => b.sales - a.sales || b.quantity - a.quantity).slice(0, 6),
      fulfillment: list(fulfillment),
      payment_methods: list(payment),
      statuses: list(status),
      sources: list(source),
    },
  };
}

async function request(path, options = {}, { auth = false } = {}) {
  if (usesSupabase) {
    if (auth && !adminAuth.isLoggedIn()) throw new Error("Admin login required");
    return supabaseApi(path, options);
  }
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = adminAuth.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/${path}`, { headers, ...options });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && auth) {
    // Token missing/expired - drop the stale session so the UI can redirect to login.
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
  googleLogin: (credential) =>
    request("google_login.php", { method: "POST", body: JSON.stringify({ credential }) }),

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
    if (usesSupabase) return supabaseApi("upload.php", { file });
    const token = adminAuth.getToken();
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(`${API_URL}/upload.php`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData, // no Content-Type header - the browser sets the multipart boundary itself
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
