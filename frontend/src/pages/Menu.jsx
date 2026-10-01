import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useShopData } from "../lib/useShopData";
import ProductCard from "../components/ProductCard";
import Reveal from "../components/Reveal";

export default function Menu() {
  const { categories, products, loading } = useShopData();
  const { search } = useLocation();
  const [activeCat, setActiveCat] = useState("all");
  const campaign = new URLSearchParams(search).get("campaign")
    || sessionStorage.getItem("everest-order-campaign")
    || "";

  const filtered = activeCat === "all" ? products : products.filter((p) => p.category_id === activeCat);

  return (
    <div className="section container page-shell">
      <div className="section-head page-heading">
        <div>
          <span className="page-kicker">EVERYDAY FRESH</span>
          <h2>Our Menu</h2>
          <p>Priced per kg unless noted.</p>
        </div>
      </div>

      {campaign === "dashain" && (
        <div className="campaign-banner">
          <i className="bi bi-stars" aria-hidden="true" />
          <div>
            <strong>Dashain booking started</strong>
            <span>Choose your items below, then sign in at checkout to complete your order.</span>
          </div>
        </div>
      )}

      <div className="category-pills">
        <button className={"pill" + (activeCat === "all" ? " active" : "")} onClick={() => setActiveCat("all")}>All</button>
        {categories.map((c) => (
          <button key={c.id} className={"pill" + (activeCat === c.id ? " active" : "")} onClick={() => setActiveCat(c.id)}>
            {c.name_en}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading menu…</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state">No products in this category yet.</div>
      ) : (
        <div className="product-grid">
          {filtered.map((p, i) => (
            <Reveal key={p.id} delay={(i % 6) * 70}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
