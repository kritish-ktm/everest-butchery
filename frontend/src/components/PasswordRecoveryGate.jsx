import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function PasswordRecoveryGate() {
  const [active, setActive] = useState(false);
  const [expired, setExpired] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase) return undefined;

    const params = new URLSearchParams(window.location.hash.slice(1));
    if (params.get("error_code") === "otp_expired") {
      setExpired(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setActive(true);
    });

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
          <p>{expired ? "This recovery link has expired or was already used." : done ? "Your password is ready to use." : "Choose a new password for your account."}</p>
        </div>

        <div className="account-panel">
          {error && <div className="error-box" role="alert">{error}</div>}
          {expired ? (
            <Link className="btn btn-primary" to="/account" onClick={() => {
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
