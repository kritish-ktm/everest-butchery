import { useEffect, useState } from "react";
import { api } from "./api";
import { sampleCategories, sampleProducts } from "./sampleData";

export function useShopData() {
  const [categories, setCategories] = useState(sampleCategories);
  const [products, setProducts] = useState(sampleProducts);
  const [usingSample, setUsingSample] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [catRes, prodRes] = await Promise.all([api.getCategories(), api.getProducts()]);
        if (!cancelled) {
          setCategories(catRes.categories);
          setProducts(prodRes.products);
          setUsingSample(false);
        }
      } catch {
        // Backend not reachable yet - keep sample data so the site is still browsable.
        if (!cancelled) setUsingSample(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { categories, products, loading, usingSample };
}
