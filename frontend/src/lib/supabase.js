import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const authRedirectOrigin = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, "");

export const supabase = url && anonKey
  ? createClient(url, anonKey, { auth: { storageKey: "eb_supabase_auth" } })
  : null;

export const usesSupabase = Boolean(supabase);
