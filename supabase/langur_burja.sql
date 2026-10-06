-- Run once in Supabase Dashboard > SQL Editor for the Dashain game API.
-- The browser never accesses this table or function directly. Only the
-- Vercel function uses the server-side Supabase key.

create table if not exists public.dashain_game_players (
  player_key text primary key check (player_key ~ '^[a-f0-9]{64}$'),
  full_name text not null check (char_length(full_name) between 1 and 120),
  phone text,
  points integer not null default 100 check (points >= 100),
  rounds_played integer not null default 0 check (rounds_played >= 0),
  best_win integer not null default 0 check (best_win >= 0),
  last_played timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dashain_game_leaderboard_idx
  on public.dashain_game_players (points desc, best_win desc, rounds_played asc);

alter table public.dashain_game_players enable row level security;
revoke all on public.dashain_game_players from public, anon, authenticated;
grant all on public.dashain_game_players to service_role;

create or replace function public.dashain_game_action(
  p_action text,
  p_player_key text,
  p_full_name text default null,
  p_phone text default null,
  p_symbol text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_key text := pg_catalog.lower(pg_catalog.btrim(coalesce(p_player_key, '')));
  v_player public.dashain_game_players%rowtype;
  v_player_json jsonb;
  v_leaderboard jsonb;
  v_dice integer[];
  v_symbols text[] := array['jhanda', 'burja', 'itta', 'pan', 'hukum', 'chidi'];
  v_rewards integer[] := array[0, 5, 10, 20, 35, 50, 100];
  v_symbol_index integer;
  v_matches integer;
  v_earned integer;
  v_open boolean := pg_catalog.now() < '2026-10-26 00:00:00+00'::timestamptz;
begin
  if v_key !~ '^[a-f0-9]{64}$' then
    raise exception using errcode = '22023', message = 'Invalid player key.';
  end if;

  -- Close and clear campaign data after the advertised campaign date.
  if not v_open then
    delete from public.dashain_game_players;
    return pg_catalog.jsonb_build_object(
      'ok', true, 'is_open', false,
      'reset_at', '2026-10-26T00:00:00Z',
      'player', null, 'leaderboard', '[]'::jsonb
    );
  end if;

  if p_action = 'load' then
    select * into v_player
    from public.dashain_game_players
    where player_key = v_key;

  elsif p_action = 'register' then
    if p_full_name is null or pg_catalog.char_length(pg_catalog.btrim(p_full_name)) not between 1 and 120 then
      raise exception using errcode = '22023', message = 'Please enter a valid name.';
    end if;
    if p_phone is not null and pg_catalog.char_length(p_phone) > 40 then
      raise exception using errcode = '22023', message = 'Phone number is too long.';
    end if;

    insert into public.dashain_game_players (player_key, full_name, phone)
    values (
      v_key,
      pg_catalog.regexp_replace(pg_catalog.btrim(p_full_name), '\s+', ' ', 'g'),
      nullif(pg_catalog.btrim(coalesce(p_phone, '')), '')
    )
    on conflict (player_key) do nothing;

    select * into v_player
    from public.dashain_game_players
    where player_key = v_key;

  elsif p_action = 'roll' then
    if p_symbol is null or not (p_symbol = any(v_symbols)) then
      raise exception using errcode = '22023', message = 'Invalid Langur Burja symbol.';
    end if;

    select * into v_player
    from public.dashain_game_players
    where player_key = v_key
    for update;

    if not found then
      raise exception using errcode = '22023', message = 'Please register before playing.';
    end if;
    if v_player.last_played is not null and v_player.last_played > pg_catalog.now() - interval '2 seconds' then
      raise exception using errcode = 'P0001', message = 'Please wait before rolling again.';
    end if;

    select pg_catalog.array_agg(pg_catalog.floor(pg_catalog.random() * 6)::integer order by n)
    into v_dice
    from pg_catalog.generate_series(1, 6) as rolls(n);

    v_symbol_index := pg_catalog.array_position(v_symbols, p_symbol) - 1;
    select pg_catalog.count(*)::integer into v_matches
    from pg_catalog.unnest(v_dice) as die(value)
    where value = v_symbol_index;

    v_earned := v_rewards[v_matches + 1];

    update public.dashain_game_players
    set points = points + v_earned,
        rounds_played = rounds_played + 1,
        best_win = pg_catalog.greatest(best_win, v_earned),
        last_played = pg_catalog.now(),
        updated_at = pg_catalog.now()
    where player_key = v_key
    returning * into v_player;

  else
    raise exception using errcode = '22023', message = 'Unknown game action.';
  end if;

  if v_player.player_key is not null then
    v_player_json := pg_catalog.jsonb_build_object(
      'full_name', v_player.full_name,
      'points', v_player.points,
      'rounds_played', v_player.rounds_played,
      'best_win', v_player.best_win,
      'last_played', v_player.last_played
    );
  end if;

  select coalesce(
    pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'full_name', ranked.full_name,
      'points', ranked.points,
      'rounds_played', ranked.rounds_played,
      'best_win', ranked.best_win,
      'is_me', ranked.player_key = v_key
    ) order by ranked.points desc, ranked.best_win desc, ranked.rounds_played asc, ranked.created_at asc),
    '[]'::jsonb
  )
  into v_leaderboard
  from (
    select player_key, full_name, points, rounds_played, best_win, created_at
    from public.dashain_game_players
    order by points desc, best_win desc, rounds_played asc, created_at asc
    limit 10
  ) as ranked;

  return pg_catalog.jsonb_build_object(
    'ok', true,
    'is_open', true,
    'starting_points', 100,
    'reset_at', '2026-10-26T00:00:00Z',
    'player', v_player_json,
    'leaderboard', v_leaderboard,
    'dice', case when p_action = 'roll' then to_jsonb(v_dice) else null end,
    'matches', case when p_action = 'roll' then v_matches else null end,
    'earned', case when p_action = 'roll' then v_earned else null end
  );
end;
$$;

revoke all on function public.dashain_game_action(text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.dashain_game_action(text, text, text, text, text) to service_role;
