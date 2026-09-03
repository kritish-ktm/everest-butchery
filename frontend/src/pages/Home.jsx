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
                Goat, buffalo, chicken and Nepali pantry staples —
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


      {/* DANISH FAMILY ANIMATION */}
      <section className="danish-family-section">

        <div className="container">

          <div className="danish-family-heading">

            <span>
              LIFE IN DENMARK
            </span>

            <h2>
              Fresh Food.
              <br />
              Happy Moments.
            </h2>

            <p>
              From our kitchen to yours — bringing people
              together around good food.
            </p>

          </div>

        </div>


        <div className="danish-scene">

          {/* SKY */}
          <div className="scene-sun"></div>

          <div className="scene-cloud scene-cloud-one"></div>
          <div className="scene-cloud scene-cloud-two"></div>


          {/* DISTANT HILLS */}
          <div className="scene-hill hill-one"></div>
          <div className="scene-hill hill-two"></div>


          {/* DANISH HOUSE */}
          <div className="danish-house">

            <div className="house-roof"></div>

            <div className="house-wall">

              <div className="house-window"></div>

              <div className="house-window"></div>

              <div className="house-door"></div>

            </div>

            <div className="danish-flag">
              <span></span>
            </div>

          </div>


          {/* TREES */}
          <div className="scene-tree tree-left">
            <div className="tree-trunk"></div>
            <div className="tree-top"></div>
          </div>

          <div className="scene-tree tree-right">
            <div className="tree-trunk"></div>
            <div className="tree-top"></div>
          </div>


          {/* SWING */}
          <div className="swing">

            <div className="swing-frame-left"></div>
            <div className="swing-frame-right"></div>
            <div className="swing-bar"></div>

            <div className="swing-rope swing-rope-left"></div>
            <div className="swing-rope swing-rope-right"></div>

            {/* BOY */}
            <div className="swing-boy">

              <div className="boy-head">
                <div className="boy-hair"></div>

                <span className="boy-eye boy-eye-left"></span>
                <span className="boy-eye boy-eye-right"></span>
              </div>

              <div className="boy-body"></div>

              <div className="boy-arm boy-arm-left"></div>
              <div className="boy-arm boy-arm-right"></div>

              <div className="boy-leg boy-leg-left"></div>
              <div className="boy-leg boy-leg-right"></div>

            </div>

            <div className="swing-seat"></div>

          </div>


          {/* FAMILY */}
          <div className="scene-person person-one">
            <div className="person-head"></div>
            <div className="person-body"></div>
          </div>

          <div className="scene-person person-two">
            <div className="person-head"></div>
            <div className="person-body"></div>
          </div>


          {/* BBQ */}
          <div className="bbq">

            <div className="bbq-smoke"></div>

            <div className="bbq-grill">
              <span></span>
              <span></span>
              <span></span>
            </div>

            <div className="bbq-fire">
              <i></i>
              <i></i>
              <i></i>
            </div>

          </div>


          {/* GRASS */}
          <div className="grass grass-one"></div>
          <div className="grass grass-two"></div>
          <div className="grass grass-three"></div>

        </div>

      </section>


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