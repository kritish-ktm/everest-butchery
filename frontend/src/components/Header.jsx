import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

const links = [
  { to: "/menu", label: "Menu" },
  { to: "/dashain-offers", label: "Dashain Offers", accent: true },
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

        <nav className={"main-nav" + (open ? " open" : "")} aria-label="Primary navigation">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)}
              className={({ isActive }) => "nav-link" + (isActive ? " active" : "") + (l.accent ? " nav-offer" : "")}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">
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
