import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon";

const prizes = [
  { label: "5% OFF", weight: 30, color: "#D5294C" },      // var(--red)
  { label: "10% OFF", weight: 25, color: "#F5A623" },     // var(--gold)
  { label: "15% OFF", weight: 18, color: "#1a1a1a" },     // dark
  { label: "20% OFF", weight: 10, color: "#D5294C" },
  { label: "FREE ITEM", weight: 5, color: "#F5A623" },
  { label: "TRY AGAIN", weight: 12, color: "#666666" },
];

function choosePrize() {
  const total = prizes.reduce((sum, prize) => sum + prize.weight, 0);
  const random = crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
  let value = random * total;

  for (const prize of prizes) {
    value -= prize.weight;
    if (value <= 0) {
      return prize;
    }
  }

  return prizes[0];
}

export default function DashainOffers() {
  const navigate = useNavigate();
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [booking, setBooking] = useState({
    full_name: "",
    phone: "",
    email: "",
    fulfillment: "pickup",
    requested_time: "",
    notes: "",
  });

  const segmentAngle = useMemo(() => 360 / prizes.length, []);

  function updateBooking(field, value) {
    setBooking((current) => ({ ...current, [field]: value }));
  }

  function startDashainBooking(event) {
    event.preventDefault();
    sessionStorage.setItem("everest-dashain-booking", JSON.stringify(booking));
    sessionStorage.setItem("everest-order-campaign", "dashain");
    navigate("/menu?campaign=dashain");
  }

  function spinWheel() {
    if (spinning) return;

    setSpinning(true);
    setWinner(null);

    const prize = choosePrize();
    const index = prizes.findIndex((p) => p.label === prize.label);

    // Angle where this segment’s center will be at the top (pointer)
    const segmentCenterAngle = index * segmentAngle + segmentAngle / 2;
    const targetRotationWithinCircle = 360 - segmentCenterAngle;

    const extraSpins = 360 * 7; // 7 full spins for drama

    // Always spin forward from current rotation
    const currentBase = Math.ceil(rotation / 360) * 360;
    const finalRotation = currentBase + extraSpins + targetRotationWithinCircle;

    setRotation(finalRotation);

    // Match this timeout to CSS transition duration (5s)
    setTimeout(() => {
      setWinner(prize);
      setSpinning(false);
    }, 5000);
  }

  return (
    <div className="dashain-page">
      {/* HEADER */}
      <section className="dashain-header">
        <div className="container">
          <span className="dashain-kicker">
            <Icon name="sparkles" size={15} /> FESTIVE SEASON · EVEREST BUTCHERY
          </span>
          <h1>Dashain Offers</h1>
          <p>
            Celebrate Dashain with special offers, surprises and a chance to win.
          </p>
        </div>
      </section>

      {/* DASHAIN MENU & BOOKING */}
      <section className="dashain-menu-section section" id="book-dashain">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="hero-kicker">DASHAIN MENU</span>
              <h2>Pre‑book Your Dashain Feast</h2>
              <p>
                Book today to secure your fresh cuts for the Dashain festival. Limited stock available, so act fast!
              </p>
            </div>
            <div>
              <a href="#dashain-booking-form" className="btn btn-primary">Book Your Order</a>
            </div>
          </div>

          <div className="product-grid">
            <div className="card product-card">
              <div className="product-media"><Icon name="goat" size={54} /></div>
              <div className="product-body">
                <div className="product-name">Whole Lamb / Goat</div>
                <div className="product-desc">
                  Traditional whole cuts for your family gathering.
                </div>
              </div>
            </div>

            <div className="card product-card">
              <div className="product-media"><Icon name="meat" size={54} /></div>
              <div className="product-body">
                <div className="product-name">Mixed Meat Packs</div>
                <div className="product-desc">
                  Curated packs with goat, buffalo, and chicken.
                </div>
              </div>
            </div>

            <div className="card product-card">
              <div className="product-media"><Icon name="chicken" size={54} /></div>
              <div className="product-body">
                <div className="product-name">Party Trays</div>
                <div className="product-desc">
                  Ready‑to‑cook trays for Dashain parties and events.
                </div>
              </div>
            </div>
          </div>

          <form className="dashain-booking-form" id="dashain-booking-form" onSubmit={startDashainBooking}>
            <div>
              <span className="hero-kicker">START YOUR BOOKING</span>
              <h3>Reserve your Dashain order</h3>
              <p>Tell us who to prepare the order for, then choose your meat from the normal menu.</p>
            </div>
            <div className="dashain-booking-fields">
              <div className="field">
                <label htmlFor="dashain-name">Full name</label>
                <input id="dashain-name" value={booking.full_name} onChange={(event) => updateBooking("full_name", event.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="dashain-phone">Phone</label>
                <input id="dashain-phone" value={booking.phone} onChange={(event) => updateBooking("phone", event.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="dashain-email">Email (optional)</label>
                <input id="dashain-email" type="email" value={booking.email} onChange={(event) => updateBooking("email", event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="dashain-time">Preferred date and time (optional)</label>
                <input id="dashain-time" type="datetime-local" value={booking.requested_time} onChange={(event) => updateBooking("requested_time", event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="dashain-fulfillment">Order type</label>
                <select id="dashain-fulfillment" value={booking.fulfillment} onChange={(event) => updateBooking("fulfillment", event.target.value)}>
                  <option value="pickup">Pickup</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="dashain-notes">Notes (optional)</label>
                <textarea id="dashain-notes" rows={2} value={booking.notes} onChange={(event) => updateBooking("notes", event.target.value)} placeholder="Cut preference or special request" />
              </div>
            </div>
            <button className="btn btn-primary" type="submit">Continue to Dashain menu</button>
          </form>

          <div
            style={{
              marginTop: 22,
              background: "#fdeceb",
              border: "1px solid var(--red)",
              borderRadius: "var(--radius)",
              padding: "12px 14px",
              fontSize: 14,
              color: "var(--red-dark)",
            }}
          >
            <Icon name="info" size={18} /> Stock is limited. Orders are first‑come, first‑served.
          </div>
        </div>
      </section>

      {/* GAME */}
      <section className="dashain-game-section">
        <div className="container">
          <div className="dashain-game-card">
            <div className="game-intro">
              <span className="game-kicker"><Icon name="gift" size={15} /> PLAY & WIN</span>
              <h2>Spin & Win</h2>
              <p>
                Give the wheel a spin and discover your Dashain offer.
              </p>
            </div>

            {/* WHEEL */}
            <div className="wheel-area">
              <div className="wheel-pointer" aria-hidden="true" />
              <div
                className="spin-wheel"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  // We still use inline style for dynamic rotation,
                  // but rely on your .spin-wheel transition for animation.
                }}
              >
                {prizes.map((prize, index) => (
                  <div
                    key={prize.label}
                    className="wheel-segment"
                    style={{
                      transform: `rotate(${index * segmentAngle}deg)`,
                    }}
                  >
                    <span
                      style={{
                        color:
                          prize.label === "TRY AGAIN" ? "#ddd" : "white",
                      }}
                    >
                      {prize.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="wheel-center"><Icon name="gift" size={28} /></div>
            </div>

            {/* BUTTON */}
            {!winner && (
              <button
                className="dashain-spin-button"
                onClick={spinWheel}
                disabled={spinning}
              >
                {spinning ? "SPINNING..." : "SPIN NOW"}
              </button>
            )}

            {/* RESULT */}
            {winner && (
              <div className="winner-box">
                <div className="winner-emoji"><Icon name="trophy" size={40} /></div>
                <span>YOU WON</span>
                <strong>{winner.label}</strong>
                <p>
                  Show this result when ordering to claim your offer.
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    className="btn btn-primary"
                    onClick={() => setWinner(null)}
                  >
                    Spin Again
                  </button>
                  <a href="#dashain-booking-form" className="btn btn-outline" onClick={() => setWinner(null)}>
                    Use Offer & Book
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* FUTURE GAMES */}
          <div className="future-games">
            <div>
              <Icon name="gift" size={18} />
              <span>More Dashain games coming soon</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}