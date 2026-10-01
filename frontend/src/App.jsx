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
import Seo from "./components/Seo";
import Account from "./pages/Account";
import PasswordRecoveryGate from "./components/PasswordRecoveryGate";

// Not linked anywhere in the public nav - reachable only by typing the URL,
// and the backend independently rejects any admin request without a valid
// token, so this guard is a UX convenience, not the real security boundary.
function RequireAdmin({ children }) {
  if (!adminAuth.isLoggedIn()) {
    return <Navigate to="/admin-login" replace />;
  }
  return children;
}

export default function App() {
  const { pathname } = useLocation();

  return (
    <>
      <Seo />
      <PasswordRecoveryGate />
      <Header />
      <main>
        <div className="page-turn-scene">
          <div key={pathname} className="page-turn-page">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-confirmation" element={<OrderConfirmation />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/account" element={<Account />} />
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
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
