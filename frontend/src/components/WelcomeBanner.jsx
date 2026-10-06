import shopFront from "../assets/shop front.jpg";
import shopFrontSmall from "../assets/storefront-640.webp";
import shopFrontWebp from "../assets/storefront-1092.webp";
import "/src/WelcomeBanner.css";
import { Link } from "react-router-dom";

export default function WelcomeBanner() {
  return (
    <section className="welcome-banner">
      <div className="welcome-scene">
      <picture>
      <source type="image/webp" srcSet={`${shopFrontSmall} 640w, ${shopFrontWebp} 1092w`} sizes="100vw" />
      <img
        src={shopFront}
        alt="Everest Butchery storefront"
        className="welcome-bg"
        width="1092"
        height="648"
        fetchPriority="high"
      />
      </picture>
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
      </div>
    </section>
  );
}
