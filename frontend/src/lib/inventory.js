export function stockStatus(product) {
  if (product.stock_quantity == null || product.stock_reference == null) {
    return { level: "untracked", label: "Not tracked", percent: null };
  }
  const percent = Number(product.stock_quantity) / Number(product.stock_reference) * 100;
  if (Number(product.stock_quantity) === 0) return { level: "critical", label: "Out of stock", percent };
  if (percent < 20) return { level: "critical", label: "Limited stock available", percent };
  if (percent < 50) return { level: "warning", label: "Stock running low", percent };
  return { level: "good", label: "Stock good", percent };
}

export function stockQuantity(value) {
  return new Intl.NumberFormat("en-DK", { maximumFractionDigits: 3 }).format(Number(value));
}
