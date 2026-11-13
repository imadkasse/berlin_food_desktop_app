-- Berlin Food — Client SDK storage policies for menu item images
-- Project ref: mbhnuhcjebqszvxcysvd   Schema: storage
-- Applied: 2026-11-13
--
-- WHY: the dashboard now uploads menu item images directly from the browser
-- using the Supabase client SDK. This migration makes the `menu_items` bucket
-- publicly readable and writable only by authenticated admins.

-- ============ 1. Ensure the menu_items bucket exists ============
insert into storage.buckets (id, name, public)
values ('menu_items', 'menu_items', true)
on conflict (id) do nothing;

-- ============ 2. Drop old conflicting policies ============
drop policy if exists "menu_items are publicly readable" on storage.objects;
drop policy if exists "admin can upload menu item images" on storage.objects;
drop policy if exists "admin can update menu item images" on storage.objects;
drop policy if exists "admin can delete menu item images" on storage.objects;

-- ============ 3. Public read access ============
create policy "menu_items are publicly readable"
  on storage.objects for select
  using (bucket_id = 'menu_items');

-- ============ 4. Admin write access ============
create policy "admin can upload menu item images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'menu_items' and public.is_admin());

create policy "admin can update menu item images"
  on storage.objects for update to authenticated
  using (bucket_id = 'menu_items' and public.is_admin())
  with check (bucket_id = 'menu_items' and public.is_admin());

create policy "admin can delete menu item images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'menu_items' and public.is_admin());
