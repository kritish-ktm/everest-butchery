import { useEffect, useState } from "react";
import { CONSENT_KEY, readConsent, saveConsent } from "../lib/cookiePreferences";
import { CookiePreferencesContext } from "./useCookiePreferences";

export function CookiePreferencesProvider({ children }) {
  const [choice, setChoice] = useState(readConsent);
  const [settingsOpen, setSettingsOpen] = useState(true);
  useEffect(() => {
    function sync(event) {
      if (event.key === CONSENT_KEY || event.key === null) setChoice(readConsent());
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  function choose(preferences) {
    setChoice(saveConsent(preferences));
    setSettingsOpen(false);
  }
  return <CookiePreferencesContext.Provider value={{ choice, settingsOpen, openSettings: () => setSettingsOpen(true), closeSettings: () => setSettingsOpen(false), choose }}>{children}</CookiePreferencesContext.Provider>;
}

