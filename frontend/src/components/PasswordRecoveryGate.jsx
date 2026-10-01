import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function PasswordRecoveryGate() {
  const initialHashParams = new URLSearchParams(window.location.hash.slice(1));
  const hasRecoveryError = initialHashParams.has("error") || initialHashParams.has("error_code");
  const [active, setActive] = useState(false);
  const [expired, setExpired] = useState(hasRecoveryError);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const expiredMessage = hasRecoveryError ? "This recovery link is invalid or has expired. Request a new one and open the newest email." : "";
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase) return undefined;

    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const searchParams = new URLSearchParams(window.location.search);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setActive(true);
    });

    if (hashParams.get("type") === "recovery" || searchParams.has("code")) {
      supabase.auth.getSession().then(({ data, error: sessionError }) => {
        if (!sessionError && data.session) setActive(true);
      });
    }

    return () => subscription.unsubscribe();
  }, []);

  async function updatePassword(event) {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) setError(updateError.message);
    else setDone(true);
    setSubmitting(false);
  }

  if (!active && !expired) return null;

  return (
    <div className="recovery-overlay">
      <section className="account-page recovery-panel">
        <div className="account-heading">
          <span className="page-kicker">EVEREST BUTCHERY</span>
          <h1>{expired ? "Link expired" : done ? "Password updated" : "Set a new password"}</h1>
          <p>{expired ? expiredMessage : done ? "Your password is ready to use." : "Choose a new password for your Everest Butchery admin account."}</p>
        </div>

        <div className="account-panel">
          {error && <div className="error-box" role="alert">{error}</div>}
          {expired ? (
            <Link className="btn btn-primary" to="/admin-login?reset=1" onClick={() => {
              window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
              setExpired(false);
            }}>Request a fresh recovery link</Link>
          ) : done ? (
            <Link className="btn btn-primary" to="/admin-login">Continue to admin login</Link>
          ) : (
            <form onSubmit={updatePassword}>
              <div className="field">
                <label htmlFor="recovery-password">New password</label>
                <input id="recovery-password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="recovery-confirm-password">Confirm new password</label>
                <input id="recovery-confirm-password" type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
              </div>
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? "Updating…" : "Update password"}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
