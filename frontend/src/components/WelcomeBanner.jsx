import shopFront from "../assets/shop front.jpg";
import "/src/WelcomeBanner.css";
import { Link } from "react-router-dom";

export default function WelcomeBanner() {
  return (
    <section className="welcome-banner">
      <div className="welcome-scene">
      <img
        src={shopFront}
        alt="Everest Butchery storefront"
        className="welcome-bg"
        width="1092"
        height="648"
        fetchPriority="high"
      />
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

        <Link to="/menu" className="btn btn-primary welcome-shop-link">Shop the Menu <i className="bi bi-arrow-right" aria-hidden="true" /></Link>

      </div>
      <a className="storefront-expand" href={shopFront} target="_blank" rel="noopener noreferrer" aria-label="View the full storefront photo" title="View the full storefront photo"><i className="bi bi-arrows-fullscreen" aria-hidden="true" /></a>
      </div>
    </section>
  );
}
