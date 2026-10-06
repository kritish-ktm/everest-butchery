import { useState } from "react";
import { api } from "../lib/api";
import { stockQuantity, stockStatus } from "../lib/inventory";

export default function InventoryPanel({ products, onSaved, compact = false }) {
  const [editing, setEditing] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const rows = products.filter((product) => product.name_en.toLowerCase().includes(search.toLowerCase())).sort((a, b) => {
    const rank = { critical: 0, warning: 1, good: 2, untracked: 3 };
    return rank[stockStatus(a).level] - rank[stockStatus(b).level] || a.name_en.localeCompare(b.name_en);
  });

  function edit(product) {
    setEditing(product);
    setQuantity(product.stock_quantity ?? "");
    setReference(product.stock_reference ?? "");
    setError("");
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.setProductStock({ product_id: editing.id, quantity: Number(quantity), reference: Number(reference), expected_quantity: editing.stock_quantity == null ? null : Number(editing.stock_quantity) });
      setEditing(null);
      await onSaved();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  return (
    <section className="inventory-section">
      <div className="admin-section-heading"><div><h2>{compact ? "Stock Overview" : "Store Inventory"}</h2><p>Remaining stock by product. Warnings compare against the full-stock reference.</p></div>
        {!compact && <input type="search" aria-label="Search inventory" placeholder="Search inventory" value={search} onChange={(event) => setSearch(event.target.value)} />}
      </div>
      {editing && <form className="inventory-editor" onSubmit={save}>
        <h3>Update {editing.name_en}</h3>
        <div className="inventory-editor-fields">
          <div><label htmlFor="stock-quantity">Stock available ({editing.unit})</label><input id="stock-quantity" autoFocus type="number" min="0" step="0.001" value={quantity} onChange={(event) => {
            setQuantity(event.target.value);
            if (editing.stock_reference == null) setReference(event.target.value);
          }} required /></div>
          <div><label htmlFor="stock-reference">Full-stock reference ({editing.unit})</label><input id="stock-reference" type="number" min="0.001" step="0.001" value={reference} onChange={(event) => setReference(event.target.value)} required /></div>
        </div>
        {error && <p className="error-box" role="alert">{error}</p>}
        <div className="admin-form-actions"><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save stock"}</button><button type="button" className="btn btn-outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</button></div>
      </form>}
      <div className="admin-table-scroll"><table className="admin-data-table"><caption className="sr-only">Product stock levels</caption><thead><tr><th scope="col">Product</th><th scope="col">Available</th><th scope="col">Full stock</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
        <tbody>{rows.map((product) => {
          const status = stockStatus(product);
          return <tr key={product.id}><td><strong>{product.name_en}</strong><small>{product.category_name_en}</small></td><td>{product.stock_quantity == null ? "Not set" : `${stockQuantity(product.stock_quantity)} ${product.unit}`}</td><td>{product.stock_reference == null ? "-" : `${stockQuantity(product.stock_reference)} ${product.unit}`}</td><td><span className={`stock-status stock-${status.level}`}><i className={`bi ${status.level === "good" ? "bi-check-circle" : status.level === "untracked" ? "bi-dash-circle" : "bi-exclamation-triangle"}`} aria-hidden="true" />{status.label}</span>{status.percent != null && <div className="stock-meter"><progress max="100" value={Math.min(100, Math.max(0, status.percent))} aria-label={`${product.name_en} stock remaining`} /> <small>{Math.round(status.percent)}%</small></div>}</td><td><button type="button" className="admin-icon-button" title={`Update ${product.name_en} stock`} aria-label={`Update ${product.name_en} stock`} onClick={() => edit(product)}><i className="bi bi-pencil-square" aria-hidden="true" /></button></td></tr>;
        })}</tbody></table></div>
      {rows.length === 0 && <p className="admin-empty">{products.length ? "No products match your search." : "Add products to start tracking stock."}</p>}
    </section>
  );
}
