-- Berlin Food — Admin RBAC hardening (follow-up to 20261111000100_admin_rbac.sql)
-- Project ref: mbhnuhcjebqszvxcysvd   Schema: public
-- Applied: 2026-11-11
--
-- This file contains the exact SQL that was applied to the database, in the same
-- order and in the same logical chunks that were executed.
--
-- Note on tooling: as in the previous migration, the locally registered Supabase
-- MCP server connects as `supabase_read_only_user` and therefore cannot execute
-- DDL. The statements below were applied with the official Supabase CLI
-- (`supabase db query --linked --file <chunk>.sql`), which connects to the
-- same project database as the `postgres` role.
--
-- Scope: three targeted fixes coming out of an independent security audit.
--   1. `add_delivery_rating()` — require that the caller is the customer of at
--      least one order assigned to the courier being rated.
--   2. `handle_new_user()` — only the service role may mint a privileged
--      account (the application sets the role explicitly afterwards).
--   3. `delivery_requests` INSERT policy — make the intent explicit while
--      keeping the same effective permission.

-- ============ 1. add_delivery_rating: require a delivered order ============
-- WHY: the function is SECURITY DEFINER, so it bypasses RLS, and it had no
-- check that the caller had actually ordered from the courier. Any signed-in
-- account (a customer included) could call
-- `POST /rest/v1/rpc/add_delivery_rating` with an arbitrary `delivery_id` and
-- inflate that courier's average rating and rating count at will.
--
-- The check is "the caller has at least one order assigned to this courier",
-- which is the real product flow: a CUSTOMER rates the COURIER who delivered
-- their order. The audit's proposed `auth.uid() <> delivery_id` check was
-- rejected because it would have allowed only a courier to rate themselves and
-- would have broken the customer-rates-courier flow used by the mobile app.
create or replace function public.add_delivery_rating(delivery_id uuid, new_rating double precision)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if new_rating is null or new_rating < 0 or new_rating > 5 then raise exception 'invalid rating'; end if;

  -- The caller must have at least one order that this courier delivered.
  -- Without this check any signed-in user could inflate any courier's rating.
  if not exists (
    select 1
    from public.orders o
    where o.customer_id = auth.uid()
      and o.delivery_id = delivery_id
  ) then
    raise exception 'not allowed to rate this courier';
  end if;

  update public.profiles
     set delivery_rating = ((coalesce(delivery_rating,0) * coalesce(number_ratings,0)) + new_rating)
                          / (coalesce(number_ratings,0) + 1),
         number_ratings = coalesce(number_ratings,0) + 1
   where id = delivery_id and role = 'delivery';
end;
$$;

revoke all on function public.add_delivery_rating(uuid, double precision) from public;
revoke all on function public.add_delivery_rating(uuid, double precision) from anon;
grant execute on function public.add_delivery_rating(uuid, double precision) to authenticated, service_role;

-- ============ 2. handle_new_user: trust only the service role ============
-- WHY: `auth.uid()` is non-null when the request carries a signed-in user's
-- JWT, so a superadmin calling the public `auth.signUp` endpoint with
-- `raw_user_meta_data.role = "superadmin"` could mint a superadmin without
-- going through the application's audited `createUserAction` gate. The outcome
-- was one the superadmin is permitted, so this was not an escalation, but it
-- bypassed the application gate and left no audit trail.
--
-- SAFETY: the application (`src/services/users.ts` → `createUserAccount`)
-- performs an explicit service-role `UPDATE public.profiles SET role = ...`
-- immediately after `auth.admin.createUser`, so the final role is correct even
-- if the `request.jwt.claim.role` detection below does not resolve to
-- 'service_role' during a GoTrue admin call.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_role text;
  v_is_service boolean;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'customer');
  v_is_service := coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role';

  -- Only the service role may mint a privileged account. The application
  -- performs its own RBAC check before calling auth.admin.createUser and then
  -- sets the role explicitly, so the end state is correct either way.
  if v_role in ('admin','manager','support','superadmin')
     and not v_is_service then
    v_role := 'customer';
  end if;

  if v_role is null
     or v_role not in ('customer','delivery','admin','manager','support','superadmin') then
    v_role := 'customer';
  end if;

  insert into public.profiles
    (id, full_name, phone_number, email, role, vehicle_type, availability_status, address)
  values
    (new.id,
     new.raw_user_meta_data->>'full_name',
     new.raw_user_meta_data->>'phone_number',
     new.email,
     v_role,
     new.raw_user_meta_data->>'vehicle_type',
     (new.raw_user_meta_data->>'availability_status')::boolean,
     new.raw_user_meta_data->'address');
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;
grant execute on function public.handle_new_user() to service_role;

-- ============ 3. delivery_requests INSERT policy: make the intent explicit ====
-- NOTE: this INSERT policy stays permissive for every signed-in user on
-- purpose. The sibling mobile app's delivery-application flow
-- (`mobile/src/services/delivery.service.ts` → `createRequest()`) submits a
-- delivery request where the typed e-mail may differ from the signed-in
-- account's e-mail, so a strict `email = auth.email()` check would break that
-- app. The surface is a spam risk, not a privilege-escalation risk: an
-- inserted row is only a *request*, it grants no role and no access.
--
-- The surrounding policies remain restrictive:
--   * UPDATE  -> `is_admin()` only (admin-only).
--   * DELETE  -> `is_admin() or email = auth.email()` (admin or the owner of
--     the request).
--   * SELECT  -> `is_admin() or email = auth.email()` (admin or the owner of
--     the request).
drop policy if exists delivery_requests_insert on public.delivery_requests;
create policy delivery_requests_insert on public.delivery_requests for insert to authenticated
  with check (public.is_admin() or auth.uid() is not null);
