-- Berlin Food — Menu item timestamps (bug fix)
-- Project ref: mbhnuhcjebqszvxcysvd   Schema: public
--
-- WHY
-- ----
-- The RBAC migration (20261111000100_admin_rbac.sql) attached the
-- `set_updated_at()` trigger to `public.menu_items`:
--
--   create trigger menu_items_set_updated_at before update on public.menu_items
--     for each row execute function public.set_updated_at();
--
-- but `menu_items` never had an `updated_at` column, so every UPDATE against
-- the table aborted with:
--
--   ERROR: record "new" has no field "updated_at"
--
-- That broke every menu write that touches an existing row (editing a product,
-- toggling its availability). The sibling tables the same migration touched
-- (`orders`, `profiles`, `delivery_requests`) all *do* have `updated_at`, so
-- `menu_items` was simply an omission — the trigger was written with the
-- intent that the column exists.
--
-- The fix is therefore to add the two timestamp columns the trigger and the
-- rest of the schema expect, rather than to weaken the trigger:
--
--   * `updated_at` — required by the existing trigger (maintained by the DB).
--   * `created_at` — gives the menu page a real "الأحدث" (newest first) sort
--     key; `menu_items` previously had no insertion timestamp at all.
--
-- Both columns mirror `orders` / `order_items` / `delivery_requests` exactly:
-- `timestamptz NOT NULL DEFAULT now()`.
--
-- NOTE on the backfill
-- --------------------
-- The four existing rows all receive the same `now()` default, which would
-- make "الأحدث" meaningless for them. The backfill re-stamps `created_at`
-- using `ctid` (the physical row order, i.e. the insertion order) so the
-- relative order of the existing rows is preserved: the first-inserted row
-- gets the oldest timestamp.

-- ============ 1. Timestamp columns ============
alter table public.menu_items
  add column if not exists created_at timestamptz not null default now();

alter table public.menu_items
  add column if not exists updated_at timestamptz not null default now();

-- ============ 2. Backfill created_at from the physical row order ============
-- `ctid` reflects the order the rows were written in, so re-stamping with a
-- one-second-per-row offset preserves "oldest → newest" for the seed data.
with ranked as (
  select
    id,
    row_number() over (order by ctid) as position,
    count(*) over () as total
  from public.menu_items
)
update public.menu_items m
set created_at = now() - make_interval(secs => (r.total - r.position)::double precision)
from ranked r
where m.id = r.id;

-- ============ 3. Make sure the trigger exists and is enabled ============
-- Defensive: recreating the trigger is a no-op when it is already there, and
-- guarantees the column and the trigger stay in sync on a fresh database.
drop trigger if exists menu_items_set_updated_at on public.menu_items;
create trigger menu_items_set_updated_at before update on public.menu_items
  for each row execute function public.set_updated_at();

-- ============ 4. Index for the "newest first" sort ============
create index if not exists menu_items_created_at_idx
  on public.menu_items (created_at desc);
