import { useState } from "react";
import { useShopData } from "../lib/useShopData";
import ProductCard from "../components/ProductCard";
import Reveal from "../components/Reveal";

export default function Menu() {
  const { categories, products, loading } = useShopData();
  const [activeCat, setActiveCat] = useState("all");

  const filtered = activeCat === "all" ? products : products.filter((p) => p.category_id === activeCat);

  return (
    <div className="section container">
      <div className="section-head">
        <div>
          <h2>Our Menu</h2>
          <p>Priced per kg unless noted.</p>
        </div>
      </div>

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