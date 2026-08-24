import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { adminAuth } from "../lib/adminAuth";
import { productImageUrl } from "../lib/imageUrl";
import { categoryIcon } from "../lib/categoryIcon";
import Icon from "../components/Icon";

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

export default function Admin() {
  const navigate = useNavigate();
  const user = adminAuth.getUser();

  const [tab, setTab] = useState("products");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadAll();
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

  async function handleLogout() {
    try {
      await api.adminLogout();
    } catch {
      // ignore — we clear the local session regardless
    }
    adminAuth.clearSession();
    navigate("/admin-login", { replace: true });
  }

  function startEdit(product) {
    setForm({ ...product });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setForm(emptyProduct);
  }

  async function handleSaveProduct(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (form.id) {
        await api.updateProduct(form);
      } else {
        await api.createProduct(form);
      }
      resetForm();
      await loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this product? This can't be undone, and its photo will be removed too.")) return;
    try {
      await api.deleteProduct(id);
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleStock(product) {
    try {
      await api.updateProduct({ id: product.id, in_stock: product.in_stock ? 0 : 1 });
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleVisible(product) {
    try {
      await api.updateProduct({ id: product.id, is_visible: product.is_visible ? 0 : 1 });
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const res = await api.uploadProductImage(file);
      setForm((f) => ({ ...f, image_url: res.path }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = ""; // allow re-selecting the same file later
    }
  }

  function removeImage() {
    setForm((f) => ({ ...f, image_url: "" }));
  }

  async function handleStatusChange(order, status) {
    try {
      await api.updateOrderStatus({ id: order.id, status });
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  const previewUrl = productImageUrl(form.image_url);

  return (
    <div className="section container">
      <div className="section-head">
        <div>
          <h2>Admin Dashboard</h2>
          <p>{user?.full_name ? `Signed in as ${user.full_name}` : ""}</p>
        </div>
        <button className="btn btn-outline" onClick={handleLogout}>Log Out</button>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="toggle-row" style={{ maxWidth: 320, marginBottom: 26 }}>
        <button className={"toggle-btn" + (tab === "products" ? " active" : "")} onClick={() => setTab("products")}>
          Products
        </button>
        <button className={"toggle-btn" + (tab === "orders" ? " active" : "")} onClick={() => setTab("orders")}>
          Orders
        </button>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : tab === "products" ? (
        <div>
          <form className="form-card" onSubmit={handleSaveProduct} style={{ marginBottom: 30 }}>
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>{form.id ? "Edit Product" : "Add Product"}</h3>

            <div className="image-uploader">
              <div className="image-preview">
                {previewUrl ? <img src={previewUrl} alt="" /> : <Icon name="meat" size={28} />}
              </div>
              <div className="image-uploader-actions">
                <label className="file-input-label">
                  <Icon name="check" size={14} />
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div className="field">
                <label>Category</label>
                <select
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
                <label>Unit</label>
                <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                  <option value="kg">kg</option>
                  <option value="piece">piece</option>
                  <option value="pack">pack</option>
                </select>
              </div>
              <div className="field">
                <label>Name (English)</label>
                <input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} required />
              </div>
              <div className="field">
                <label>Name (Nepali, optional)</label>
                <input value={form.name_np || ""} onChange={(e) => setForm({ ...form, name_np: e.target.value })} />
              </div>
              <div className="field">
                <label>Price per unit (kr)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.price_per_unit}
                  onChange={(e) => setForm({ ...form, price_per_unit: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Featured on homepage</label>
                <select
                  value={form.is_featured ? "1" : "0"}
                  onChange={(e) => setForm({ ...form, is_featured: Number(e.target.value) })}
                >
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </div>
              <div className="field">
                <label>Visible on menu</label>
                <select
                  value={form.is_visible === 0 ? "0" : "1"}
                  onChange={(e) => setForm({ ...form, is_visible: Number(e.target.value) })}
                >
                  <option value="1">Visible</option>
                  <option value="0">Hidden</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>Description</label>
              <textarea rows={2} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" disabled={saving || uploading}>
                {saving ? "Saving…" : form.id ? "Update Product" : "Add Product"}
              </button>
              {form.id && (
                <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancel Edit</button>
              )}
            </div>
          </form>

          <table className="cart-table">
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
                    <td>{parseFloat(p.price_per_unit).toFixed(0)} kr / {p.unit}</td>
                    <td>
                      <button className="pill" onClick={() => toggleStock(p)}>
                        {Number(p.in_stock) ? "In stock" : "Out of stock"}
                      </button>
                    </td>
                    <td>
                      <button className="pill" onClick={() => toggleVisible(p)}>
                        {Number(p.is_visible) ? "Visible" : "Hidden"}
                      </button>
                    </td>
                    <td style={{ display: "flex", gap: 8 }}>
                      <button className="remove-btn" onClick={() => startEdit(p)}>Edit</button>
                      <button className="remove-btn" onClick={() => handleDelete(p.id)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <table className="cart-table">
          <thead>
            <tr><th>Order #</th><th>Customer</th><th>Total</th><th>Fulfillment</th><th>Status</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.order_number}</td>
                <td>{o.full_name || "—"} <span style={{ color: "#888" }}>{o.phone}</span></td>
                <td>{parseFloat(o.total).toFixed(0)} kr</td>
                <td>{o.fulfillment}</td>
                <td>
                  <select value={o.status} onChange={(e) => handleStatusChange(o, e.target.value)}>
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
