import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useCookiePreferences } from "../context/useCookiePreferences";
import "../cookiePreferences.css";

export default function CookiePreferences() {
  const { choice, settingsOpen, closeSettings, choose } = useCookiePreferences();
  const dialog = useRef(null);
  const visible = !choice || settingsOpen;
  useEffect(() => {
    if (!visible) return;
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    element.scrollTop = 0;
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);
  function dismiss() {
    if (choice) closeSettings();
    else choose(false);
  }
  if (!visible) return null;
  return createPortal(<dialog ref={dialog} className="cookie-preferences" aria-labelledby="cookie-heading" onCancel={event => { event.preventDefault(); dismiss(); }}>
    <div className="cookie-preferences-inner">
      <div className="cookie-copy">
        <img className="cookie-brand-logo" src="/logo.svg" alt="Everest Butchery" width="280" height="84" />
        <h2 id="cookie-heading" tabIndex={-1} autoFocus>Your privacy choices</h2>
        <p>Necessary storage keeps sign-in, your basket, and checkout working. Optional preference storage remembers your menu sort order on this device for up to 180 days. It stays off unless you accept.</p>
        <p>No advertising or analytics trackers are added by this choice. <Link to="/privacy" onClick={dismiss}>Privacy notice</Link></p>
        {choice && <small>Current choice: {choice.preferences ? "Optional preferences accepted" : "Necessary storage only"}.</small>}
      </div>
      <div className="cookie-actions">
        <button type="button" onClick={() => choose(false)}>Reject optional</button>
        <button type="button" onClick={() => choose(true)}>Accept optional</button>
        {choice && <button type="button" className="cookie-close" onClick={closeSettings} aria-label="Close cookie settings" title="Close cookie settings"><i className="bi bi-x-lg" aria-hidden="true" /></button>}
      </div>
    </div>
  </dialog>, document.body);
}
