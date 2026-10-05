import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="section container page-shell about-page">
      <div className="page-heading about-heading">
        <span className="page-kicker">OUR STORY</span>
        <h2>A taste of home, prepared with care.</h2>
        <p>Fresh halal-certified meat and Nepali favourites, served by a family-run local shop in Copenhagen.</p>
      </div>

      <div className="about-commitment">
        <i className="bi bi-patch-check-fill" aria-hidden="true" />
        <p><strong>Halal-certified meat</strong><span>We are proud to serve meat that is halal-certified.</span></p>
      </div>

      <section className="about-story" aria-labelledby="about-story-title">
        <h3 id="about-story-title">Rooted in Nepali food culture</h3>
        <p>
          Everest Butchery began in 2025 with a simple idea: make it easier to find the ingredients
          and cuts that bring familiar Nepali meals to the table. From goat curry cuts to sekuwa
          favourites, we prepare fresh meat with care and respect for the food it will become.
        </p>
        <p>
          We are a family-run shop in Copenhagen, welcoming the Nepali community and everyone who
          appreciates quality meat, helpful service and flavours shared across generations.
        </p>
      </section>

      <section className="about-values" aria-label="What matters to us">
        <div>
          <h3>Prepared for your table</h3>
          <p>Choose familiar cuts for curries, grills and everyday cooking, with care taken in every order.</p>
        </div>
        <div>
          <h3>Local, family-run service</h3>
          <p>We bring a personal welcome and a taste of home to our neighbourhood in Copenhagen.</p>
        </div>
      </section>

      <p className="about-legal-links">
        Learn about your <Link to="/privacy">Privacy Notice</Link> and <Link to="/gdpr">GDPR Rights</Link>.
      </p>
    </div>
  );
}
