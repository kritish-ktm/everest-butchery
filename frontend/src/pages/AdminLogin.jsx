import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { adminAuth } from "../lib/adminAuth";
import { authRedirectOrigin, supabase, usesSupabase } from "../lib/supabase";
import "../admin.css";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [recovering, setRecovering] = useState(new URLSearchParams(window.location.search).get("reset") === "1");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      if (recovering) {
        const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${authRedirectOrigin}/admin-login`,
        });
        if (recoveryError) throw recoveryError;
        setMessage("If an account exists for that email, a password recovery link has been sent.");
        return;
      }
      const res = await api.adminLogin(email, password);
      adminAuth.setSession(res.token, res.user);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="section container page-shell narrow-page auth-page">
      <div className="form-card">
        <h2 style={{ fontSize: 22, marginBottom: 6 }}>{recovering ? "Reset Admin Password" : "Admin Login"}</h2>
        <p style={{ color: "#888", fontSize: 14, marginBottom: 22 }}>
          {recovering ? "We’ll send a secure link to set a new password for your  admin account." : "Staff access only."}
        </p>

        {error && <div className="error-box">{error}</div>}
        {message && <div className="account-message" role="status">{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          {!recovering && <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>}
          <button className="btn btn-primary" style={{ width: "100%" }} disabled={submitting || (recovering && !usesSupabase)}>
            {submitting ? "Please wait..." : recovering ? "Send recovery link" : "Log In"}
          </button>
        </form>
        {usesSupabase && <button className="account-reset-link" type="button" onClick={() => { setRecovering(!recovering); setError(""); setMessage(""); }}>
          {recovering ? "Back to admin login" : "Forgot password?"}
        </button>}
      </div>
    </div>
  );
}
