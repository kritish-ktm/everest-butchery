import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <h4>Everest Butchery</h4>
          <p style={{ fontSize: 14, maxWidth: 320 }}>
            Goat, buffalo, chicken and Nepali pantry staples, cut fresh daily. Serving the Nepali community in Denmark.
          </p>
        </div>
        <div>
          <h4>Shop</h4>
          <Link to="/menu">Menu</Link>
          <Link to="/cart">Cart</Link>
        </div>
        <div>
          <h4>Visit</h4>
          <a href="tel:+4538280241">+45 38 28 02 41</a>
          <a href="mailto:hello@everestbutchery.dk">hello@everestbutchery.dk</a>
          <Link to="/contact">Store addresses & hours</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Everest Butchery. All rights reserved. Made by kriTish.</span>
      </div>
    </footer>
  );
}
