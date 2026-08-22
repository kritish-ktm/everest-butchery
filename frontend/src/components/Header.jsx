import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

const links = [
  { to: "/menu", label: "Menu" },
  { to: "/halal", label: "Halal" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link to="/" className="brand">
          <img src="/logo.svg" alt="Everest Butchery" />
        </Link>

        <nav className={"main-nav" + (open ? " open" : "")}>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)}
              className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link to="/cart" className="cart-link" aria-label={`Cart, ${count} items`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 4h2l2.4 12.4a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="21" r="1"/><circle cx="18" cy="21" r="1"/>
            </svg>
            {count > 0 && <span className="cart-count">{count % 1 === 0 ? count : count.toFixed(1)}</span>}
          </Link>
          <button className="burger" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
