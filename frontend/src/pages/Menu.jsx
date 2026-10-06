import { Link, useSearchParams } from "react-router-dom";
import { useShopData } from "../lib/useShopData";
import ProductCard from "../components/ProductCard";
import { useCart } from "../context/CartContext";
import { filterProducts, formatPrice } from "../lib/shopPresentation";

export default function Menu() {
  const { categories, products, loading, usingSample } = useShopData();
  const [params, setParams] = useSearchParams();
  const { count, subtotal } = useCart();
  const activeCat = params.get("category") || "all";
  const query = params.get("q") || "";
  const sort = params.get("sort") || "featured";
  const featured = params.get("featured") === "1";
  const campaign = params.get("campaign")
    || sessionStorage.getItem("everest-order-campaign")
    || "";

  const filtered = filterProducts(products, { category: activeCat, query, sort, featured });
  function changeFilter(key, value) {
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (!value || value === "all" || (key === "sort" && value === "featured")) next.delete(key);
      else next.set(key, value);
      return next;
    }, { replace: true });
  }
  function resetFilters() {
    setParams((current) => {
      const next = new URLSearchParams(current);
      ["category", "q", "sort", "featured"].forEach((key) => next.delete(key));
      return next;
    });
  }

  return (
    <div className="section container page-shell shop-page">
      <div className="section-head page-heading">
        <div>
          <span className="page-kicker">EVERYDAY FRESH</span>
          <h1>Shop Our Menu</h1>
          <p>Priced per kg unless noted.</p>
        </div>
      </div>

      {campaign === "dashain" && (
        <div className="campaign-banner">
          <i className="bi bi-stars" aria-hidden="true" />
          <div>
            <strong>Dashain booking started</strong>
            <span>Pickup or delivery. Sign in at checkout to complete your booking.</span>
          </div>
        </div>
      )}

      <div className="shop-toolbar">
        <div className="shop-search">
          <i className="bi bi-search" aria-hidden="true" />
          <input type="search" aria-label="Search products" placeholder="Search meat, cuts or Nepali products" value={query} onChange={(event) => changeFilter("q", event.target.value)} />
          {query && <button type="button" title="Clear search" aria-label="Clear search" onClick={() => changeFilter("q", "")}><i className="bi bi-x-lg" aria-hidden="true" /></button>}
        </div>
        <label className="shop-sort">Sort by
          <select value={sort} onChange={(event) => changeFilter("sort", event.target.value)}>
            <option value="featured">Featured first</option>
            <option value="price-low">Unit price: low to high</option>
            <option value="price-high">Unit price: high to low</option>
            <option value="name">Name: A to Z</option>
          </select>
        </label>
      </div>
      <div className="category-pills shop-categories" role="group" aria-label="Product categories">
        <button className={"pill" + (activeCat === "all" ? " active" : "")} aria-pressed={activeCat === "all"} onClick={() => changeFilter("category", "all")}>All products <span>{products.length}</span></button>
        {categories.map((c) => (
          <button key={c.id} className={"pill" + (activeCat === String(c.id) ? " active" : "")} aria-pressed={activeCat === String(c.id)} onClick={() => changeFilter("category", String(c.id))}>
            {c.name_en} <span>{products.filter((p) => String(p.category_id) === String(c.id)).length}</span>
          </button>
        ))}
      </div>
      <div className="shop-results-bar">
        <span role="status">{loading ? "Loading products..." : `${filtered.length} product${filtered.length === 1 ? "" : "s"}`}</span>
        <label className="shop-checkbox"><input type="checkbox" checked={featured} onChange={(event) => changeFilter("featured", event.target.checked ? "1" : "")} /> Featured only</label>
        {(query || activeCat !== "all" || featured) && <button className="text-action" onClick={resetFilters}>Clear filters</button>}
      </div>
      {!loading && usingSample && <p className="catalog-notice" role="status">Live availability could not be loaded. These are sample products; please contact the shop before ordering.</p>}

      {loading ? (
        <div className="product-grid" aria-label="Loading products" aria-busy="true">{Array.from({ length: 6 }, (_, index) => <div key={index} className="product-skeleton" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><i className="bi bi-search" aria-hidden="true" /><h2>No matching products</h2><p>Try another search or category.</p><button className="btn btn-outline" onClick={resetFilters}>View all products</button></div>
      ) : (
        <div className="product-grid">
          {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
      {count > 0 && <Link to="/cart" className="shop-basket-bar"><span><i className="bi bi-bag" aria-hidden="true" /> {count} product{count === 1 ? "" : "s"} <strong>{formatPrice(subtotal)}</strong></span><span>View basket <i className="bi bi-arrow-right" aria-hidden="true" /></span></Link>}
    </div>
  );
}
