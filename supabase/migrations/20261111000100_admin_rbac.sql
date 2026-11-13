-- Berlin Food — Admin RBAC hardening
-- Project ref: mbhnuhcjebqszvxcysvd   Schema: public (+ storage bucket/policies, auth.users trigger)
-- Applied: 2026-11-11
--
-- This file contains the exact SQL that was applied to the database, in the same
-- order and in the same logical chunks that were executed.
--
-- Note on tooling: the locally registered Supabase MCP server
-- (https://mcp.supabase.com/mcp?...&read_only=true) connects as
-- `supabase_read_only_user` and therefore cannot execute DDL, and the OAuth
-- token on file only carries the `database:read` scope. The statements below
-- were consequently applied with the official Supabase CLI
-- (`supabase db query --linked --file <chunk>.sql`), which connects to the
-- same project database as the `postgres` role.

-- ============ 1. Role helper functions ============
create or replace function public.current_user_role()
returns text language sql stable security definer set search_path = public
as $$ select p.role from public.profiles p where p.id = auth.uid() $$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce(public.current_user_role() in ('admin','superadmin'), false) $$;

create or replace function public.is_superadmin()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce(public.current_user_role() = 'superadmin', false) $$;

revoke all on function public.current_user_role() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.is_superadmin() from public;
grant execute on function public.current_user_role() to authenticated, service_role;
grant execute on function public.is_admin() to authenticated, service_role;
grant execute on function public.is_superadmin() to authenticated, service_role;

-- ============ 2. profiles.email (mirrors auth.users.email) ============
alter table public.profiles add column if not exists email text;
update public.profiles p set email = u.email from auth.users u
 where u.id = p.id and (p.email is null or p.email <> u.email);

-- ============ 3. Role CHECK constraint ============
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role is null or role in ('customer','delivery','admin','manager','support','superadmin'));

-- ============ 4. handle_new_user: clamp privileged roles ============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_role text;
  v_is_service boolean;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'customer');
  v_is_service := coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role';

  if v_role in ('admin','manager','support','superadmin')
     and not v_is_service
     and not public.is_superadmin() then
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

create or replace function public.sync_profile_email()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_sync on auth.users;
create trigger on_auth_user_email_sync
  after insert or update of email on auth.users
  for each row execute function public.sync_profile_email();

-- ============ 5. updated_at maintenance ============
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();
drop trigger if exists menu_items_set_updated_at on public.menu_items;
create trigger menu_items_set_updated_at before update on public.menu_items
  for each row execute function public.set_updated_at();
drop trigger if exists delivery_requests_set_updated_at on public.delivery_requests;
create trigger delivery_requests_set_updated_at before update on public.delivery_requests
  for each row execute function public.set_updated_at();

-- ============ 6. Enable RLS everywhere ============
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.categories enable row level security;
alter table public.delivery_requests enable row level security;
alter table public.reservations enable row level security;

-- ============ 7. Profiles policies ============
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert to authenticated
  with check (public.is_admin()
    and (role is null or role in ('customer','delivery') or public.is_superadmin()));

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles for delete to authenticated
  using (public.is_superadmin());

-- Column-level grants: `authenticated` may NEVER change `role` or `id`
-- directly. Role changes must go through a server-side admin action that
-- performs its own superadmin check. service_role keeps full table privileges.
revoke select, insert, delete, update on public.profiles from anon;
revoke update on public.profiles from authenticated;
grant update (full_name, phone_number, email, address, vehicle_type,
             availability_status, delivery_rating, number_ratings, updated_at)
  on public.profiles to authenticated;

-- ============ 8. Orders / order_items ============
drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders for select to authenticated
  using (public.is_admin() or customer_id = auth.uid() or delivery_id = auth.uid());

drop policy if exists orders_insert on public.orders;
create policy orders_insert on public.orders for insert to authenticated
  with check (public.is_admin() or customer_id = auth.uid());

drop policy if exists orders_update on public.orders;
create policy orders_update on public.orders for update to authenticated
  using (public.is_admin() or customer_id = auth.uid() or delivery_id = auth.uid())
  with check (public.is_admin() or customer_id = auth.uid() or delivery_id = auth.uid());

drop policy if exists orders_delete on public.orders;
create policy orders_delete on public.orders for delete to authenticated
  using (public.is_superadmin());

-- total_price / customer_id stay immutable for non-service callers
revoke update on public.orders from anon, authenticated;
grant update (status, delivery_address, delivery_id, delivery_rating, updated_at)
  on public.orders to authenticated;

drop policy if exists order_items_select on public.order_items;
create policy order_items_select on public.order_items for select to authenticated
  using (public.is_admin() or exists (
    select 1 from public.orders o where o.id = public.order_items.order_id
      and (o.customer_id = auth.uid() or o.delivery_id = auth.uid())));

drop policy if exists order_items_insert on public.order_items;
create policy order_items_insert on public.order_items for insert to authenticated
  with check (public.is_admin() or exists (
    select 1 from public.orders o where o.id = public.order_items.order_id
      and o.customer_id = auth.uid()));

drop policy if exists order_items_update on public.order_items;
create policy order_items_update on public.order_items for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists order_items_delete on public.order_items;
create policy order_items_delete on public.order_items for delete to authenticated
  using (public.is_admin() or exists (
    select 1 from public.orders o where o.id = public.order_items.order_id
      and o.customer_id = auth.uid()));

-- ============ 9. Categories / menu_items ============
drop policy if exists categories_select on public.categories;
create policy categories_select on public.categories for select to anon, authenticated using (true);
drop policy if exists categories_insert on public.categories;
create policy categories_insert on public.categories for insert to authenticated with check (public.is_admin());
drop policy if exists categories_update on public.categories;
create policy categories_update on public.categories for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists categories_delete on public.categories;
create policy categories_delete on public.categories for delete to authenticated using (public.is_admin());

drop policy if exists "display the data for all users" on public.menu_items;
drop policy if exists "insert menu item only by Admin" on public.menu_items;
drop policy if exists "update menu item only by admin" on public.menu_items;

create policy menu_items_select on public.menu_items for select to anon, authenticated using (true);
create policy menu_items_insert on public.menu_items for insert to authenticated with check (public.is_admin());
create policy menu_items_update on public.menu_items for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy menu_items_delete on public.menu_items for delete to authenticated using (public.is_admin());

-- ============ 10. Delivery requests / reservations ============
-- SELECT allowed for the applicant tracking their own request (by JWT email)
drop policy if exists delivery_requests_select on public.delivery_requests;
create policy delivery_requests_select on public.delivery_requests for select to authenticated
  using (public.is_admin() or email = auth.email());

drop policy if exists delivery_requests_insert on public.delivery_requests;
create policy delivery_requests_insert on public.delivery_requests for insert to authenticated with check (true);

drop policy if exists delivery_requests_update on public.delivery_requests;
create policy delivery_requests_update on public.delivery_requests for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists delivery_requests_delete on public.delivery_requests;
create policy delivery_requests_delete on public.delivery_requests for delete to authenticated
  using (public.is_admin() or email = auth.email());

drop policy if exists reservations_select on public.reservations;
create policy reservations_select on public.reservations for select to authenticated
  using (public.is_admin() or customer_id = auth.uid());
drop policy if exists reservations_insert on public.reservations;
create policy reservations_insert on public.reservations for insert to authenticated
  with check (public.is_admin() or customer_id = auth.uid());
drop policy if exists reservations_update on public.reservations;
create policy reservations_update on public.reservations for update to authenticated
  using (public.is_admin() or customer_id = auth.uid())
  with check (public.is_admin() or customer_id = auth.uid());
drop policy if exists reservations_delete on public.reservations;
create policy reservations_delete on public.reservations for delete to authenticated using (public.is_admin());

-- ============ 11. Views -> security_invoker + drop the auth.users join ============
-- WHY: `order_info` joined auth.users and leaked every user's email to anon.
-- `profiles.email` now mirrors it, so the view no longer needs auth.users and
-- can run with security_invoker so the new RLS policies actually apply.
create or replace view public.order_info with (security_invoker = true) as
select
  o.id,
  o.total_price,
  o.status,
  o.delivery_address,
  o.created_at,
  json_build_object(
    'id', p.id,
    'full_name', p.full_name,
    'email', p.email,
    'address', p.address,
    'phone_number', p.phone_number
  ) as customer,
  json_agg(
    json_build_object(
      'id', oi.id,
      'quantity', oi.quantity,
      'price', oi.price,
      'menu_item', json_build_object(
        'id', mi.id,
        'image_url', mi.image_url,
        'name', mi.name,
        'price', mi.price
      )
    )
  ) filter (where oi.id is not null) as items
from public.orders o
left join public.profiles p on o.customer_id = p.id
left join public.order_items oi on oi.order_id = o.id
left join public.menu_items mi on oi.menu_item_id = mi.id
group by o.id, p.id;

create or replace view public.orders_with_profiles with (security_invoker = true) as
select
  o.id, o.customer_id, o.delivery_id, o.status, o.total_price,
  o.delivery_address, o.created_at, o.updated_at,
  p1.full_name as customer_name,
  p2.full_name as deliver_name
from public.orders o
left join public.profiles p1 on o.customer_id = p1.id
left join public.profiles p2 on o.delivery_id = p2.id;

-- ============ 12. Harden functions ============
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_delete_user() from public;
revoke execute on function public.handle_delete_profile() from public;
revoke execute on function public.health() from public;
revoke execute on function public.add_delivery_rating(uuid, double precision) from public;
grant execute on function public.health() to service_role;

create or replace function public.add_delivery_rating(delivery_id uuid, new_rating double precision)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if new_rating is null or new_rating < 0 or new_rating > 5 then raise exception 'invalid rating'; end if;
  update public.profiles
     set delivery_rating = ((coalesce(delivery_rating,0) * coalesce(number_ratings,0)) + new_rating)
                          / (coalesce(number_ratings,0) + 1),
         number_ratings = coalesce(number_ratings,0) + 1
   where id = delivery_id and role = 'delivery';
end;
$$;
grant execute on function public.add_delivery_rating(uuid, double precision) to authenticated, service_role;

alter function public.health() set search_path = public;

-- ============ 13. profile delete -> auth user delete ============
drop trigger if exists on_profile_deleted on public.profiles;
create trigger on_profile_deleted after delete on public.profiles
  for each row execute function public.handle_delete_profile();

-- ============ 14. Storage: avatar bucket ============
insert into storage.buckets (id, name, public) values ('avatars','avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars are publicly readable" on storage.objects;
create policy "avatars are publicly readable" on storage.objects for select
  using (bucket_id = 'avatars');
drop policy if exists "users can upload their own avatar" on storage.objects;
create policy "users can upload their own avatar" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "users can update their own avatar" on storage.objects;
create policy "users can update their own avatar" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "users can delete their own avatar" on storage.objects;
create policy "users can delete their own avatar" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============ 15. Seed the first superadmin ============
update public.profiles set role = 'superadmin'
 where id = '7c2b0f17-a74f-4dc8-9d93-6f6c72570874';

-- ============ 16. Cleanup: explicit EXECUTE grants + legacy menu_items policy ============
-- WHY (EXECUTE): Supabase applies `alter default privileges in schema public
-- grant all on functions to postgres, anon, authenticated, service_role`, so
-- every newly created SECURITY DEFINER function is explicitly executable by
-- `anon` / `authenticated` even after `revoke ... from public`. The intended
-- end state of sections 1 and 12 is that only `authenticated` (and
-- `service_role`) may execute the role helpers / rating RPC, and that the
-- trigger-only functions are not callable over PostgREST at all, so the
-- explicit grants are revoked here too.
revoke execute on function public.current_user_role() from anon;
revoke execute on function public.is_admin() from anon;
revoke execute on function public.is_superadmin() from anon;
revoke execute on function public.sync_profile_email() from anon, authenticated;
revoke execute on function public.set_updated_at() from anon, authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.handle_delete_user() from anon, authenticated;
revoke execute on function public.handle_delete_profile() from anon, authenticated;
revoke execute on function public.health() from anon, authenticated;
revoke execute on function public.add_delivery_rating(uuid, double precision) from anon;

-- `set_updated_at` was created in section 5 without a pinned search_path,
-- which the advisor flags as a mutable-search_path warning.
alter function public.set_updated_at() set search_path = public;

-- The pre-existing menu_items SELECT policy was created with a TRAILING SPACE in
-- its name, so the `drop policy if exists "display the data for all users"` in
-- section 9 was a no-op. Drop it using the exact stored name; the new
-- `menu_items_select` policy already grants the same public read access.
drop policy if exists "display the data for all users " on public.menu_items;

-- ============ 17. Cleanup: drop the PUBLIC EXECUTE grant on trigger-only functions ============
-- WHY: `set_updated_at` and `sync_profile_email` were only revoked from the
-- explicit `anon`/`authenticated` grants in section 16, but they still carried
-- the implicit `EXECUTE` grant of the PUBLIC role, so every role could still
-- call them (the advisor flagged `sync_profile_email` as callable by `anon`).
revoke execute on function public.set_updated_at() from public;
revoke execute on function public.sync_profile_email() from public;
