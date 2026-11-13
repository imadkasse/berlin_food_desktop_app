# Berlin Food Admin Dashboard

**لوحة إدارة منصة Berlin Food** — a Tauri desktop console for operating the Berlin Food platform.

---

## Overview

Berlin Food Admin is a desktop management dashboard for the Berlin Food platform (web and mobile). It gives administrators a single place to manage users, orders, delivery requests, the menu, privileged admin accounts, and their own profile.

The desktop shell is [Tauri 2](https://tauri.app/) and the UI is a statically exported Next.js App Router application. All data access goes directly from the client to Supabase, protected by Row Level Security (RLS). Privileged account operations run in Supabase Edge Functions so that the service-role key never reaches the app bundle.

The interface is Arabic-first and right-to-left, with light and dark themes.

## Features

### Dashboard
- KPI cards: today's orders, today's revenue, orders in preparation, available couriers.
- Recent orders and recent delivery requests.
- Top-selling menu items by ordered quantity.

### Users
- Search, filter, and paginate platform accounts.
- Create customer and delivery accounts.
- Edit profile fields (name, email, phone, vehicle, availability, address).
- Change role, toggle availability, delete an account (superadmin only).
- In-page detail drawer with order context.

### Admins
- Superadmin-only area for privileged accounts.
- Create admin, manager, and support accounts.
- Change role and delete admin accounts, with self-demotion and self-delete guards.

### Orders
- List, filter, and paginate customer orders.
- Update order status.
- In-page order detail drawer.

### Delivery Requests
- List and filter courier applications and delivery requests.
- Approve or reject requests.
- Courier matching by email or phone, with delivery history.
- Create and delete delivery requests.

### Menu
- Create, edit, and delete products and categories.
- Toggle product availability.
- Upload product images to the `menu_items` storage bucket.

### Profile
- Update personal details.
- Change password.
- Upload an avatar.
- Sign out of all devices.

## Architecture

The dashboard is a **fully client-side application**. There are no Next.js server actions, server components, middleware, or API routes — `next.config.ts` sets `output: "export"`, and Tauri serves the generated `out/` directory.

| Layer | Responsibility |
|---|---|
| Supabase browser SDK | Reads and mutations from React hooks/features, authorized by RLS. |
| Supabase Edge Functions | Privileged account operations and session verification, using the service-role key server-side. |
| Tauri | Desktop shell, window configuration, and static asset serving. |
| `AuthProvider` + `RequireAuth` | Client-side auth gate that hydrates the session store via `verify-session` and redirects unauthenticated users. |

**Why this shape?** A Tauri app hosts static files, so there is no Node.js server to run server actions or middleware. The migration to the client SDK removed the Next.js server runtime entirely. Security is preserved because authorization is enforced twice:

1. **RLS policies** on every table and storage bucket.
2. **Server-side checks** in each `admin-*` Edge Function, which re-verify the caller's JWT, role, permission, and privilege ladder.

The frontend permission checks in `src/lib/auth/permissions.ts` exist only for UI affordances — they are never the enforcement layer.

## Tech stack

| Area | Technology |
|---|---|
| Desktop shell | Tauri 2 |
| Framework | Next.js 16 (App Router, static export) |
| UI | React 19, TypeScript (strict) |
| Styling | Tailwind CSS 4 |
| State | Zustand |
| Backend | Supabase — Postgres, RLS, Auth, Storage, Edge Functions |
| Notifications | Sonner |
| Package manager | pnpm |
| Typography | Cairo (Arabic + Latin) |
| Locale | Arabic UI, RTL layout, light/dark themes |

## Project structure

```text
.
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Cairo font, RTL root, providers
│   │   └── dashboard/
│   │       ├── page.tsx            # Dashboard KPIs and activity
│   │       ├── users/
│   │       ├── admins/
│   │       ├── orders/
│   │       ├── delivery-requests/
│   │       ├── menu/
│   │       └── profile/
│   ├── components/
│   │   ├── ui/                     # Buttons, dialogs, inputs, tables, …
│   │   └── dashboard/              # Shell, sidebar, topbar, stat cards, …
│   ├── features/                   # Feature-scoped hooks, mutations, views
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── admins/
│   │   ├── orders/
│   │   ├── deliveries/
│   │   ├── menu/
│   │   └── profile/
│   ├── lib/
│   │   ├── api/                    # Typed Edge Function wrapper
│   │   ├── auth/                   # Role/permission matrix
│   │   ├── session/                # AuthProvider, RequireAuth, hooks
│   │   └── supabase/               # Browser Supabase client
│   ├── hooks/
│   ├── stores/                     # Zustand stores (session, theme)
│   └── types/                      # Database and app types
├── src-tauri/                      # Tauri configuration and Rust shell
├── supabase/
│   ├── functions/                  # Edge Functions + shared modules
│   └── migrations/                 # Schema, RLS, storage policies
├── next.config.ts                  # output: "export"
└── package.json
```

## Getting started

### Prerequisites

- **Node.js 20+**
- **pnpm**
- **Rust toolchain** and the [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS
- **Supabase CLI** (for migrations and function deployment)

### Install

```bash
pnpm install
```

### Environment

Create a `.env` file from the example:

```bash
cp .env.example .env
```

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL used by the browser client. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Yes | Publishable (anon) key; safe for the client because RLS applies. |
| `SUPABASE_DATABASE_PASSWORD` | CLI only | Database password for Supabase CLI workflows. |
| `SUPABASE_SERVICE_ROLE_KEY` | No | **Not used by the client.** Edge Functions receive the service-role credential automatically from the Supabase runtime. Never expose it in the frontend or commit it. |

> The service-role key must never be referenced from `src/`. It belongs to the Edge Functions runtime only.

### Supabase setup

Link the repository to your project and push the tracked migrations:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Deploy the Edge Functions (they are tracked in `supabase/functions/`):

```bash
supabase functions deploy verify-session
supabase functions deploy admin-create-user
supabase functions deploy admin-update-user
supabase functions deploy admin-set-role
supabase functions deploy admin-delete-user
supabase functions deploy admin-approve-delivery
```

### Development

Web development server:

```bash
pnpm dev
```

Desktop development (Tauri starts the Next.js dev server on port 3000):

```bash
pnpm tauri dev
```

### Build

```bash
pnpm build      # static export to out/
pnpm tauri build
```

## Authentication & roles

Sessions are managed by Supabase Auth. `AuthProvider` listens for auth changes, calls `verify-session`, and stores the verified profile in Zustand. `RequireAuth` protects the dashboard; only `admin` and `superadmin` may enter it.

Roles defined in `src/lib/auth/permissions.ts`:

| Role | Description |
|---|---|
| `customer` | Places food orders and tracks them. |
| `delivery` | Courier who receives and delivers orders. |
| `admin` | Manages users, orders, deliveries, and the menu; views dashboard statistics. |
| `manager` | Broader operational management role. |
| `support` | Customer support with read-oriented access. |
| `superadmin` | Highest authority: manages admins, roles, and privileged accounts. |

Permission highlights:

| Permission | admin | superadmin |
|---|:---:|:---:|
| Read/write users, orders, deliveries, menu, categories, own profile | ✅ | ✅ |
| Create customer / delivery accounts | ✅ | ✅ |
| Create privileged accounts (admin, manager, support, superadmin) | — | ✅ |
| Change roles | — | ✅ |
| Delete users | — | ✅ |
| Manage admins | — | ✅ |

The `manager` and `support` roles exist in the role model but do not grant dashboard access in the current permission matrix. The authoritative checks live in the Edge Functions and RLS policies, not in the UI.

## Edge Functions

| Function | Purpose |
|---|---|
| `verify-session` | Validates the caller's JWT and returns the profile, role, and computed permissions. |
| `admin-create-user` | Creates an Auth user plus `profiles` row, enforcing which roles the caller may assign. |
| `admin-update-user` | Updates editable profile fields and keeps the Auth email in sync; role is not editable here. |
| `admin-set-role` | Changes an account's role under the privilege ladder. |
| `admin-delete-user` | Deletes an Auth user and associated profile data. |
| `admin-approve-delivery` | Atomically approves a delivery request and optionally promotes the courier to `delivery`. |

Each function verifies the caller's JWT, re-asserts the required permission, and applies privilege-ladder rules server-side. An `admin` cannot modify another `admin` or a `superadmin`.

## Database & migrations

RLS is the enforcement layer for all client-side reads and writes. Migrations in `supabase/migrations/` cover:

- **Tables:** `profiles`, `orders`, `order_items`, `categories`, `menu_items`, `delivery_requests`, `reservations`.
- **Helper functions:** `current_user_role()`, `is_admin()`, `is_superadmin()`, updated-at triggers, and Auth/profile email sync.
- **Storage buckets:** `avatars` (user avatars) and `menu_items` (product images), with scoped access policies.
- **Hardening:** profile email updates revoked from `authenticated`; role changes restricted to service-role Edge Functions.

Apply migrations with `supabase db push`. Do not edit production policies by hand — add a new migration instead.

## Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start the Next.js development server. |
| `pnpm build` | Build the static export into `out/`. |
| `pnpm start` | Start the Next.js production server (not used by Tauri). |
| `pnpm preview` | Preview the build with Vite. |
| `pnpm lint` | Run ESLint. |
| `pnpm lint:fix` | Run ESLint with automatic fixes. |
| `pnpm tauri` | Tauri CLI passthrough (`pnpm tauri dev`, `pnpm tauri build`, …). |

## Design system

- **Direction:** Arabic, RTL throughout navigation, tables, forms, and iconography.
- **Typography:** Cairo via `next/font`, tuned for Arabic readability.
- **Aesthetic:** Warm minimalism — editorial hierarchy, tonal surfaces, restrained shadows, and no unnecessary borders.
- **Primary:** `#9F4200` · **Accent:** `#F27121`.
- **Surfaces:** Warm neutrals; pure black and pure white are avoided.
- **Theming:** Light and dark modes, persisted in `localStorage`, applied before first paint.

## Troubleshooting

**Login does not survive a restart (Tauri).**
Sessions are persisted in `localStorage` because the Tauri webview does not retain cookies across reloads. See `src/lib/supabase/client.ts`. If a session still disappears, confirm the app is using the same origin/webview storage and that `persistSession` is enabled.

**Privileged actions fail with a generic error.**
The Edge Functions must be deployed and reachable. If `verify-session` is missing, the app falls back to reading the admin's own profile, but `admin-*` operations will still fail. Deploy all functions and check the Supabase function logs.

**`pnpm build` fails on a server-only import.**
The project must remain static-export compatible. Do not add server actions, middleware, `server-only`, `force-dynamic`, or server Supabase clients — those were intentionally removed.

**RLS denies a query.**
Verify the signed-in account has `admin` or `superadmin` in `profiles.role` and that the latest migrations were applied.

## License

**Proprietary — all rights reserved.** This package is `"private": true`; it is not published or redistributed.
