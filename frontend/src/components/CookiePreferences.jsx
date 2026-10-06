import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useCookiePreferences } from "../context/useCookiePreferences";
import "../cookiePreferences.css";

export default function CookiePreferences() {
  const { choice, settingsOpen, closeSettings, choose } = useCookiePreferences();
  const heading = useRef(null);
  useEffect(() => {
    if (settingsOpen) {
      heading.current?.scrollIntoView({ block: "center", behavior: "instant" });
      heading.current?.focus({ preventScroll: true });
    }
  }, [settingsOpen]);
  if (choice && !settingsOpen) return null;
  return <section className="cookie-preferences" aria-labelledby="cookie-heading">
    <div className="container cookie-preferences-inner">
      <div className="cookie-copy">
        <h2 id="cookie-heading" ref={heading} tabIndex={-1}>Cookies &amp; browser storage</h2>
        <p>Necessary storage keeps sign-in, your basket, and checkout working. Optional preference storage remembers your menu sort order on this device for up to 180 days. It stays off unless you accept.</p>
        <p>No advertising or analytics trackers are added by this choice. <Link to="/privacy">Privacy notice</Link></p>
        {choice && <small>Current choice: {choice.preferences ? "Optional preferences accepted" : "Necessary storage only"}.</small>}
      </div>
      <div className="cookie-actions">
        <button type="button" onClick={() => choose(false)}>Reject optional</button>
        <button type="button" onClick={() => choose(true)}>Accept optional</button>
        {choice && <button type="button" className="cookie-close" onClick={closeSettings} aria-label="Close cookie settings" title="Close cookie settings"><i className="bi bi-x-lg" aria-hidden="true" /></button>}
      </div>
    </div>
  </section>;
}
