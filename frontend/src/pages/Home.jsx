import { Link } from "react-router-dom";
import { useShopData } from "../lib/useShopData";
import ProductCard from "../components/ProductCard";
import WelcomeBanner from "../components/WelcomeBanner";
import Reveal from "../components/Reveal";
import Icon from "../components/Icon";

export default function Home() {
  const { products, loading } = useShopData();
  const featured = products.filter((p) => Number(p.is_featured) === 1);

  return (
    <div>

      {/* EXISTING WELCOME BANNER */}
      <WelcomeBanner />

      {/* MAIN HERO */}
      <section className="hero">
        <div className="container hero-grid">

          <Reveal>
            <div>

              <span className="hero-kicker">
                EVEREST BUTCHERY · DENMARK
              </span>

              <h2 className="home-hero-title">
                FRESH MEAT,
                <br />
                CUT DAILY
              </h2>

              <p>
                Goat, buffalo, chicken and Nepali pantry staples -
                prepared the way your kitchen at home expects.
                Order online for pickup or delivery.
              </p>

              <div className="hero-actions">
                <Link to="/menu" className="btn btn-primary">
                  Shop the Menu
                </Link>

                <Link to="/dashain-offers" className="btn btn-outline">
                  Dashain Offers
                </Link>
              </div>

              <div className="hero-badges">
                <span className="badge">
                  <Icon name="fresh" size={13} />
                  In-house Fresh Cuts
                </span>

                <span className="badge">
                  <Icon name="truck" size={13} />
                  Pickup & Delivery
                </span>
              </div>

            </div>
          </Reveal>

          <Reveal delay={150}>

            <div className="hero-mountain">

              <img
                src="/logo.svg"
                alt="Everest Butchery"
              />

              <div className="hero-mountain-text">
                FRESH · AUTHENTIC · LOCAL
              </div>

            </div>

          </Reveal>

        </div>
      </section>


      {/* TRUST STRIP */}
      <div className="trust-strip">

        <div className="container">

          <div className="trust-item">
            <Icon
              name="fresh"
              size={20}
              className="gold"
            />

            Trusted by the Nepali community in Denmark
          </div>

          <div className="trust-item">
            <Icon
              name="clock"
              size={20}
              className="gold"
            />

            Same-day pickup available
          </div>

        </div>

      </div>


      {/* POPULAR PRODUCTS */}
      <section className="section container">

        <Reveal>

          <div className="section-head">

            <div>

              <h2>
                Popular This Week
              </h2>

              <p>
                Customer favourites, ready to add to your cart.
              </p>

            </div>

            <Link
              to="/menu"
              className="btn btn-outline"
            >
              View Full Menu
            </Link>

          </div>

        </Reveal>


        {!loading && (

          <div className="product-grid">

            {featured.map((p, i) => (

              <Reveal
                key={p.id}
                delay={i * 80}
              >

                <ProductCard product={p} />

              </Reveal>

            ))}

          </div>

        )}

      </section>

    </div>
  );
}