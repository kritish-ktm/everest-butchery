import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon";

const GAME_API = "/api/langur-burja";

const symbols = [
  { key: "jhanda", label: "Jhanda", icon: "flag" },
  { key: "burja", label: "Burja", icon: "crown" },
  { key: "itta", label: "Itta", icon: "diamond" },
  { key: "pan", label: "Pan", icon: "heart" },
  { key: "hukum", label: "Hukum", icon: "spade" },
  { key: "chidi", label: "Chidi", icon: "club" },
];

const rewardTable = [0, 5, 10, 20, 35, 50, 100];

function getPlayerKey() {
  const storageKey = "everest-langur-burja-player-key";
  let playerKey = localStorage.getItem(storageKey);

  if (!playerKey) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    playerKey = Array.from(bytes, (byte) =>
      byte.toString(16).padStart(2, "0")
    ).join("");
    localStorage.setItem(storageKey, playerKey);
  }

  return playerKey;
}

function getStoredPlayer() {
  try {
    return JSON.parse(localStorage.getItem("everest-langur-burja-player") || "null");
  } catch {
    return null;
  }
}

function saveStoredPlayer(player) {
  if (player) {
    localStorage.setItem("everest-langur-burja-player", JSON.stringify(player));
  }
}

function symbolForRoll(value) {
  return symbols[value] || symbols[0];
}

export default function DashainOffers() {
  const navigate = useNavigate();

  const [booking, setBooking] = useState({
    full_name: "",
    phone: "",
    email: "",
    fulfillment: "pickup",
    requested_time: "",
    notes: "",
  });

  const [playerKey] = useState(() => getPlayerKey());
  const [player, setPlayer] = useState(() => getStoredPlayer());
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingGame, setLoadingGame] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [dice, setDice] = useState([]);
  const [matches, setMatches] = useState(0);
  const [earned, setEarned] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState("jhanda");
  const [gameMessage, setGameMessage] = useState("");
  const [rollKey, setRollKey] = useState(0);
  const [gameOpen, setGameOpen] = useState(true);

  const selectedSymbolData = useMemo(
    () => symbols.find((symbol) => symbol.key === selectedSymbol) || symbols[0],
    [selectedSymbol]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadGame() {
      try {
        const response = await fetch(
          `${GAME_API}?player_key=${encodeURIComponent(playerKey)}`
        );
        const data = await response.json();

        if (cancelled) return;

        setPlayer(data.player || null);
        if (data.player) saveStoredPlayer(data.player);
        else localStorage.removeItem("everest-langur-burja-player");
        setLeaderboard(data.leaderboard || []);
        setGameOpen(data.is_open !== false);
        setGameMessage(data.message || "");
      } catch {
        if (!cancelled) {
          setGameMessage(
            "The Dashain game is temporarily unavailable. Please try again."
          );
        }
      } finally {
        if (!cancelled) setLoadingGame(false);
      }
    }

    loadGame();

    return () => {
      cancelled = true;
    };
  }, [playerKey]);

  function updateBooking(field, value) {
    setBooking((current) => ({ ...current, [field]: value }));
  }

  function startDashainBooking(event) {
    event.preventDefault();
    sessionStorage.setItem(
      "everest-dashain-booking",
      JSON.stringify(booking)
    );
    sessionStorage.setItem("everest-order-campaign", "dashain");
    navigate("/menu?campaign=dashain");
  }

  async function registerPlayer(event) {
    event.preventDefault();

    if (!booking.full_name.trim()) {
      setGameMessage("Please enter your name to join the game.");
      return;
    }

    setRegistering(true);
    setGameMessage("");

    try {
      const response = await fetch(GAME_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          player_key: playerKey,
          full_name: booking.full_name.trim(),
          phone: booking.phone.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.player) {
        throw new Error(data.message || "Registration failed.");
      }

      setPlayer(data.player);
      saveStoredPlayer(data.player);
      setLeaderboard(data.leaderboard || []);
      setGameMessage("Welcome to the Dashain Langur Burja challenge!");
    } catch (error) {
      setGameMessage(error.message || "Could not join the game.");
    } finally {
      setRegistering(false);
    }
  }

  async function rollDice() {
    if (rolling || !player) return;

    setRolling(true);
    setEarned(null);
    setMatches(0);
    setDice([]);
    setGameMessage("");

    try {
      const response = await fetch(GAME_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "roll",
          player_key: playerKey,
          symbol: selectedSymbol,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.player) {
        throw new Error(data.message || "Roll failed.");
      }

      setDice(data.dice || []);
      setMatches(Number(data.matches || 0));
      setEarned(Number(data.earned || 0));
      setPlayer(data.player);
      saveStoredPlayer(data.player);
      setLeaderboard(data.leaderboard || []);
      setRollKey((current) => current + 1);
      setGameMessage(
        data.earned > 0
          ? `Nice! ${data.matches} ${selectedSymbolData.label} match${
              data.matches === 1 ? "" : "es"
            } earned ${data.earned} Masu Points.`
          : "No matching symbols this round. Try again!"
      );
    } catch (error) {
      setGameMessage(error.message || "Could not roll the dice.");
    } finally {
      setRolling(false);
    }
  }

  return (
    <div className="dashain-page">
      <style>{`
        .langur-game {
          position: relative;
          overflow: hidden;
          margin-top: 24px;
          padding: 34px;
          border-radius: 8px;
          border: 1px solid rgba(245, 166, 35, 0.28);
          background:
            radial-gradient(circle at 50% 0%, rgba(245,166,35,.13), transparent 35%),
            linear-gradient(145deg, #171717 0%, #101010 58%, #241016 100%);
          color: #fff;
          box-shadow: 0 24px 70px rgba(0,0,0,.24);
        }

        .langur-game::before,
        .langur-game::after {
          display: none;
        }

        .langur-game-inner {
          position: relative;
          z-index: 1;
        }

        .langur-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #f5a623;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0;
          text-transform: uppercase;
        }

        .langur-title {
          margin: 8px 0 8px;
          font-size: clamp(30px, 5vw, 48px);
          line-height: 1.05;
          color: #fff;
        }

        .langur-subtitle {
          max-width: 760px;
          margin: 0;
          color: rgba(255,255,255,.72);
          line-height: 1.65;
        }

        .langur-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.45fr) minmax(280px, .75fr);
          gap: 24px;
          margin-top: 28px;
        }

        .langur-panel {
          min-width: 0;
          padding: 8px 0;
        }

        .points-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 22px;
          padding: 15px 18px;
          border-radius: 16px;
          background: linear-gradient(90deg, rgba(245,166,35,.14), rgba(213,41,76,.12));
          border: 1px solid rgba(245,166,35,.2);
        }

        .points-label {
          color: rgba(255,255,255,.62);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0;
          font-weight: 800;
        }

        .points-value {
          color: #f5a623;
          font-size: 28px;
          font-weight: 900;
          white-space: nowrap;
          animation: pointsArrive .38s ease both;
        }

        @keyframes pointsArrive {
          from { opacity: .45; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .symbol-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .symbol-button {
          min-height: 112px;
          padding: 12px 8px;
          border-radius: 17px;
          border: 1px solid rgba(255,255,255,.1);
          background: rgba(255,255,255,.04);
          color: #fff;
          cursor: pointer;
          transition: transform .18s ease, border-color .18s ease, background .18s ease;
        }

        .symbol-button:hover {
          transform: translateY(-2px);
          border-color: rgba(245,166,35,.45);
        }

        .symbol-button:focus-visible,
        .roll-button:focus-visible,
        .register-button:focus-visible {
          outline: 3px solid #fff;
          outline-offset: 3px;
        }

        .symbol-button.selected {
          border-color: #f5a623;
          background: linear-gradient(145deg, rgba(245,166,35,.19), rgba(213,41,76,.12));
          box-shadow: 0 10px 28px rgba(0,0,0,.16);
        }

        .symbol-icon {
          display: grid;
          place-items: center;
          height: 42px;
          line-height: 1;
          margin-bottom: 10px;
          color: #f5a623;
          transition: transform .2s ease;
        }

        .symbol-icon .icon {
          font-size: 29px !important;
        }

        .symbol-button.selected .symbol-icon {
          transform: translateY(-2px) scale(1.1);
        }

        .symbol-selected-mark {
          display: block;
          min-height: 14px;
          margin-top: 5px;
          color: #f5a623;
          font-size: 10px;
          font-weight: 800;
        }

        .symbol-name {
          display: block;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0;
          text-transform: uppercase;
        }

        .dice-row {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 13px;
          min-height: 96px;
          margin: 26px 0 20px;
        }

        .die {
          display: grid;
          place-items: center;
          width: 76px;
          height: 76px;
          border-radius: 18px;
          background: linear-gradient(145deg, #fff, #e8e8e8);
          color: #181818;
          border: 3px solid #f5a623;
          box-shadow: 0 14px 28px rgba(0,0,0,.25);
          animation: langurDie .42s ease both;
        }

        .die.rolling {
          animation: langurShake .34s ease-in-out infinite alternate;
          border-color: rgba(245,166,35,.7);
          background: linear-gradient(145deg, #fff8e8, #f4dfb4);
        }

        @keyframes langurShake {
          from { transform: translateY(-3px) rotate(-9deg); }
          to { transform: translateY(3px) rotate(9deg); }
        }

        .die-symbol {
          font-size: 39px;
          line-height: 1;
        }

        .die-name {
          margin-top: -2px;
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0;
        }

        @keyframes langurDie {
          0% { transform: translateY(-18px) rotate(-8deg) scale(.72); opacity: .2; }
          65% { transform: translateY(4px) rotate(3deg) scale(1.04); opacity: 1; }
          100% { transform: translateY(0) rotate(0) scale(1); }
        }

        .roll-button {
          width: 100%;
          min-height: 54px;
          border: 0;
          border-radius: 15px;
          background: linear-gradient(90deg, #f5a623, #d5294c);
          color: #171717;
          font-weight: 900;
          letter-spacing: 0;
          cursor: pointer;
          box-shadow: 0 14px 32px rgba(213,41,76,.2);
          transition: transform .18s ease, opacity .18s ease;
        }

        .roll-button:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .roll-button:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        .result-box {
          margin-top: 18px;
          padding: 17px;
          text-align: center;
          border-radius: 16px;
          background: rgba(245,166,35,.08);
          border: 1px solid rgba(245,166,35,.2);
          animation: resultArrive .36s ease both;
        }

        @keyframes resultArrive {
          from { opacity: 0; transform: translateY(8px) scale(.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .result-earned {
          display: block;
          margin-top: 5px;
          color: #f5a623;
          font-size: 25px;
          font-weight: 900;
        }

        .game-note {
          margin: 15px 0 0;
          color: rgba(255,255,255,.5);
          font-size: 12px;
          line-height: 1.55;
          text-align: center;
        }

        .leaderboard-title {
          margin: 0 0 15px;
          color: #fff;
          font-size: 19px;
        }

        .leaderboard-list {
          display: grid;
          gap: 8px;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .leaderboard-row {
          display: grid;
          grid-template-columns: 34px 1fr auto;
          align-items: center;
          gap: 10px;
          padding: 11px 12px;
          border-radius: 13px;
          background: rgba(255,255,255,.04);
        }

        .leaderboard-row.me {
          border: 1px solid rgba(245,166,35,.28);
          background: rgba(245,166,35,.08);
        }

        .leaderboard-rank {
          color: #f5a623;
          font-weight: 900;
        }

        .leaderboard-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-weight: 750;
        }

        .leaderboard-points {
          color: #f5a623;
          font-weight: 900;
        }

        .register-box {
          margin-top: 20px;
          padding: 18px 0 0;
          border-top: 1px solid rgba(255,255,255,.12);
        }

        .register-box h3 {
          margin: 0 0 6px;
          color: #fff;
          font-size: 18px;
        }

        .register-box p {
          margin: 0 0 14px;
          color: rgba(255,255,255,.58);
          font-size: 13px;
          line-height: 1.5;
        }

        .register-field {
          margin-bottom: 10px;
        }

        .register-field label {
          display: block;
          margin-bottom: 6px;
          color: rgba(255,255,255,.7);
          font-size: 12px;
          font-weight: 800;
        }

        .register-field input {
          width: 100%;
          box-sizing: border-box;
          padding: 11px 12px;
          border-radius: 11px;
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(0,0,0,.2);
          color: #fff;
          outline: none;
        }

        .register-field input:focus {
          border-color: rgba(245,166,35,.65);
        }

        .register-button {
          width: 100%;
          min-height: 43px;
          border: 1px solid rgba(245,166,35,.35);
          border-radius: 11px;
          background: transparent;
          color: #f5a623;
          font-weight: 850;
          cursor: pointer;
        }

        .game-message {
          margin: 16px 0 0;
          padding: 12px 14px;
          border-radius: 12px;
          background: rgba(255,255,255,.05);
          color: rgba(255,255,255,.76);
          font-size: 13px;
          line-height: 1.5;
        }

        .reward-table {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 7px;
          margin-top: 16px;
        }

        .reward-item {
          padding: 9px 6px;
          border-radius: 10px;
          text-align: center;
          background: rgba(255,255,255,.035);
          color: rgba(255,255,255,.62);
          font-size: 10px;
        }

        .reward-item strong {
          display: block;
          margin-top: 3px;
          color: #f5a623;
          font-size: 12px;
        }

        .points-label .icon,
        .roll-button .icon,
        .leaderboard-title .icon { margin-right: 7px; vertical-align: -2px; }

        .leaderboard-rank.top-rank { color: #f5a623; }
        .leaderboard-row.me { animation: resultArrive .35s ease both; }
        .game-message[role="status"] { min-height: 44px; }

        @media (prefers-reduced-motion: reduce) {
          .die, .die.rolling, .result-box, .leaderboard-row.me, .points-value { animation: none; }
          .symbol-button, .symbol-icon { transition: none; }
        }

        @media (max-width: 900px) {
          .langur-layout {
            grid-template-columns: 1fr;
          }

          .symbol-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 600px) {
          .langur-game {
            padding: 20px;
            border-radius: 8px;
          }

          .symbol-button {
            min-height: 96px;
          }

          .symbol-icon {
            font-size: 31px;
          }

          .die {
            width: 58px;
            height: 58px;
            border-radius: 14px;
          }

          .die-symbol {
            font-size: 30px;
          }

          .points-value {
            font-size: 23px;
          }
        }
      `}</style>

      {/* HEADER */}
      <section className="dashain-header">
        <div className="container">
          <span className="dashain-kicker">
            <Icon name="sparkles" size={15} /> FESTIVE SEASON · EVEREST BUTCHERY
          </span>
          <h1>Dashain Offers</h1>
          <p>
            Celebrate Dashain with festive offers, special cuts and a friendly points challenge.
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
                Book today to secure your fresh cuts for the Dashain festival.
                Limited stock available, so act fast!
              </p>
            </div>
            <div>
              <a
                href="#dashain-booking-form"
                className="btn btn-primary"
              >
                Book Your Order
              </a>
            </div>
          </div>

          <div className="product-grid">
            <div className="card product-card">
              <div className="product-media">
                <Icon name="goat" size={54} />
              </div>
              <div className="product-body">
                <div className="product-name">Whole Lamb / Goat</div>
                <div className="product-desc">
                  Traditional whole cuts for your family gathering.
                </div>
              </div>
            </div>

            <div className="card product-card">
              <div className="product-media">
                <Icon name="meat" size={54} />
              </div>
              <div className="product-body">
                <div className="product-name">Mixed Meat Packs</div>
                <div className="product-desc">
                  Curated packs with goat, buffalo, and chicken.
                </div>
              </div>
            </div>

            <div className="card product-card">
              <div className="product-media">
                <Icon name="chicken" size={54} />
              </div>
              <div className="product-body">
                <div className="product-name">Party Trays</div>
                <div className="product-desc">
                  Ready‑to‑cook trays for Dashain parties and events.
                </div>
              </div>
            </div>
          </div>

          <form
            className="dashain-booking-form"
            id="dashain-booking-form"
            onSubmit={startDashainBooking}
          >
            <div>
              <span className="hero-kicker">START YOUR BOOKING</span>
              <h3>Reserve your Dashain order</h3>
              <p>
                Tell us who to prepare the order for, then choose your meat
                from the normal menu.
              </p>
            </div>

            <div className="dashain-booking-fields">
              <div className="field">
                <label htmlFor="dashain-name">Full name</label>
                <input
                  id="dashain-name"
                  value={booking.full_name}
                  onChange={(event) =>
                    updateBooking("full_name", event.target.value)
                  }
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="dashain-phone">Phone</label>
                <input
                  id="dashain-phone"
                  value={booking.phone}
                  onChange={(event) =>
                    updateBooking("phone", event.target.value)
                  }
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="dashain-email">Email (optional)</label>
                <input
                  id="dashain-email"
                  type="email"
                  value={booking.email}
                  onChange={(event) =>
                    updateBooking("email", event.target.value)
                  }
                />
              </div>

              <div className="field">
                <label htmlFor="dashain-time">
                  Preferred date and time (optional)
                </label>
                <input
                  id="dashain-time"
                  type="datetime-local"
                  value={booking.requested_time}
                  onChange={(event) =>
                    updateBooking("requested_time", event.target.value)
                  }
                />
              </div>

              <div className="field">
                <label htmlFor="dashain-fulfillment">Order type</label>
                <select
                  id="dashain-fulfillment"
                  value={booking.fulfillment}
                  onChange={(event) =>
                    updateBooking("fulfillment", event.target.value)
                  }
                >
                  <option value="pickup">Pickup</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="dashain-notes">Notes (optional)</label>
                <textarea
                  id="dashain-notes"
                  rows={2}
                  value={booking.notes}
                  onChange={(event) =>
                    updateBooking("notes", event.target.value)
                  }
                  placeholder="Cut preference or special request"
                />
              </div>
            </div>

            <button className="btn btn-primary" type="submit">
              Continue to Dashain menu
            </button>
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
            <Icon name="info" size={18} /> Stock is limited. Orders are
            first‑come, first‑served.
          </div>
        </div>
      </section>

      {/* LANGUR BURJA GAME */}
      <section className="dashain-game-section" id="langur-burja">
        <div className="container">
          <div className="langur-game">
            <div className="langur-game-inner">
              <div className="langur-kicker">
                <Icon name="sparkles" size={15} /> DASHAIN POINTS CHALLENGE
              </div>

              <h2 className="langur-title">Langur Burja</h2>

              <p className="langur-subtitle">
                Choose a traditional symbol and roll six animated dice. Matching symbols add Masu Points to your score. Every player starts with <strong>100 points</strong>.
              </p>
              <p className="game-note game-disclosure">
                <Icon name="info" size={14} /> Free, non-wagering challenge: no purchase or payment is needed. Points have no cash value. The name you enter appears on the public leaderboard.
              </p>

              <div className="langur-layout">
                <div className="langur-panel">
                  <div className="points-bar">
                    <div>
                      <div className="points-label"><Icon name="points" size={13} /> {player ? "Your points" : "Starting points"}</div>
                      <div style={{ color: "rgba(255,255,255,.72)", fontSize: 12 }}>
                        Dashain Masu Points
                      </div>
                    </div>
                    <div className="points-value">
                      {loadingGame ? "…" : !gameOpen || (gameMessage && !player) ? "—" : Number(player?.points ?? 100)}
                    </div>
                  </div>

                  {!gameOpen ? (
                    <div className="register-box game-closed" role="status">
                      <Icon name="check" size={23} />
                      <h3>Thanks for celebrating with us</h3>
                      <p>This Dashain points challenge has ended. The leaderboard has been cleared for the next campaign.</p>
                    </div>
                  ) : !player ? (
                    <form onSubmit={registerPlayer}>
                      <div className="register-box" style={{ marginTop: 0 }}>
                        <h3>Join the leaderboard</h3>
                        <p>
                          Enter your name to receive your starting 100 Masu
                          Points. Phone is optional.
                        </p>

                        <div className="register-field">
                          <label htmlFor="game-name">Your name</label>
                          <input
                            id="game-name"
                            value={booking.full_name}
                            onChange={(event) =>
                              updateBooking("full_name", event.target.value)
                            }
                            placeholder="Enter your name"
                            required
                          />
                        </div>

                        <div className="register-field">
                          <label htmlFor="game-phone">Phone (optional)</label>
                          <input
                            id="game-phone"
                            value={booking.phone}
                            onChange={(event) =>
                              updateBooking("phone", event.target.value)
                            }
                            placeholder="Phone number"
                          />
                        </div>

                        <button
                          className="roll-button"
                          type="submit"
                          disabled={registering}
                        >
                          {registering ? "Joining…" : <><Icon name="sparkles" size={17} /> Start with 100 points</>}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div style={{ marginBottom: 13, color: "rgba(255,255,255,.72)", fontSize: 13 }}>
                        Choose your symbol:
                      </div>

                      <div className="symbol-grid" role="group" aria-label="Choose a Langur Burja symbol">
                        {symbols.map((symbol) => (
                          <button
                            key={symbol.key}
                            type="button"
                            className={`symbol-button ${
                              selectedSymbol === symbol.key ? "selected" : ""
                            }`}
                            onClick={() => setSelectedSymbol(symbol.key)}
                            aria-pressed={selectedSymbol === symbol.key}
                          >
                            <span className="symbol-icon"><Icon name={symbol.icon} /></span>
                            <span className="symbol-name">{symbol.label}</span>
                            <span className="symbol-selected-mark">{selectedSymbol === symbol.key ? "Selected" : ""}</span>
                          </button>
                        ))}
                      </div>

                      <div className="dice-row" aria-live="polite">
                        {rolling && Array.from({ length: 6 }, (_, index) => (
                          <div className="die rolling" key={`rolling-${index}`} aria-label={`Die ${index + 1} rolling`}>
                            <Icon name="dice" size={30} />
                          </div>
                        ))}
                        {dice.map((value, index) => {
                          const symbol = symbolForRoll(value);
                          return (
                            <div
                              className="die"
                              key={`${rollKey}-${index}`}
                              style={{ animationDelay: `${index * 55}ms` }}
                            >
                              <div>
                                <div className="die-symbol"><Icon name={symbol.icon} /></div>
                                <div className="die-name">{symbol.label}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {!dice.length && (
                        <div
                          style={{
                            minHeight: 76,
                            display: "grid",
                            placeItems: "center",
                            color: "rgba(255,255,255,.42)",
                            fontSize: 13,
                            textAlign: "center",
                          }}
                        >
                          {rolling ? "Rolling your six dice…" : "Choose a symbol, then roll to reveal all six dice."}
                        </div>
                      )}

                      <button
                        type="button"
                        className="roll-button"
                        onClick={rollDice}
                        disabled={rolling || loadingGame}
                      >
                        {rolling ? "Rolling…" : <><Icon name="dice" size={18} /> Roll for {selectedSymbolData.label}</>}
                      </button>

                      {earned !== null && (
                        <div className="result-box">
                          <div style={{ color: "rgba(255,255,255,.66)", fontSize: 12 }}>
                            {matches} matching symbol{matches === 1 ? "" : "s"}
                          </div>
                          <span className="result-earned">
                            +{earned} Masu Points
                          </span>
                        </div>
                      )}

                      <div className="reward-table">
                        {rewardTable.map((points, count) => (
                          <div className="reward-item" key={count}>
                            {count} match{count === 1 ? "" : "es"}
                            <strong>+{points}</strong>
                          </div>
                        ))}
                      </div>

                    </>
                  )}

                  {gameMessage && (
                    <div className="game-message" role="status" aria-live="polite">{gameMessage}</div>
                  )}
                </div>

                <aside className="langur-panel">
                  <h3 className="leaderboard-title"><Icon name="trophy" size={19} /> Dashain Leaderboard</h3>

                  {leaderboard.length > 0 ? (
                    <ol className="leaderboard-list">
                      {leaderboard.slice(0, 10).map((entry, index) => (
                        <li
                          key={entry.player_key || `${entry.full_name}-${index}`}
                          className={`leaderboard-row ${
                            player && entry.is_me
                              ? "me"
                              : ""
                          }`}
                        >
                          <span className={`leaderboard-rank${index < 3 ? " top-rank" : ""}`}>
                            #{index + 1}
                          </span>
                          <span className="leaderboard-name">
                            {entry.full_name}
                          </span>
                          <span className="leaderboard-points">
                            {Number(entry.points || 0)} <small>pts</small>
                          </span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p style={{ color: "rgba(255,255,255,.55)", fontSize: 13 }}>
                      Be the first player on the leaderboard.
                    </p>
                  )}

                  {player && (
                    <div className="register-box">
                      <h3>Your game</h3>
                      <p>
                        Playing as <strong style={{ color: "#fff" }}>{player.full_name}</strong>.
                        You have played {Number(player.rounds_played || 0)} round
                        {Number(player.rounds_played || 0) === 1 ? "" : "s"}.
                      </p>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          color: "rgba(255,255,255,.62)",
                          fontSize: 12,
                        }}
                      >
                        <span>Best round</span>
                        <strong style={{ color: "#f5a623" }}>
                          +{Number(player.best_win || 0)} pts
                        </strong>
                      </div>
                    </div>
                  )}
                </aside>
              </div>
            </div>
          </div>

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
