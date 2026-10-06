// Development-only fixture. No credentials, production writes, or auth bypass in the app.
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import Admin from "../src/pages/Admin";
import { api } from "../src/lib/api";
import { sampleCategories, sampleProducts } from "../src/lib/sampleData";
import "../src/index.css";
import "../src/shopping.css";
import "../src/admin.css";

let products = sampleProducts.map((product, index) => ({ ...product, stock_quantity: [100, 40, 15, 75, 0, 60, 35, 20, 10][index], stock_reference: 100, is_visible: true }));
for (const operation of ["createProduct", "updateProduct", "deleteProduct", "uploadProductImage", "updateOrderStatus", "adminLogout"]) {
  api[operation] = async () => { throw new Error("This preview only supports inventory edits. No production data was changed."); };
}
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
