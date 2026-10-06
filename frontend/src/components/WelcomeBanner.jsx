import shopFront from "../assets/shop front.jpg";
import "/src/WelcomeBanner.css";
import { Link } from "react-router-dom";

export default function WelcomeBanner() {
  return (
    <section className="welcome-banner">

      {/* Shop illustration */}
      <img
        src={shopFront}
        alt="Everest Butchery storefront"
        className="welcome-bg"
      />

      {/* Dark/mirrored glass effect */}
      <div className="glass-overlay"></div>

      {/* Text placed ON the shop window */}
      <div className="shop-window-text">

        <span className="welcome-eyebrow">
          EVEREST BUTCHERY · DENMARK
        </span>

        <h1 className="welcome-title">
          <span className="welcome-shine">
            Everest Butchery
          </span>
        </h1>

        <p className="welcome-sub np">
          तपाईंको भान्साको लागि, ताजा मासु
        </p>

        <div className="welcome-line"></div>
        <Link to="/menu" className="btn btn-primary welcome-shop-link">Shop the Menu <i className="bi bi-arrow-right" aria-hidden="true" /></Link>

      </div>

    </section>
  );
}
