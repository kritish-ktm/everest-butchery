import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import Icon from "./Icon";
import { categoryIcon } from "../lib/categoryIcon";
import { productImageUrl } from "../lib/imageUrl";
import QuantityControl from "./QuantityControl";
import { formatPrice, quantityStep, productAvailable } from "../lib/shopPresentation";

export default function ProductCard({ product }) {
  const { addItem, items } = useCart();
  const [qty, setQty] = useState(() => product.stock_quantity == null ? (product.unit === "kg" ? 0.5 : 1) : Math.max(quantityStep(product.unit), Math.min(product.unit === "kg" ? 0.5 : 1, Math.floor(Number(product.stock_quantity) / quantityStep(product.unit)) * quantityStep(product.unit))));
  const [added, setAdded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const inStock = productAvailable(product);
  const remaining = product.stock_quantity == null ? Infinity : Math.max(0, Number(product.stock_quantity) - (items.find((item) => item.product_id === product.id)?.quantity || 0));
  const canAdd = inStock && qty <= remaining;
  useEffect(() => {
    if (!added) return undefined;
    const timer = setTimeout(() => setAdded(false), 1600);
    return () => clearTimeout(timer);
  }, [added]);

  function handleAdd() {
    if (qty <= 0 || !canAdd) return;
    addItem(product, qty);
    setAdded(true);
  }

  const icon = categoryIcon(product.category_name_en || "");
  const imageUrl = productImageUrl(product.image_url);

  return (
    <article className="card product-card">
      <div className="product-media">
        {imageUrl && !imageFailed ? (
          <img src={imageUrl} alt={product.name_en} className="product-photo" loading="lazy" onError={() => setImageFailed(true)} />
        ) : (
          <Icon name={icon} size={56} />
        )}
      </div>
      <div className="product-body">
        <div className="product-meta"><span>{product.category_name_en}</span><span className={inStock ? "stock-available" : "stock-unavailable"}>{inStock ? "Available" : "Sold out"}</span></div>
        <div className="product-name">
          {product.name_en}
          {product.name_np && <span className="product-np np"> · {product.name_np}</span>}
        </div>
        {product.description && <div className="product-desc">{product.description}</div>}
        <div className="product-price">
          {formatPrice(product.price_per_unit)} <span>/ {product.unit}</span>
        </div>
        <div className="product-selected-price">{qty} {product.unit} <strong>{formatPrice(Number(product.price_per_unit) * qty)}</strong></div>
        <div className="product-actions">
          <QuantityControl value={qty} unit={product.unit} name={product.name_en} onChange={setQty} disabled={!inStock} max={remaining} />
          <button className="btn btn-primary product-add" disabled={!canAdd} aria-label={inStock ? `Add ${qty} ${product.unit} of ${product.name_en} to cart` : `${product.name_en} is sold out`} onClick={handleAdd}>
            {added ? (
              <>
                <Icon name="check" size={16} /> Added
              </>
            ) : (
              <><i className="bi bi-bag-plus" aria-hidden="true" />{inStock ? "Add" : "Sold out"}</>
            )}
          </button>
        </div>
        {Number.isFinite(remaining) && <small className="product-stock-note">{!inStock ? "Sold out" : remaining > 0 ? `${remaining} ${product.unit} available to add` : "All remaining stock is in your cart"}</small>}
        <span className="sr-only" role="status">{added ? `${qty} ${product.unit} of ${product.name_en} added to your cart.` : ""}</span>
      </div>
    </article>
  );
}
