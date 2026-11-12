# AGENTS.md

## Project Overview

**Berlin Food Admin Dashboard** is a management dashboard for the Berlin Food platform (Web and Mobile).

It allows **Admins** and **Superadmins** to manage users, orders, delivery requests, menus, and platform operations.

Superadmins have additional permissions, including creating and managing admins.

## Tech Stack

- **Desktop:** Tauri
- **Frontend:** Next.js (App Router)
- **Language:** TypeScript
- **Backend & Database:** Supabase
- **Styling:** Tailwind CSS
- **Package Manager** : pnpm

## Main Pages

- **Home (Dashboard):** Overview of platform statistics, recent orders, and important activities.
- **Users:** View, search, and manage platform users.
- **Orders:** View and manage customer orders and their statuses.
- **Delivery Requests:** Manage delivery requests and track their statuses.
- **Menu:** Manage food items, categories, prices, and availability.
- **Profile:** View and update the current admin's profile.

## User Roles & Permissions

### Admin
- Access the admin dashboard.
- Manage users, orders, delivery requests, and menus.
- View dashboard statistics.
- Manage their own profile.

### Superadmin
- Has all Admin permissions.
- Create new admin accounts.
- Manage existing admin accounts and their permissions.

**Important:** Always enforce role-based access control (RBAC) on the backend using Supabase policies and secure server-side checks. Never rely only on frontend permission checks.

## Development Guidelines

### Brand Personality
**Concept:** "Urban Alchemist" — Berlin's grit meets gastronomic precision.

### Aesthetic Direction

- **Theme:** Light and dark modes (user-selectable).
- **Primary Language:** Arabic only.
- **Layout Direction:** RTL (Right-to-Left) across the entire application.
- **Primary aesthetic:** Warm minimalism — editorial, spacious, structured, with intentional asymmetry.
- **Primary color:** `#9F4200`.
- **Accent color:** `#F27121`.
- **Supporting colors:** Warm neutrals, avoiding stark blacks and whites.
- **Typography:** Cairo. Ensure excellent Arabic readability across headings, tables, forms, and dashboard metrics.
- **Corners:** Soft, rounded corners with a consistent design language.
- **Layout:** Desktop-first, spacious layouts with clear visual hierarchy and efficient use of screen space.
- **RTL Consistency:** All navigation, sidebars, tables, forms, icons, alignment, spacing, and interactions must follow RTL conventions.
- **Arabic Content:** All UI labels, buttons, navigation items, notifications, messages, validation errors, and empty states must be written in Arabic.

### Desktop Layout & Navigation

- **Sidebar:** Persistent vertical sidebar for primary navigation (Home, Users, Orders, Delivery Requests, Menu, Profile).
- **Topbar:** Contextual page title, search, notifications, theme switcher, and admin profile.
- **Main Content:** Wide content area with consistent horizontal padding and structured sections.
- **Dashboard:** Use a responsive grid for statistics, charts, recent orders, and platform activity.
- **Data Tables:** Prioritize readability, information density, sorting, filtering, pagination, and clear status indicators.
- **Management Actions:** Use contextual action menus, dialogs, and confirmation modals for administrative operations.
- **Responsive Behavior:** Support different desktop and laptop resolutions. Collapse the sidebar when screen space is limited.

### Design Principles

1. **Tonal Depth Over Borders:** Define sections through background color variations rather than unnecessary borders.
2. **Editorial Typography:** Create strong contrast between page headings, section titles, metrics, and body text.
3. **The No-Line Rule:** Avoid unnecessary 1px solid borders for section separation. Prefer spacing, subtle shadows, and background variations.
4. **Premium Feel Through Restraint:** Every element must earn its place. Avoid unnecessary visual complexity, decorative elements, and excessive gradients.
5. **Warm Minimalism:** Avoid pure black (`#000000`) and pure white (`#FFFFFF`). Use warm-tinted colors for backgrounds, surfaces, and text.
6. **Consistent Design Language:** All dashboard pages must share the same visual identity, spacing system, typography, components, and interaction patterns.
7. **Desktop-First Experience:** Optimize for desktop productivity, keyboard navigation, efficient workflows, and clear information presentation.
8. **Information Hierarchy:** Make important metrics, order statuses, user information, and administrative actions immediately recognizable.
9. **Data Clarity:** Tables, charts, badges, and statistics should be clean, consistent, and easy to scan.
10. **Purposeful Interactions:** Use subtle hover states, smooth transitions, clear focus indicators, and meaningful feedback for user actions.
11. **Responsive Adaptation:** Preserve the desktop design identity across different screen sizes, adapting navigation, tables, grids, and spacing when necessary.
12. **Accessibility:** Maintain readable contrast, accessible controls, visible focus states, and consistent interaction behavior.

### Component Design Guidelines

- **Cards:** Use rounded surfaces with subtle tonal differences and restrained shadows.
- **Tables:** Use spacious rows, clear column alignment, readable typography, and subtle hover feedback.
- **Status Badges:** Use soft background colors with appropriate semantic colors for order and delivery statuses.
- **Buttons:** Use the primary brand color for important actions and neutral styling for secondary actions.
- **Forms:** Use consistent input heights, clear labels, appropriate spacing, and helpful validation messages.
- **Dialogs:** Use centered, well-proportioned modals with clear actions and minimal visual distractions.
- **Charts:** Use the brand palette consistently and avoid unnecessary visual decoration.

**Overall Goal:** Create a premium, modern desktop management experience that feels like a sophisticated food-tech platform rather than a generic admin dashboard.

### General
- Use TypeScript with strict typing.
- Follow Next.js App Router conventions.
- Write clean, reusable, and maintainable code.
- Prefer small, focused components.
- Avoid unnecessary dependencies.
- Use async/await for asynchronous operations.
- Handle loading, error, and empty states.

### Frontend
- Use Tailwind CSS for styling.
- Build reusable UI components.
- Keep pages organized and consistent.
- Ensure the dashboard is responsive.
- Use clear feedback for user actions (success, errors, confirmations).

### Supabase
- Use Supabase for authentication, database operations, and storage when needed.
- Keep database queries and business logic organized.
- Use environment variables for credentials.
- Never expose the Supabase service role key on the client.
- Validate data before database operations.
- Handle Supabase errors properly.

### Tauri
- Use Tauri APIs only when native desktop functionality is required.
- Keep frontend and desktop-specific logic separated.
- Follow Tauri security best practices.

### Security
- Protect dashboard routes from unauthorized access.
- Implement role-based permissions.
- Validate all user inputs.
- Never trust client-provided roles or permissions.
- Never expose secrets or sensitive information.

## Project Structure

Follow the existing project structure. Prefer organizing code by feature when possible.

Example:

```text
src/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── users/
│   │   ├── orders/
│   │   ├── delivery-requests/
│   │   ├── menu/
│   │   └── profile/
│   └── layout.tsx
├── components/
│   ├── ui/
│   └── dashboard/
├── lib/
│   ├── supabase/
│   └── utils/
├── hooks/
├── types/
└── services/
└── stores/
```

This is a requirement structure, not a suggested

## Instructions

Before making changes:

1. Inspect the existing project structure and understand the current implementation.
2. Check existing components, utilities, types, and Supabase schemas before creating new ones.
3. Reuse existing code whenever possible.
4. Do not introduce unnecessary abstractions or dependencies.
5. Do not modify database schemas or migrations without explaining why.
6. Do not remove existing functionality unless explicitly requested.
7. Keep changes focused on the requested task.
8. Verify TypeScript errors and linting after making changes when possible.

**Important:** Prioritize security, maintainability, performance, and consistency 