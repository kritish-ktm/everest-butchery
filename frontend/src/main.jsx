import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { CookiePreferencesProvider } from "./context/CookiePreferencesContext.jsx";
import "./index.css";
import "./shopping.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <CartProvider>
        <CookiePreferencesProvider>
        <App />
        </CookiePreferencesProvider>
      </CartProvider>
    </BrowserRouter>
  </StrictMode>
);
