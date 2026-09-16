import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import About from "./pages/About";
import Contact from "./pages/Contact";
import AdminLogin from "./pages/AdminLogin";
import Admin from "./pages/Admin";
import { adminAuth } from "./lib/adminAuth";
import DashainOffers from "./pages/DashainOffers";

// Not linked anywhere in the public nav — reachable only by typing the URL,
// and the backend independently rejects any admin request without a valid
// token, so this guard is a UX convenience, not the real security boundary.
function RequireAdmin({ children }) {
  if (!adminAuth.isLoggedIn()) {
    return <Navigate to="/admin-login" replace />;
  }
  return children;
}

function PageLoader({ children }) {
  const { pathname } = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const key = `everest-page-loaded:${pathname}`;
    const alreadyLoaded = sessionStorage.getItem(key) === "1";

    if (alreadyLoaded) {
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const timer = window.setTimeout(() => {
      sessionStorage.setItem(key, "1");
      setLoading(false);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  if (!loading) return children;

  return (
    <div className="page-loader" role="status" aria-live="polite">
      <div className="page-loader-mark"><img src="/logo.svg" alt="Everest Butchery" /></div>
      <p>Everest Butchery</p>
      <span>Preparing something fresh.......</span>
      <div className="page-loader-track"><div /></div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Header />
      <main>
        <PageLoader>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/dashain-offers" element={<DashainOffers />} />
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <Admin />
                </RequireAdmin>
              }
            />
          </Routes>
        </PageLoader>
      </main>
      <Footer />
    </>
  );
}
