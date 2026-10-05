-- Apply this once in the Supabase SQL Editor to enforce sign-in at checkout.
-- Existing schema.sql installations already have the create_order function.
revoke all on function public.create_order(jsonb) from public, anon;
grant execute on function public.create_order(jsonb) to authenticated;
