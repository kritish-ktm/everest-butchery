import { useEffect, useRef, useState } from "react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const GOOGLE_SCRIPT = "https://accounts.google.com/gsi/client";

export default function GoogleSignInButton({ onCredential }) {
  const buttonRef = useRef(null);
  const callbackRef = useRef(onCredential);
  const [ready, setReady] = useState(Boolean(window.google?.accounts?.id));
  const [scriptError, setScriptError] = useState(false);

  callbackRef.current = onCredential;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || ready) return undefined;

    const existing = document.querySelector(`script[src="${GOOGLE_SCRIPT}"]`);
    const script = existing || document.createElement("script");
    script.src = GOOGLE_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => setReady(true);
    script.onerror = () => setScriptError(true);
    if (!existing) document.head.appendChild(script);

    return undefined;
  }, [ready]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !ready || !buttonRef.current || !window.google?.accounts?.id) return;

    buttonRef.current.innerHTML = "";
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => callbackRef.current(response.credential),
      cancel_on_tap_outside: true,
    });
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
      width: 280,
    });
  }, [ready]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <p className="google-signin-note">
        Add <code>VITE_GOOGLE_CLIENT_ID</code> to the frontend environment to enable Google Sign-In.
      </p>
    );
  }

  if (scriptError) {
    return <p className="google-signin-note">Google Sign-In could not load. Guest checkout is still available.</p>;
  }

  return <div className="google-signin-button" ref={buttonRef} aria-label="Sign in with Google" />;
}