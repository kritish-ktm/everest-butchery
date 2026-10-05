import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">Everest <span>Butchery</span></Link>
          <p>
            Fresh cuts, familiar flavours, and Nepali pantry essentials for homes across Denmark.
          </p>
          <div className="footer-certification">
            <i className="bi bi-shield-check" aria-hidden="true" />
            Halal certified
          </div>
        </div>
        <div className="footer-column">
          <h4>Shop</h4>
          <Link to="/menu">Menu</Link>
          <Link to="/dashain-offers">Dashain Offers</Link>
          <Link to="/cart">Cart</Link>
        </div>
        <div className="footer-column">
          <h4>Visit</h4>
          <a href="tel:+4571338350"><i className="bi bi-telephone" aria-hidden="true" /> +45 71 33 83 50</a>
          <a href="mailto:hello@everestbutchery.dk">hello@everestbutchery.dk</a>
          <Link to="/contact">Store addresses & hours</Link>
        </div>
        <div className="footer-column">
          <h4>Legal</h4>
          <Link to="/privacy">Privacy Notice</Link>
          <Link to="/terms">Terms and Conditions</Link>
          <Link to="/gdpr">GDPR Rights</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Everest Butchery. All rights reserved.</span>
        <span>Freshly prepared in Denmark.</span>
      </div>
    </footer>
  );
}
