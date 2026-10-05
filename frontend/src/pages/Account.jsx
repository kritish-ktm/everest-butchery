import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { authRedirectOrigin, supabase } from "../lib/supabase";

export default function Account() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [arriving, setArriving] = useState(false);
  const arrivalTimer = useRef(null);

  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => {
      subscription.unsubscribe();
      window.clearTimeout(arrivalTimer.current);
    };
  }, []);

  function welcomeHome() {
    setArriving(true);
    arrivalTimer.current = window.setTimeout(() => navigate("/", { replace: true }), 950);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!supabase) {
      setError("Account access is not configured. Please try again later.");
      return;
    }
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      if (mode === "recover") {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${authRedirectOrigin}/account`,
        });
        if (authError) throw authError;
        setMessage("If an account exists for that email, a recovery link has been sent.");
      } else if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: `${authRedirectOrigin}/account`,
          },
        });
        if (authError) throw authError;
        if (data.session) welcomeHome();
        else setMessage("Check your email to confirm your account, then log in.");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
        welcomeHome();
      }
    } catch (authError) {
      setError(authError.message || "We could not complete that request.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleCredential(credential) {
    if (!supabase) {
      setError("Account access is not configured. Please try again later.");
      return;
    }
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      const { error: authError } = await supabase.auth.signInWithIdToken({ provider: "google", token: credential });
      if (authError) throw authError;
      welcomeHome();
    } catch (authError) {
      setError(authError.message || "Google sign-in could not be completed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    const { data, error: authError } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
    if (authError) setError(authError.message);
    else {
      setUser(data.user);
      setMessage("Profile updated.");
    }
  }

  async function signOut() {
    const { error: authError } = await supabase.auth.signOut();
    if (authError) setError(authError.message);
    else {
      setUser(null);
      setPassword("");
      setMessage("You are signed out.");
    }
  }

  useEffect(() => {
    if (user) setName(user.user_metadata?.full_name || user.user_metadata?.name || "");
  }, [user]);

  if (loading) return <div className="section container account-page"><p>Loading account…</p></div>;

  return (
    <section className="section container page-shell account-page">
      <div className="account-heading">
        <span className="page-kicker">EVEREST BUTCHERY</span>
        <h1>{user ? "Your Account" : mode === "signup" ? "Create Account" : mode === "recover" ? "Reset Password" : "Welcome Back"}</h1>
        <p>{user ? "Manage your profile details." : mode === "recover" ? "We’ll send a recovery link to your email address." : "Sign in to your account or create one to get started."}</p>
      </div>

      <div className="account-panel">
        {!supabase && <div className="error-box">Supabase account access is not configured for this environment.</div>}
        {error && <div className="error-box" role="alert">{error}</div>}
        {message && <div className="account-message" role="status">{message}</div>}

        {user ? (
          <>
            <div className="account-identity">
              <span className="account-avatar" aria-hidden="true"><i className="bi bi-person" /></span>
              <div><strong>{user.user_metadata?.full_name || user.user_metadata?.name || "Everest customer"}</strong><span>{user.email}</span></div>
            </div>
            <form onSubmit={saveProfile}>
              <div className="field">
                <label htmlFor="account-name">Full name</label>
                <input id="account-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
              </div>
              <div className="field">
                <label htmlFor="account-email">Email</label>
                <input id="account-email" type="email" value={user.email || ""} readOnly />
              </div>
              <button className="btn btn-primary" type="submit">Save Profile</button>
              <button className="account-signout" type="button" onClick={signOut}>Sign Out</button>
            </form>
          </>
        ) : (
          <>
            <div className="account-tabs" role="tablist" aria-label="Account access">
              <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); setMessage(""); }}>Log In</button>
              <button type="button" role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setError(""); setMessage(""); }}>Create Account</button>
            </div>

            <form onSubmit={handleSubmit}>
              {mode === "signup" && (
                <div className="field">
                  <label htmlFor="account-name">Full name</label>
                  <input id="account-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
                </div>
              )}
              <div className="field">
                <label htmlFor="account-email">Email</label>
                <input id="account-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
              </div>
              {mode !== "recover" && (
                <div className="field">
                  <label htmlFor="account-password">Password</label>
                  <input id="account-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} required />
                </div>
              )}
              <button className={`btn btn-primary account-submit${arriving ? " is-entering" : ""}`} type="submit" disabled={submitting || arriving}>
                <span>{submitting ? "Please wait…" : mode === "signup" ? "Create Account" : mode === "recover" ? "Send recovery link" : "Log In"}</span>
                {mode !== "recover" && <span className="login-scene" aria-hidden="true">
                  <span className="login-character"><i className="head" /><i className="body" /><i className="arm" /><i className="leg leg-one" /><i className="leg leg-two" /></span>
                  <i className="bi bi-door-open login-door" />
                </span>}
              </button>
            </form>

            {mode === "login" ? (
              <button className="account-reset-link" type="button" onClick={() => { setMode("recover"); setError(""); setMessage(""); }}>Forgot password?</button>
            ) : mode === "recover" ? (
              <button className="account-reset-link" type="button" onClick={() => { setMode("login"); setError(""); setMessage(""); }}>Back to log in</button>
            ) : (
              <>
                <div className="account-divider"><span>or</span></div>
                <GoogleSignInButton onCredential={handleGoogleCredential} />
              <p className="account-terms">By creating an account, you agree to our <Link to="/terms">Terms</Link> and acknowledge our <Link to="/privacy">Privacy Notice</Link>.</p>
              </>
            )}
          </>
        )}
      </div>
      <p className="account-help">Need help? <Link to="/contact">Contact the shop</Link></p>
    </section>
  );
}
