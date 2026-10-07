const currency = new Intl.NumberFormat("en-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatPrice(value) {
  return `${currency.format(Number(value))} kr`;
}

export function quantityStep(unit) {
  return unit === "kg" ? 0.25 : 1;
}

export function productAvailable(product) {
  const enabled = product.in_stock == null || Number(product.in_stock) === 1;
  return enabled && (product.stock_quantity == null || Number(product.stock_quantity) > 0);
}

export function validQuantity(value, unit) {
  const step = quantityStep(unit);
  return Number.isFinite(value) && value >= step && Math.abs(value / step - Math.round(value / step)) < 0.000001;
}

export function filterProducts(products, { category = "all", query = "", sort = "featured", featured = false }) {
  const terms = query.normalize("NFKC").trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const result = products.filter((product) => {
    const text = [product.name_en, product.name_np, product.description, product.category_name_en, product.category_name_np].filter(Boolean).join(" ").normalize("NFKC").toLocaleLowerCase();
    return (category === "all" || String(product.category_id) === category)
      && (!featured || Number(product.is_featured) === 1)
      && terms.every((term) => text.includes(term));
  });
  return result.sort((a, b) => {
    if (sort === "price-low") return Number(a.price_per_unit) - Number(b.price_per_unit);
    if (sort === "price-high") return Number(b.price_per_unit) - Number(a.price_per_unit);
    if (sort === "name") return a.name_en.localeCompare(b.name_en);
    return Number(b.is_featured) - Number(a.is_featured) || a.name_en.localeCompare(b.name_en);
  });
}
