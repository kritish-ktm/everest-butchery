import Icon from "../components/Icon";
import Reveal from "../components/Reveal";

export default function Contact() {
  return (
    <div className="section container page-shell">
      <Reveal>
        <div className="page-heading">
          <span className="page-kicker">COME BY OR SAY HELLO</span>
          <h2>Contact & Store Info</h2>
          <p>We are here to help with your order or your next family meal.</p>
        </div>
      </Reveal>
      <div className="info-grid">
        <Reveal>
          <div className="card info-card">
            <h4 style={{ textTransform: "none", fontSize: 16, marginBottom: 14 }}>Contact Details</h4>
            <p className="contact-row"><Icon name="pin" size={16} /> Islevhusvej 9, 2700 København, Denmark</p>
            <p className="contact-row"><Icon name="phone" size={16} /> +45 71 33 83 50 </p>
            <p className="contact-row"><Icon name="mail" size={16} /> hello@everestbutchery.dk</p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="card info-card">
            <h4 style={{ textTransform: "none", fontSize: 16, marginBottom: 14 }}>Opening Hours</h4>
            {["SUN-SAT: 10:00–19:00"].map((row) => (
              <p className="contact-row" key={row}><Icon name="clock" size={16} /> {row}</p>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
}