import { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { supabase } from "../lib/supabase";

const links = [
  { to: "/menu", label: "Menu" },
  { to: "/dashain-offers", label: "Dashain Offers", accent: true },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link to="/" className="brand">
          <img src="/logo.svg" alt="Everest Butchery" />
        </Link>

        <nav className={"main-nav" + (open ? " open" : "")} aria-label="Primary navigation">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)}
              className={({ isActive }) => "nav-link" + (isActive ? " active" : "") + (l.accent ? " nav-offer" : "")}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">
          <Link to="/account" className="account-link" aria-label={user ? "Your account" : "Log in or create an account"}>
            <span className="account-icon" aria-hidden="true">
              <i className="bi bi-person-standing account-person-standing" />
              <i className="bi bi-person-walking account-person-walking" />
            </span>
            <span>{user ? "Account" : "Login"}</span>
          </Link>
          <Link to="/cart" className="cart-link" aria-label={`Cart, ${count} items`}>
            <i className="bi bi-bag" aria-hidden="true" />
            {count > 0 && <span className="cart-count">{count % 1 === 0 ? count : count.toFixed(1)}</span>}
          </Link>
          <button
            className="burger"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            <i className={`bi ${open ? "bi-x-lg" : "bi-list"}`} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
