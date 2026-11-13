# Migration: Server Actions → Supabase Client SDK (static export)

> Status: **Planned** · Updated: 2026-11-13
> Owner: Berlin Food Admin Dashboard (Tauri + Next.js + Supabase)

## 0. Goal & decisions

**Goal:** Remove all Next.js server runtime (server actions, server components, `proxy.ts` middleware) and drive the dashboard entirely through the Supabase browser client SDK. The app must build as a static export (`output: 'export'`) that Tauri serves.

**Recorded decisions:**
1. Privileged admin operations (create/delete users, change email, change roles) → **Supabase Edge Functions** invoked via `supabase.functions.invoke()`.
2. Reads + mutations + runtime → **full client-side + static export** (no Next.js server).
3. Auth & route guarding → **client gate + Edge Function `verify-session`** (role/permissions verified server-side, never trusted from local storage).
4. `[id]` detail routes (`/dashboard/users/[id]`, `/dashboard/orders/[id]`) → **in-page detail drawer/dialog**; the `[id]` page routes are removed.

## 1. Security invariants (must survive — reviewer checklist)

- [ ] Service-role key never reaches the browser — lives only in Edge Functions.
- [ ] `src/lib/supabase/admin.ts` and `src/lib/supabase/server.ts` deleted.
- [ ] Roles never trusted from the client — `verify-session` + `admin-*` functions re-assert RBAC server-side.
- [ ] Privilege ladder (`ROLE_RANK`) preserved inside Edge Functions — an `admin` cannot modify another `admin`/`superadmin`.
- [ ] Self-demotion / self-delete guards preserved (admins feature).
- [ ] Email changes only via Edge Function (`auth.admin.updateUserById`) — never a direct `profiles` update.
- [ ] `profiles.role` remains non-updatable by `authenticated` (column grant unchanged).

## 2. Disposition of operations

### Direct browser SDK (RLS already allows)
| Feature | Operations | RLS basis |
|---|---|---|
| Menu | product/category CRUD, availability toggle, snapshot, read availability | `menu_items_*`, `categories_*` → `is_admin()` |
| Orders | status update, list, stats, detail | `orders_update` → `is_admin()`; `order_info` view |
| Deliveries | status update, delete, create, list, stats, detail | `delivery_requests_*` → `is_admin()` |
| Users | list, counts, by-id, profile-field edit, availability toggle | `profiles_select`/`update` → `is_admin()` |
| Profile | update own fields, change password, avatar, sign-out | `id = auth.uid()`; `avatars` policies; `auth.updateUser` |
| Dashboard | KPIs, recent orders/deliveries, top items | `is_admin()` reads |

### Edge Functions (service role)
| Operation | Current location | Edge Function |
|---|---|---|
| Create user | `createUserAccount` | `admin-create-user` |
| Update email (auth sync) | `updateUserAuthEmail` | `admin-update-user` |
| Change role | `updateUserRole` / `setProfileRole` | `admin-set-role` |
| Delete user | `deleteUserAccount` | `admin-delete-user` |
| Approve delivery + promote courier (atomic) | `approveDeliveryRequestAction` | `admin-approve-delivery` |
| Session/role verification | `requireSession`/`assertPermission` | `verify-session` |

## 3. Phases

### Phase 0 — Foundations (sequential, unblocks all)
- [ ] Create `supabase/functions/_shared/` (`cors.ts`, `auth.ts`, `permissions.ts`, `rbac.ts`).
- [ ] Copy pure permission matrix + `ROLE_RANK` + `canCreateRole` + `checkTargetPrivilege` into `_shared`.
- [ ] Create `verify-session` Edge Function.
- [ ] Create `src/lib/api/` typed wrapper over `supabase.functions.invoke()` (returns `ActionResult`/`DetailResult`, Arabic error mapping).
- [ ] Create `src/lib/session/` — `AuthProvider`, `RequireAuth`, `usePermissions`/`useRole`.
- [ ] Rewire `src/stores/session.ts` to hydrate from the provider (replace `SessionHydrator`).
- [ ] Root `layout.tsx` wraps children in `AuthProvider`; dashboard `layout.tsx` uses `RequireAuth`.
- [ ] New migration `supabase/migrations/<ts>_menu_images_storage_policies.sql` (bucket + policies).
- [ ] Optional hardening migration: `revoke update (email) on public.profiles from authenticated;`.
- [ ] Verify: login → session → gate → redirect works end-to-end.

### Phase 1 — Menu + Profile (parallel, proof-of-pattern)
- [ ] `features/menu/hooks.ts` — `useMenuSnapshot`.
- [ ] Replace `features/menu/actions.ts` with browser SDK mutations.
- [ ] `features/profile/hooks.ts` — `useProfileView`; move avatar/password to browser SDK.
- [ ] Convert `menu/page.tsx` and `profile/page.tsx` to client components; replace `router.refresh()` with local re-fetch.

### Phase 2 — Orders + Dashboard (parallel)
- [ ] `features/orders/hooks.ts` — `useOrders`, `useOrderStats`, `useOrderDetail`.
- [ ] Move order detail into an in-page drawer; delete `orders/[id]/page.tsx`.
- [ ] `services/dashboard.ts` logic → `features/dashboard/hooks.ts` (browser SDK).
- [ ] Convert `orders/page.tsx` and dashboard `page.tsx` to client components.

### Phase 3 — Users + Admins + Deliveries (parallel)
- [ ] `features/users/hooks.ts` — `useUsers`, `useUserCounts`, `useUserById`.
- [ ] `features/admins/hooks.ts` — `useAdmins`, `useAdminCounts`.
- [ ] `features/deliveries/hooks.ts` — `useDeliveryRequests`, `useDeliveryStats`, `useDeliveryDetail`.
- [ ] Move user detail into an in-page drawer; delete `users/[id]/page.tsx`.
- [ ] Create `admin-create-user`, `admin-update-user`, `admin-set-role`, `admin-delete-user`, `admin-approve-delivery` Edge Functions.
- [ ] Wire user/admin/delivery mutations to `invoke("admin-*")`.

### Phase 4 — Static-export sweep (final)
- [ ] Remove `experimental.serverActions` from `next.config.ts`.
- [ ] Delete `proxy.ts`, `lib/auth/guard.ts`, `lib/auth/session.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts`.
- [ ] Delete all `features/*/actions.ts` and `features/*/queries.ts` and `services/*.ts`.
- [ ] Remove `server-only` dependency; remove `SessionHydrator`.
- [ ] `next build` succeeds with `output: 'export'`; Tauri smoke test.

## 4. File inventory

**Delete:** `src/proxy.ts`, `src/lib/auth/guard.ts`, `src/lib/auth/session.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts`, all `src/features/*/actions.ts`, all `src/features/*/queries.ts`, `src/services/*.ts`, `src/components/dashboard/session-hydrator.tsx`, `src/app/dashboard/users/[id]/` route, `src/app/dashboard/orders/[id]/` route.

**New:** `supabase/functions/{_shared/*, verify-session, admin-create-user, admin-update-user, admin-set-role, admin-delete-user, admin-approve-delivery}`, `supabase/migrations/<ts>_menu_images_storage_policies.sql`, `src/lib/session/*`, `src/lib/api/*`, `src/features/*/hooks.ts`.

**Modified:** every `src/app/dashboard/*/page.tsx`, `src/app/layout.tsx`, `src/app/dashboard/layout.tsx`, `next.config.ts`, client components that call `actions.ts` or `router.refresh()`.

## 5. Risks / verify during implementation

- [ ] Tauri + Supabase auth persistence — add localStorage cookie adapter to `createClient()` if login doesn't survive restart.
- [ ] Confirm `menu_items` storage bucket exists before adding policies.
- [ ] Add a test asserting `src/lib/auth/permissions.ts` and `_shared/permissions.ts` matrices match.
- [ ] Keep delivery approval atomic in `admin-approve-delivery` (single write, single audit trail).
- [ ] Re-test RBAC denial cases against live Edge Functions (admin→admin role change, self-delete, privileged create).

## 6. Definition of done

- [ ] `next build` succeeds with `output: 'export'`; no server actions / middleware / `force-dynamic`.
- [ ] No `"use server"`, `server-only`, `createAdminClient`, or `createServerClient` references remain in `src/`.
- [ ] Service-role key appears only inside `supabase/functions/`.
- [ ] All features work from the browser SDK; `admin-*` functions enforce RBAC server-side.
- [ ] Detail views render as in-page drawers; no dynamic route pages remain.
- [ ] RBAC denial cases verified against Edge Functions.
