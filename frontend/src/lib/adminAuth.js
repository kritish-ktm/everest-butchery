import { supabase, usesSupabase } from "./supabase";

const TOKEN_KEY = "eb_admin_token";
const USER_KEY = "eb_admin_user";
const SUPABASE_SESSION_KEY = "eb_supabase_auth";

function storedSupabaseSession() {
  try {
    return JSON.parse(localStorage.getItem(SUPABASE_SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

export const adminAuth = {
  getToken: () => usesSupabase ? storedSupabaseSession()?.access_token || null : localStorage.getItem(TOKEN_KEY),
  getUser: () => {
    if (usesSupabase) {
      const user = storedSupabaseSession()?.user;
      if (!user || user.app_metadata?.role !== "admin") return null;
      return { id: user.id, full_name: user.user_metadata?.full_name || user.email, email: user.email, role: "admin" };
    }
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch {
      return null;
    }
  },
  isLoggedIn: () => usesSupabase ? Boolean(adminAuth.getUser() && adminAuth.getToken()) : !!localStorage.getItem(TOKEN_KEY),
  setSession: (token, user) => {
    if (usesSupabase) return;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clearSession: () => {
    if (usesSupabase) {
      supabase.auth.signOut();
      return;
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
