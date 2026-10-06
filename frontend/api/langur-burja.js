import { createClient } from "@supabase/supabase-js";

const RESET_AT = "2026-10-26T00:00:00Z";
let supabaseAdmin;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVER_KEY
    || process.env.SUPABASE_SECRET_KEY
    || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return supabaseAdmin;
}

function cleanPlayerKey(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/i.test(value)
    ? value.toLowerCase()
    : null;
}

function publicError(error) {
  const message = error?.message || "The game is temporarily unavailable.";
  if (/wait before rolling/i.test(message)) return json({ message }, 429);
  if (/campaign has ended/i.test(message)) return json({ message, is_open: false }, 410);
  if (/valid name|phone number|player key|symbol|register before|unknown game action/i.test(message)) {
    return json({ message }, 400);
  }
  console.error("Dashain game request failed:", message);
  return json({ message: "The game is temporarily unavailable. Please try again." }, 503);
}

export default {
  async fetch(request) {
    if (request.method !== "GET" && request.method !== "POST") {
      return json({ message: "Method not allowed." }, 405);
    }

    const client = getSupabase();
    if (!client) {
      return json({ message: "The Dashain game is not configured yet." }, 503);
    }

    let input = {};
    let action = "load";
    if (request.method === "GET") {
      const url = new URL(request.url);
      input.player_key = url.searchParams.get("player_key");
    } else {
      const raw = await request.text();
      if (raw.length > 8000) return json({ message: "Request is too large." }, 413);
      try {
        input = JSON.parse(raw);
      } catch {
        return json({ message: "Invalid request body." }, 400);
      }
      action = input.action;
    }

    const playerKey = cleanPlayerKey(input.player_key);
    if (!playerKey) return json({ message: "Invalid player key." }, 400);
    if (action !== "load" && action !== "register" && action !== "roll") {
      return json({ message: "Unknown game action." }, 400);
    }

    const fullName = typeof input.full_name === "string"
      ? input.full_name.trim().replace(/\s+/g, " ")
      : null;
    const phone = typeof input.phone === "string" ? input.phone.trim() : null;
    const symbol = typeof input.symbol === "string" ? input.symbol : null;

    const { data, error } = await client.rpc("dashain_game_action", {
      p_action: action,
      p_player_key: playerKey,
      p_full_name: fullName,
      p_phone: phone,
      p_symbol: symbol,
    });

    if (error) return publicError(error);
    if (!data || typeof data !== "object") {
      return json({ message: "The game returned an invalid response." }, 503);
    }
    return json({ ...data, reset_at: data.reset_at || RESET_AT });
  },
};
