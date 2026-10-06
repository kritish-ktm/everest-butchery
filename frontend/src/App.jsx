import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Header from "./components/Header";
import StoreConditions from "./components/StoreConditions";
import Footer from "./components/Footer";
import CookiePreferences from "./components/CookiePreferences";
import Home from "./pages/Home";
import { adminAuth } from "./lib/adminAuth";
import Seo from "./components/Seo";
import PasswordRecoveryGate from "./components/PasswordRecoveryGate";
import { Component, lazy, Suspense, useEffect } from "react";

const Menu = lazy(() => import("./pages/Menu"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const Admin = lazy(() => import("./pages/Admin"));
const DashainOffers = lazy(() => import("./pages/DashainOffers"));
const Account = lazy(() => import("./pages/Account"));
const LegalPage = lazy(() => import("./pages/LegalPages"));

class RouteErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <section className="section container route-loading" role="alert"><h2>This page could not be loaded.</h2><button className="btn btn-primary" onClick={() => window.location.reload()}>Reload page</button></section>;
    return this.props.children;
  }
}

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
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <>
      <Seo />
      <PasswordRecoveryGate />
      <a href="#main-content" className="skip-link">Skip to content</a>
      {pathname !== "/admin" && <Header />}
      <main id="main-content" className={pathname === "/admin" ? "admin-root" : ""} tabIndex={-1}>
        {pathname !== "/admin" && <CookiePreferences />}
        {pathname !== "/admin" && pathname !== "/admin-login" && <StoreConditions />}
        <div className="page-turn-scene">
          <div key={pathname} className="page-turn-page">
            <RouteErrorBoundary>
            <Suspense fallback={<div className="section container route-loading" role="status">Loading...</div>}>
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
              <Route path="/privacy" element={<LegalPage />} />
              <Route path="/terms" element={<LegalPage />} />
              <Route path="/gdpr" element={<LegalPage />} />
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
            </Suspense>
            </RouteErrorBoundary>
          </div>
        </div>
      </main>
      {pathname !== "/admin" && <Footer />}
    </>
  );
}
