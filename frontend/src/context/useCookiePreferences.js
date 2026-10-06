import { createContext, useContext } from "react";

export const CookiePreferencesContext = createContext(null);

export function useCookiePreferences() {
  const value = useContext(CookiePreferencesContext);
  if (!value) throw new Error("CookiePreferencesProvider is required");
  return value;
}
