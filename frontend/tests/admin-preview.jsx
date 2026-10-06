// Development-only fixture. No credentials, production writes, or auth bypass in the app.
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import Admin from "../src/pages/Admin";
import { api } from "../src/lib/api";
import { adminAuth } from "../src/lib/adminAuth";
import { sampleCategories, sampleProducts } from "../src/lib/sampleData";
import "../src/index.css";
import "../src/shopping.css";
import "../src/admin.css";

let products = sampleProducts.map((product, index) => ({ ...product, stock_quantity: [100, 40, 15, 75, 0, 60, 35, 20, 10][index], stock_reference: 100, is_visible: true }));
adminAuth.getUser = () => ({ full_name: "Demo Admin" });
for (const operation of ["createProduct", "updateProduct", "deleteProduct", "uploadProductImage", "updateOrderStatus", "adminLogout"]) {
  api[operation] = async () => { throw new Error("This preview only supports inventory edits. No production data was changed."); };
}
api.createProduct = async (product) => {
  const id = Math.max(...products.map((item) => item.id), 0) + 1;
  products = [...products, { ...product, id, category_name_en: sampleCategories.find((category) => Number(category.id) === Number(product.category_id))?.name_en }];
  return { id };
};
api.updateProduct = async (product) => {
  products = products.map((item) => item.id === product.id ? { ...item, ...product } : item);
};
api.deleteProduct = async (id) => { products = products.filter((product) => product.id !== id); };
api.getCategories = async () => ({ categories: sampleCategories });
api.adminGetProducts = async () => ({ products: products.map((product) => ({ ...product })) });
api.adminGetOrders = async () => ({ orders: [{ id: 1, order_number: "DEMO-1001", full_name: "Demo customer", phone: "", total: 298, fulfillment: "pickup", status: "pending" }] });
api.adminGetDashboard = async () => ({ summary: { orders: 12, sales: 3490, average_order: 290.83, items_sold: 28 }, series: [], reports: {} });
api.setProductStock = async ({ product_id, quantity, reference, expected_quantity }) => {
  const existing = products.find((product) => product.id === product_id);
  if (existing.stock_quantity !== expected_quantity) throw new Error("Stock changed. Refresh and try again.");
  products = products.map((product) => product.id === product_id ? { ...product, stock_quantity: quantity, stock_reference: reference } : product);
};
createRoot(document.getElementById("root")).render(<BrowserRouter><Admin /></BrowserRouter>);
