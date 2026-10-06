import { useEffect, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
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
  const [openAt, setOpen] = useState(null);
  const [user, setUser] = useState(null);
  const [query, setQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const open = openAt === location.key;
  useEffect(() => {
    function closeMenu(event) { if (event.key === "Escape") setOpen(false); }
    document.addEventListener("keydown", closeMenu);
    return () => document.removeEventListener("keydown", closeMenu);
  }, []);

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

        <nav id="primary-navigation" className={"main-nav" + (open ? " open" : "")} aria-label="Primary navigation">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)}
              className={({ isActive }) => "nav-link" + (isActive ? " active" : "") + (l.accent ? " nav-offer" : "")}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <form className="header-search" role="search" onSubmit={(event) => { event.preventDefault(); navigate(`/menu${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`); }}>
          <input type="search" aria-label="Search the shop" placeholder="Search products" value={query} onChange={(event) => setQuery(event.target.value)} />
          <button type="submit" title="Search products" aria-label="Search products"><i className="bi bi-search" aria-hidden="true" /></button>
        </form>

        <div className="header-actions">
          <Link to="/account" className="account-link" aria-label={user ? "Your account" : "Log in or create an account"}>
            <span className="account-icon" aria-hidden="true">
              <i className="bi bi-person" />
            </span>
            <span>{user ? "Account" : "Login"}</span>
          </Link>
          <Link to="/cart" className="cart-link" aria-label={`Cart, ${count} items`}>
            <i className="bi bi-bag" aria-hidden="true" />
            {count > 0 && <span className="cart-count">{count}</span>}
          </Link>
          <button
            className="burger"
            onClick={() => setOpen(open ? null : location.key)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="primary-navigation"
          >
            <i className={`bi ${open ? "bi-x-lg" : "bi-list"}`} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
