import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { validQuantity } from "../lib/shopPresentation";

const CartContext = createContext(null);
const STORAGE_KEY = "eb_cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.filter((item) => item.product_id != null && validQuantity(item.quantity, item.unit) && Number.isFinite(item.price_per_unit) && item.price_per_unit >= 0) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* Cart remains usable if browser storage is unavailable. */ }
  }, [items]);

  function addItem(product, quantity) {
    if (!validQuantity(quantity, product.unit)) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name_en: product.name_en,
          name_np: product.name_np,
          unit: product.unit,
          price_per_unit: parseFloat(product.price_per_unit),
          quantity,
        },
      ];
    });
  }

  function updateQuantity(productId, quantity) {
    if (!Number.isFinite(quantity)) return;
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) => prev.map((i) => (i.product_id === productId && validQuantity(quantity, i.unit) ? { ...i, quantity } : i)));
  }

  function removeItem(productId) {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  }

  function clearCart() {
    setItems([]);
  }

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.price_per_unit, 0),
    [items]
  );

  const count = items.length;

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQuantity, removeItem, clearCart, subtotal, count }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
