-- Berlin Food — Harden profiles.email against direct client updates
-- Project ref: mbhnuhcjebqszvxcysvd   Schema: public
-- Applied: 2026-11-13
--
-- WHY: `profiles.email` is mirrored from `auth.users.email` by the
-- `sync_profile_email` trigger. Direct browser updates to the column would
-- make the two sources drift. All email changes must go through the
-- `admin-update-user` Edge Function, which uses `auth.admin.updateUserById`
-- so that the sync trigger keeps the profiles row consistent.

-- ============ 1. Revoke the email column from authenticated updates ============
revoke update (email) on public.profiles from authenticated;

-- ============ 2. Re-grant the remaining columns explicitly (without email) ============
grant update (full_name, phone_number, address, vehicle_type,
              availability_status, delivery_rating, number_ratings, updated_at)
  on public.profiles to authenticated;

-- ============ 3. Document the constraint in the catalog ============
comment on column public.profiles.email is
  'Mirrored from auth.users.email by the sync_profile_email trigger. '
  'Client updates to profiles.email are revoked; writes must go through '
  'auth.admin.updateUserById in the admin-update-user Edge Function '
  'to keep the two tables in sync.';
