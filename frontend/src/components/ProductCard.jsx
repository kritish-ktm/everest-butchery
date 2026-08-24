import { useState } from "react";
import { useCart } from "../context/CartContext";
import Icon from "./Icon";
import { categoryIcon } from "../lib/categoryIcon";
import { productImageUrl } from "../lib/imageUrl";

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(product.unit === "kg" ? 0.5 : 1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    if (qty <= 0) return;
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  const icon = categoryIcon(product.category_name_en || "");
  const imageUrl = productImageUrl(product.image_url);

  return (
    <div className="card product-card">
      <div className="product-media">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name_en} className="product-photo" />
        ) : (
          <Icon name={icon} size={56} />
        )}
      </div>
      <div className="product-body">
        <div className="product-name">
          {product.name_en}
          {product.name_np && <span className="product-np np"> · {product.name_np}</span>}
        </div>
        {product.description && <div className="product-desc">{product.description}</div>}
        <div className="product-price">
          {parseFloat(product.price_per_unit).toFixed(0)} kr <span>/ {product.unit}</span>
        </div>
        <div className="product-actions">
          <input
            className="qty-input"
            type="number"
            min={product.unit === "kg" ? 0.25 : 1}
            step={product.unit === "kg" ? 0.25 : 1}
            value={qty}
            onChange={(e) => setQty(parseFloat(e.target.value) || 0)}
            aria-label={`Quantity in ${product.unit}`}
          />
          <button className="btn btn-primary" style={{ flex: 1, padding: "12px 12px" }} onClick={handleAdd}>
            {added ? (
              <>
                <Icon name="check" size={16} /> Added
              </>
            ) : (
              "Add to Cart"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}