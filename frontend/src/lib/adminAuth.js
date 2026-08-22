// Admin auth token, kept in localStorage so a login survives a page refresh
// (but is cleared on logout, and rejected server-side once it expires).
const TOKEN_KEY = "eb_admin_token";
const USER_KEY = "eb_admin_user";

export const adminAuth = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch {
      return null;
    }
  },
  isLoggedIn: () => !!localStorage.getItem(TOKEN_KEY),
  setSession: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
