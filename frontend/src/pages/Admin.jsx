import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { adminAuth } from "../lib/adminAuth";
import { productImageUrl } from "../lib/imageUrl";
import { categoryIcon } from "../lib/categoryIcon";
import Icon from "../components/Icon";
import SalesDashboard from "../components/SalesDashboard";
import InventoryPanel from "../components/InventoryPanel";
import { stockStatus, stockQuantity } from "../lib/inventory";
import { formatPrice } from "../lib/shopPresentation";
import { withMinimumDuration } from "../lib/adminOperations";
import PendingLabel from "../components/PendingLabel";
import { storeDate } from "../lib/storeTime";

const emptyProduct = {
  id: null,
  category_id: "",
  name_en: "",
  name_np: "",
  description: "",
  unit: "kg",
  price_per_unit: "",
  image_url: "",
  in_stock: 1,
  is_visible: 1,
  is_featured: 0,
};

const ORDER_STATUSES = ["pending", "confirmed", "ready", "completed", "cancelled"];

function dateString(date) {
  return date.toISOString().slice(0, 10);
}

function defaultDashboardRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 6);
  return { from: dateString(from), to: dateString(to) };
}

export default function Admin() {
  const navigate = useNavigate();
  const user = adminAuth.getUser();
  const adminName = user?.full_name || "Admin";
  const [welcomed, setWelcomed] = useState(false);
  const operationLock = useRef(false);
  const [operation, setOperation] = useState(null);
  const busy = Boolean(operation);

  const [tab, setTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inventoryFilter, setInventoryFilter] = useState("all");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState(emptyProduct);
  const saving = operation?.key === "save";
  const uploading = operation?.key === "upload";
  const [dashboard, setDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardRange, setDashboardRange] = useState(defaultDashboardRange);

  useEffect(() => {
    loadAll();
  }, []);
  useEffect(() => {
    let active = true;
    async function refreshInventory() {
      if (document.visibilityState === "hidden") return;
      try {
        const result = await api.adminGetProducts();
        if (active) setProducts(result.products);
      } catch (err) { if (active) setError(err.message); }
    }
    const timer = window.setInterval(refreshInventory, 30000);
    window.addEventListener("focus", refreshInventory);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", refreshInventory); };
  }, []);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [catRes, prodRes, orderRes] = await Promise.all([
        api.getCategories(),
        api.adminGetProducts(),
        api.adminGetOrders(),
      ]);
      setCategories(catRes.categories);
      setProducts(prodRes.products);
      setOrders(orderRes.orders);
      const dashboardRes = await api.adminGetDashboard(dashboardRange);
      setDashboard(dashboardRes);
    } catch (err) {
      if (err.message.includes("401") || err.message.includes("required")) {
        navigate("/admin-login", { replace: true });
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadDashboard(range) {
    setDashboardLoading(true);
    try {
      const result = await api.adminGetDashboard(range);
      setDashboard(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setDashboardLoading(false);
    }
  }

  function handleDashboardRangeChange(range) {
    setDashboardRange(range);
    loadDashboard(range);
  }

  async function handleLogout() {
    try {
      await api.adminLogout();
    } catch {
      // ignore - we clear the local session regardless
    }
    adminAuth.clearSession();
    navigate("/admin-login", { replace: true });
  }

  function startEdit(product) {
    setForm({ ...product });
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }

  function resetForm() {
    setForm(emptyProduct);
  }

  async function runOperation(key, label, action, onSuccess, refresh = true) {
    if (operationLock.current) return;
    operationLock.current = true;
    setOperation({ key, label });
    setError("");
    try {
      const result = await withMinimumDuration(action);
      onSuccess?.(result);
      if (refresh) await loadAll();
    } catch (err) { setError(err.message); }
    finally { operationLock.current = false; setOperation(null); }
  }

  async function handleSaveProduct(e) {
    e.preventDefault();
    await runOperation("save", form.id ? "Saving changes..." : "Adding product...", () => form.id ? api.updateProduct(form) : api.createProduct(form), resetForm);
  }

  async function handleDelete(id) {
    if (operationLock.current) return;
    if (!confirm("Delete this product? This can't be undone, and its photo will be removed too.")) return;
    await runOperation(`delete-${id}`, "Deleting product...", () => api.deleteProduct(id), () => { if (form.id === id) resetForm(); });
  }

  async function toggleStock(product) {
    await runOperation(`stock-${product.id}`, "Updating availability...", () => api.updateProduct({ id: product.id, in_stock: Number(product.in_stock) ? 0 : 1 }));
  }

  async function toggleVisible(product) {
    await runOperation(`visible-${product.id}`, "Updating menu visibility...", () => api.updateProduct({ id: product.id, is_visible: Number(product.is_visible) ? 0 : 1 }));
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    await runOperation("upload", "Uploading photo...", () => api.uploadProductImage(file), (res) => setForm((f) => ({ ...f, image_url: res.path })), false);
    e.target.value = "";
  }

  function removeImage() {
    setForm((f) => ({ ...f, image_url: "" }));
  }

  async function handleStatusChange(order, status) {
    await runOperation(`order-${order.id}`, "Updating order...", () => api.updateOrderStatus({ id: order.id, status }));
  }

  const previewUrl = productImageUrl(form.image_url);
  const tracked = products.filter((product) => product.stock_quantity != null);
  const totalWeight = tracked.filter((product) => product.unit === "kg").reduce((total, product) => total + Number(product.stock_quantity), 0);
  const warningCount = tracked.filter((product) => stockStatus(product).level === "warning").length;
  const criticalCount = tracked.filter((product) => stockStatus(product).level === "critical").length;
  function openInventory(filter = "all") {
    setInventoryFilter(filter);
    setTab("inventory");
    setSidebarOpen(false);
  }
  const navItems = [{ key: "dashboard", label: "Dashboard", icon: "bi-grid" }, { key: "orders", label: "Orders", icon: "bi-bag-check" }, { key: "products", label: "Products", icon: "bi-box-seam" }, { key: "inventory", label: "Inventory", icon: "bi-boxes" }];

  if (!welcomed) return <section className="admin-welcome">
    <img src="/logo.svg" alt="Everest Butchery" />
    <div className="admin-welcome-content"><i className="bi bi-shield-check" aria-hidden="true" /><p>{storeDate(new Date())}</p><h1>Hiiii, {adminName}!</h1><p>How are you today?</p>
      {error && <p className="error-box" role="alert">{error}</p>}
      <button type="button" className="btn btn-primary" onClick={() => setWelcomed(true)}>Continue to Dashboard <i className="bi bi-arrow-right" aria-hidden="true" /></button>
    </div>
  </section>;

  return (
    <div className="admin-workspace admin-page">
      <aside className={`admin-sidebar${sidebarOpen ? " is-open" : ""}`}>
        <Link to="/" className="admin-brand"><img src="/logo.svg" alt="Everest Butchery" /></Link>
        <span className="admin-sidebar-label">STORE MANAGEMENT</span>
        <nav id="admin-navigation" aria-label="Admin">
          {navItems.map((item) => <button key={item.key} disabled={busy} aria-current={tab === item.key ? "page" : undefined} className={tab === item.key ? "active" : ""} onClick={() => { if (item.key === "inventory") openInventory(); else { setTab(item.key); setSidebarOpen(false); } }}><i className={`bi ${item.icon}`} aria-hidden="true" />{item.label}{item.key === "inventory" && criticalCount > 0 && <span className="admin-nav-count">{criticalCount}</span>}</button>)}
        </nav>
        <div className="admin-sidebar-bottom"><Link to="/menu"><i className="bi bi-arrow-up-right" aria-hidden="true" /> View store</Link><button disabled={busy} onClick={handleLogout}><i className="bi bi-box-arrow-right" aria-hidden="true" /> Log out</button></div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar"><button className="admin-mobile-menu admin-icon-button" aria-label="Toggle admin menu" aria-expanded={sidebarOpen} aria-controls="admin-navigation" onClick={() => setSidebarOpen(!sidebarOpen)}><i className="bi bi-list" aria-hidden="true" /></button><div><h1>{navItems.find((item) => item.key === tab)?.label}</h1><p>Everest Butchery / Admin</p></div><div className="admin-topbar-actions"><button className="admin-icon-button" title="Refresh data" aria-label="Refresh data" disabled={loading || busy} onClick={loadAll}><i className="bi bi-arrow-clockwise" aria-hidden="true" /></button><span className="admin-staff"><i className="bi bi-shield-check" aria-hidden="true" />{user?.full_name || "Admin"}</span></div></header>
        <div className="admin-content">
      {error && <div className="error-box" role="alert">{error}</div>}

      {loading ? (
        <p><PendingLabel>Loading...</PendingLabel></p>
      ) : tab === "dashboard" ? (
        <>
        <section className="dashboard-stock-alerts">
          <div className="admin-section-heading"><h2>Stock Alerts</h2><button className="admin-icon-button" title="Open inventory" aria-label="Open inventory" onClick={() => openInventory()}><i className="bi bi-arrow-up-right" aria-hidden="true" /></button></div>
          <p className="sr-only" role="status">{warningCount} products running low. {criticalCount} products with limited stock or sold out.</p>
          {warningCount + criticalCount > 0 ? <div className="stock-alert-grid">
            {[{ level: "critical", count: criticalCount, label: "Limited stock available", description: "Below 20% remaining or sold out" }, { level: "warning", count: warningCount, label: "Stock running low", description: "Below 50% remaining" }].filter((alert) => alert.count > 0).map((alert) => <button key={alert.level} className={`stock-alert-button stock-${alert.level}`} onClick={() => openInventory(alert.level)} aria-label={`View ${alert.count} ${alert.level === "critical" ? "limited-stock" : "low-stock"} products in inventory`}>
              <div className="stock-alert-title"><i className="bi bi-exclamation-triangle" aria-hidden="true" /><strong>{alert.label}</strong><span>{alert.count}</span><i className="bi bi-arrow-right" aria-hidden="true" /></div>
              <p>{alert.description}</p>
            </button>)}
          </div> : <div className="stock-health-message"><i className={`bi ${tracked.length ? "bi-check-circle" : "bi-info-circle"}`} aria-hidden="true" /><span>{tracked.length ? "Stock good. No low-stock warnings." : "Stock tracking has not been set up yet."}</span><button className="btn btn-outline" onClick={() => openInventory()}>{tracked.length ? "View inventory" : "Set up inventory"}</button></div>}
        </section>
        <SalesDashboard
          data={dashboard}
          loading={dashboardLoading}
          range={dashboardRange}
          onRangeChange={handleDashboardRangeChange}
        />
        </>
      ) : tab === "inventory" ? (
        <>
        <div className="inventory-metrics"><div><span>Stock in store</span><strong>{stockQuantity(totalWeight)} kg</strong><small>{tracked.length} tracked products</small></div><div><span>Stock good</span><strong>{tracked.filter((product) => stockStatus(product).level === "good").length}</strong><small>At least 50% remaining</small></div><div className="metric-warning"><span>Stock running low</span><strong>{warningCount}</strong><small>Below 50% remaining</small></div><div className="metric-critical"><span>Limited stock</span><strong>{criticalCount}</strong><small>Below 20% or sold out</small></div></div>
        <InventoryPanel products={products} onSaved={loadAll} statusFilter={inventoryFilter} onStatusFilterChange={setInventoryFilter} onBusyChange={(active) => { operationLock.current = active; setOperation(active ? { key: "inventory", label: "Saving stock..." } : null); }} />
        </>
      ) : tab === "products" ? (
        <div>
          <form className="form-card" onSubmit={handleSaveProduct} style={{ marginBottom: 30 }}>
            <fieldset disabled={busy}>
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>{form.id ? "Edit Product" : "Add Product"}</h3>

            <div className="image-uploader">
              <div className="image-preview">
                {previewUrl ? <img src={previewUrl} alt="" /> : <Icon name="meat" size={28} />}
              </div>
              <div className="image-uploader-actions">
                <label className="file-input-label">
                  {uploading ? <span className="admin-spinner" aria-hidden="true" /> : <Icon name="check" size={14} />}
                  {uploading ? "Uploading…" : previewUrl ? "Replace photo" : "Upload photo"}
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageChange} disabled={uploading} />
                </label>
                {previewUrl && (
                  <button type="button" className="remove-btn" onClick={removeImage} style={{ textAlign: "left" }}>
                    Remove photo
                  </button>
                )}
                <span style={{ fontSize: 12, color: "#999" }}>JPG, PNG, WEBP or GIF, up to 5MB</span>
              </div>
            </div>

            <div className="admin-product-fields">
              <div className="field">
                <label htmlFor="product-category">Category</label>
                <select
                  id="product-category"
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  required
                >
                  <option value="">Select…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name_en}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="product-unit">Unit</label>
                <select id="product-unit" disabled={form.stock_quantity != null} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                  <option value="kg">kg</option>
                  <option value="piece">piece</option>
                  <option value="pack">pack</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="product-name">Name (English)</label>
                <input id="product-name" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} required />
              </div>
              <div className="field">
                <label htmlFor="product-nepali-name">Name (Nepali, optional)</label>
                <input id="product-nepali-name" value={form.name_np || ""} onChange={(e) => setForm({ ...form, name_np: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="product-price">Price per unit (kr)</label>
                <input
                  type="number"
                  id="product-price"
                  min="0"
                  step="0.01"
                  value={form.price_per_unit}
                  onChange={(e) => setForm({ ...form, price_per_unit: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="product-featured">Featured on homepage</label>
                <select
                  id="product-featured"
                  value={form.is_featured ? "1" : "0"}
                  onChange={(e) => setForm({ ...form, is_featured: Number(e.target.value) })}
                >
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="product-visible">Visible on menu</label>
                <select
                  id="product-visible"
                  value={Number(form.is_visible) === 0 ? "0" : "1"}
                  onChange={(e) => setForm({ ...form, is_visible: Number(e.target.value) })}
                >
                  <option value="1">Visible</option>
                  <option value="0">Hidden</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="product-description">Description</label>
              <textarea id="product-description" rows={2} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" disabled={saving || uploading}>
                {saving ? <PendingLabel>Saving...</PendingLabel> : form.id ? "Update Product" : "Add Product"}
              </button>
              {form.id && (
                <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancel Edit</button>
              )}
            </div>
            </fieldset>
          </form>

          <div className="admin-table-scroll"><table className="cart-table admin-data-table">
            <thead>
              <tr><th></th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Menu</th><th></th></tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const thumb = productImageUrl(p.image_url);
                return (
                  <tr key={p.id}>
                    <td>
                      {thumb ? <img src={thumb} alt="" className="thumb" /> : <Icon name={categoryIcon(p.category_name_en)} size={22} />}
                    </td>
                    <td>{p.name_en}</td>
                    <td>{p.category_name_en}</td>
                    <td>{formatPrice(p.price_per_unit)} / {p.unit}</td>
                    <td>
                      <button className="pill" disabled={busy || (p.stock_quantity != null && Number(p.stock_quantity) === 0)} onClick={() => toggleStock(p)}>
                        {operation?.key === `stock-${p.id}` ? <PendingLabel>Updating...</PendingLabel> : Number(p.in_stock) ? "In stock" : "Out of stock"}
                      </button>
                      <small>{p.stock_quantity == null ? "Quantity not tracked" : `${stockQuantity(p.stock_quantity)} ${p.unit}`}</small>
                    </td>
                    <td>
                      <button className="pill" disabled={busy} onClick={() => toggleVisible(p)}>
                        {operation?.key === `visible-${p.id}` ? <PendingLabel>Updating...</PendingLabel> : Number(p.is_visible) ? "Visible" : "Hidden"}
                      </button>
                    </td>
                    <td style={{ display: "flex", gap: 8 }}>
                      <button className="remove-btn" disabled={busy} onClick={() => startEdit(p)}>Edit</button>
                      <button className="remove-btn" disabled={busy} onClick={() => handleDelete(p.id)}>{operation?.key === `delete-${p.id}` ? <PendingLabel>Deleting...</PendingLabel> : "Delete"}</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        </div>
      ) : (
        <div className="admin-table-scroll"><table className="cart-table admin-data-table">
          <thead>
            <tr><th>Order #</th><th>Customer</th><th>Total</th><th>Fulfillment</th><th>Status</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.order_number}</td>
                <td>{o.full_name || "-"} <span style={{ color: "#888" }}>{o.phone}</span></td>
                <td>{formatPrice(o.total)}</td>
                <td>{o.fulfillment}</td>
                <td>
                  {operation?.key === `order-${o.id}` && <PendingLabel>Updating...</PendingLabel>}
                  <select disabled={busy} aria-label={`Status for ${o.order_number}`} value={o.status} onChange={(e) => handleStatusChange(o, e.target.value)}>
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
        </div>
      </div>
      {operation && <div className="admin-operation-feedback" role="status"><PendingLabel>{operation.label}</PendingLabel></div>}
    </div>
  );
}
