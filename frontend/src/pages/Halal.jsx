import Icon from "../components/Icon";
import Reveal from "../components/Reveal";

export default function Halal() {
  const points = [
    { icon: "halal", t: "Halal Certified", d: "All meat is sourced and slaughtered according to Islamic halal standards." },
    { icon: "fresh", t: "Cut Fresh Daily", d: "No meat sits longer than a day — cuts are prepared fresh each morning." },
    { icon: "check", t: "Trusted Sourcing", d: "We work with the same trusted suppliers our customers have relied on for years." },
    { icon: "skewer", t: "Cultural Cuts", d: "Curry cuts, boti, khasi and buff prepared the way Nepali kitchens expect." },
  ];
  return (
    <div className="section container">
      <Reveal>
        <h2 style={{ marginBottom: 10 }}>Halal & Quality</h2>
        <p style={{ color: "#666", maxWidth: 560, marginBottom: 30 }}>
          Everest Butchery exists to give the Nepali community in Denmark meat they can trust —
          fresh, and cut the way home cooking calls for.
        </p>
      </Reveal>
      <div className="product-grid">
        {points.map((p, i) => (
          <Reveal key={p.t} delay={i * 100}>
            <div className="card" style={{ padding: 22 }}>
              <div className="badge" style={{ marginBottom: 12 }}>
                <Icon name={p.icon} size={13} /> Verified
              </div>
              <h4 style={{ textTransform: "none", fontSize: 17, marginBottom: 6 }}>{p.t}</h4>
              <p style={{ fontSize: 14, color: "#666" }}>{p.d}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}