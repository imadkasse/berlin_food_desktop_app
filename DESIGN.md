---
version: "alpha"
name: "Berlin Food — Urban Alchemist"
description: "Arabic-only RTL desktop design system for the Berlin Food Admin Dashboard, inspired by the Berlin Food brand identity."

colors:
  primary: "#9F4200"
  primary-hover: "#843700"
  accent: "#F27121"
  accent-soft: "#FFF0E5"

  background: "#FAF7F2"
  surface: "#FFFDF9"
  surface-secondary: "#F3EDE5"
  surface-hover: "#F7EEE5"

  text-primary: "#2B211B"
  text-secondary: "#75685F"
  text-muted: "#A3978D"

  border-subtle: "#EAE1D8"

  success: "#287A52"
  success-soft: "#E7F3EB"

  warning: "#B7791F"
  warning-soft: "#FFF3DB"

  error: "#B83A32"
  error-soft: "#FCEAE8"

  info: "#426F91"
  info-soft: "#E8F0F6"

  dark-background: "#1E1915"
  dark-surface: "#29221D"
  dark-surface-secondary: "#352C25"
  dark-text-primary: "#F5EDE5"
  dark-text-secondary: "#B9A99C"
  dark-border: "#46392F"

typography:
  display:
    fontFamily: "IBM Plex Sans Arabic"
    fontSize: 36px
    fontWeight: 700
    lineHeight: 1.3

  headline-lg:
    fontFamily: "IBM Plex Sans Arabic"
    fontSize: 30px
    fontWeight: 700
    lineHeight: 1.4

  headline-md:
    fontFamily: "IBM Plex Sans Arabic"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.4

  headline-sm:
    fontFamily: "IBM Plex Sans Arabic"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.5

  body-lg:
    fontFamily: "IBM Plex Sans Arabic"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.7

  body-md:
    fontFamily: "IBM Plex Sans Arabic"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.7

  body-sm:
    fontFamily: "IBM Plex Sans Arabic"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.6

  label:
    fontFamily: "IBM Plex Sans Arabic"
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.5

  metric:
    fontFamily: "IBM Plex Sans Arabic"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.2

rounded:
  xs: 6px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  2xl: 24px
  full: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
  3xl: 40px
  4xl: 48px
  5xl: 64px

components:
  sidebar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-secondary}"
    width: 260px
    padding: 24px

  sidebar-active:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: 12px

  topbar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    height: 72px
    padding: 24px

  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: 24px

  stat-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: 24px

  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: 12px

  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"

  button-secondary:
    backgroundColor: "{colors.surface-secondary}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: 12px

  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    height: 44px
    padding: 12px

  table:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: 16px

  table-header:
    backgroundColor: "{colors.surface-secondary}"
    textColor: "{colors.text-secondary}"
    padding: 16px

  badge-success:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success}"
    rounded: "{rounded.full}"
    padding: 8px

  badge-warning:
    backgroundColor: "{colors.warning-soft}"
    textColor: "{colors.warning}"
    rounded: "{rounded.full}"
    padding: 8px

  badge-error:
    backgroundColor: "{colors.error-soft}"
    textColor: "{colors.error}"
    rounded: "{rounded.full}"
    padding: 8px

  dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: 24px

  search:
    backgroundColor: "{colors.surface-secondary}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    height: 44px
    padding: 12px
---

# Berlin Food — Design System

## Overview

### Brand Identity

Berlin Food is a modern food ordering and delivery platform specializing in Tacos, Pizza, Cheese Burgers, and beverages.

The visual identity follows the concept of **Urban Alchemist**:

Berlin's urban character meets gastronomic precision.

The interface should communicate:
- Premium food brand identity.
- Operational efficiency and reliability.
- Modern urban sophistication.
- Simplicity and clarity.
- A refined food-delivery experience.

### Product Context

This design system is intended for the Berlin Food Admin Dashboard.

The dashboard is a desktop application built with:
- Tauri
- Next.js
- TypeScript
- Tailwind CSS
- Supabase

It is used by two roles:

**Admin**
- Manage customers.
- Manage orders.
- Manage delivery requests.
- Manage food menus.
- View platform statistics.
- Manage personal profile.

**Superadmin**
- All Admin permissions.
- Create and manage administrator accounts.

### Brand Personality

**Voice:** Premium, refined, sophisticated.

**Tone:** Elegant but approachable.

**Visual Concept:** Urban Alchemist — Berlin's grit meets gastronomic precision.

### Design Philosophy

The dashboard must not look like a generic administration template.

It should feel like a natural extension of the Berlin Food customer-facing platform, while prioritizing productivity, information clarity, and administrative workflows.

Use warm minimalism, editorial typography, subtle tonal depth, and carefully controlled brand accents.

### Language & Direction

- Primary language: Arabic only.
- Interface direction: RTL (Right-to-Left).
- All navigation, tables, forms, dialogs, notifications, and labels must be Arabic.
- Use Arabic-friendly typography throughout.
- All layouts must respect RTL conventions.
- Use CSS logical properties instead of hardcoded left/right positioning.
- Ensure numbers, dates, prices, and mixed Arabic/Latin content remain readable.

## Colors

### Primary Palette

The brand identity is built around warm, earthy orange and brown tones.

- **Primary — Burnt Orange:** `#9F4200`. Used for primary actions, active navigation, and important brand elements.
- **Accent — Vibrant Orange:** `#F27121`. Used for highlights, secondary emphasis, and selected visual elements.
- **Accent Soft:** `#FFF0E5`. Used for subtle highlighted backgrounds.

The primary color should communicate importance and confidence without overwhelming the interface.

### Neutral Palette

Use warm neutrals instead of pure black and pure white.

- Warm ivory for the main application background.
- Soft cream for cards and content surfaces.
- Warm beige for secondary sections.
- Dark brown for primary text.
- Muted brown-gray for secondary text.

Avoid excessive contrast between adjacent surfaces.

### Semantic Colors

Use semantic colors consistently:

- **Success:** Green for completed orders, active states, and successful operations.
- **Warning:** Amber for pending orders and attention-required actions.
- **Error:** Red for rejected, cancelled, and failed operations.
- **Info:** Blue for informational messages and neutral system notifications.

Semantic colors must remain consistent across badges, alerts, charts, and status indicators.

<!-- ### Dark Mode

Dark mode must preserve the warm Berlin Food identity.

Use dark brown surfaces instead of pure black.

- Background: `#1E1915`.
- Primary surface: `#29221D`.
- Secondary surface: `#352C25`.
- Primary text: `#F5EDE5`.
- Secondary text: `#B9A99C`.

Keep the brand orange recognizable in both themes.

Do not simply invert the light theme. Rebalance text, surfaces, shadows, and semantic colors for comfortable readability. -->

## Typography

### Font Family

Use **IBM Plex Sans Arabic** as the primary and exclusive UI typeface.

It provides excellent Arabic readability and a professional appearance suitable for administrative interfaces.

Use the same font consistently across:
- Navigation.
- Page titles.
- Tables.
- Forms.
- Dashboard metrics.
- Dialogs.
- Notifications.
- Buttons.

### Typography Hierarchy

Use a clear typographic hierarchy:

- Display: Main dashboard highlights and important visual statements.
- Headline Large: Main page titles.
- Headline Medium: Section headings.
- Headline Small: Card and subsection titles.
- Body Large: Important descriptions.
- Body Medium: Standard interface content.
- Body Small: Secondary information and metadata.
- Label: Form labels, table headers, and compact controls.
- Metric: Statistics and dashboard KPIs.

### Typography Rules

- Prefer readable font sizes over decorative typography.
- Use bold weights for important headings and numbers.
- Use regular weights for descriptions.
- Avoid excessive font-weight variations.
- Maintain comfortable Arabic line heights.
- Use tabular numerals for prices, order IDs, and dashboard metrics where appropriate.

## Layout

### Desktop-First Architecture

The application is primarily designed for desktop screens.

Prioritize administrative efficiency, visibility, and organized information.

Recommended desktop breakpoints:

- Large desktop: 1440px and above.
- Desktop: 1280px–1439px.
- Small desktop/laptop: 1024px–1279px.
- Compact layout: Below 1024px.

The interface must adapt gracefully to different desktop resolutions.

### Main Application Structure

Use a persistent RTL dashboard layout.

**Right Sidebar:**
- Positioned on the right side.
- Contains the Berlin Food logo and brand identity.
- Contains primary navigation.
- Highlights the current page.
- Displays the current admin account or profile shortcut.

**Topbar:**
- Page title and contextual information.
- Global search when relevant.
- Notifications.
- Theme switcher.
- Admin profile menu.

**Main Content:**
- Occupies the remaining horizontal space.
- Uses consistent page padding.
- Organizes information into cards, tables, and sections.
- Avoids unnecessary nested containers.

### Navigation Structure

The primary navigation contains:

1. الرئيسية — Home / Dashboard.
2. المستخدمون — Users.
3. الطلبات — Orders.
4. طلبات التوصيل — Delivery Requests.
5. القائمة — Menu.
6. الملف الشخصي — Profile.

Superadmins should additionally have access to administrator management, either as a dedicated section or within the appropriate user-management workflow.

### Spacing System

Use the defined 4px-based spacing scale.

- 8px for compact internal spacing.
- 12px for related elements.
- 16px for standard component spacing.
- 24px for card padding and section separation.
- 32px for major content groups.
- 48px–64px for larger page sections.

Maintain consistent spacing across all dashboard pages.

### Grid System

Use a responsive 12-column grid for desktop layouts.

- Dashboard KPI cards should use evenly distributed columns.
- Charts should receive sufficient width.
- Tables should prioritize readable columns.
- Related information should be grouped together.
- Avoid excessively narrow cards.

## Elevation & Depth

### Tonal Depth Over Borders

Create visual hierarchy primarily through background color variations.

Use:
- Background differences between the application and cards.
- Subtle shadows for floating elements.
- Soft surface contrast for grouped sections.
- Clear spacing between independent content areas.

### Shadows

Use restrained shadows.

- Cards: Minimal or no visible shadow.
- Dropdowns: Soft floating shadow.
- Dialogs: Slightly stronger shadow.
- Sidebar: Separate through tonal contrast rather than heavy shadow.

### The No-Line Rule

Avoid unnecessary 1px borders as a primary layout technique.

Use whitespace, background differences, and subtle shadows instead.

Borders are acceptable when needed for:
- Input field definition.
- Table readability.
- Focus indicators.
- Separating interactive elements.

## Shapes

Use a consistent rounded-corner language.

- Small controls: 6px–8px.
- Inputs and buttons: 12px.
- Cards: 16px.
- Large dialogs: 20px–24px.
- Status badges: Fully rounded.

Avoid mixing sharp geometric elements with excessively rounded components.

The overall appearance should feel soft, premium, and cohesive.

## Components

### Sidebar

The sidebar is the primary navigation element.

- Fixed on the right.
- Approximately 260px wide on desktop.
- Warm surface background.
- Brand logo at the top.
- Clear Arabic navigation labels.
- Active navigation item uses the primary brand color with a soft orange background.
- Icons should appear consistently beside navigation labels.
- Use subtle hover states.

### Topbar

The topbar provides global controls and context.

Include:
- Current page title.
- Search when applicable.
- Notification access.
- Light/dark theme switcher.
- Admin avatar and account menu.

Keep the topbar clean and avoid unnecessary visual elements.

### Dashboard Statistics Cards

Statistics cards are important elements of the home dashboard.

Examples:
- إجمالي المستخدمين
- إجمالي الطلبات
- الطلبات قيد التنفيذ
- إجمالي الإيرادات
- طلبات التوصيل النشطة

Design rules:
- Display the metric prominently.
- Use clear Arabic labels.
- Use subtle icons.
- Show comparison or trend information only when reliable data exists.
- Use brand colors sparingly.

### Data Tables

Tables are essential for managing platform data.

Use them for:
- Users.
- Orders.
- Delivery requests.
- Menu items.
- Administrators.

Design rules:
- RTL column order.
- Arabic column headers.
- Comfortable row height.
- Clear text alignment.
- Consistent status badges.
- Search and filtering controls.
- Sorting where appropriate.
- Pagination.
- Contextual action menus.
- Row hover feedback.

Avoid excessive column density and unnecessary decorative elements.

### Buttons

**Primary Button**
- Burnt orange background.
- White text.
- Rounded corners.
- Reserved for the most important action.

**Secondary Button**
- Warm neutral background.
- Dark text.
- Used for secondary actions.

**Destructive Button**
- Semantic error color.
- Used for deletion and irreversible actions.

Provide hover, active, disabled, and loading states.

### Forms & Inputs

Forms should be simple and easy to understand.

- Arabic labels above inputs.
- Consistent input heights.
- Clear validation messages.
- Logical RTL field alignment.
- Proper spacing between fields.
- Clear required-field indicators.

Use appropriate input types for phone numbers, prices, dates, and other data.

### Status Badges

Use soft backgrounds and semantic text colors.

Examples:
- مكتمل — Success.
- قيد المعالجة — Warning.
- ملغي — Error.
- قيد التوصيل — Info.

Never rely on color alone to communicate status.

### Dialogs & Modals

Use dialogs for:
- Adding users.
- Editing menu items.
- Creating administrator accounts.
- Confirming destructive actions.
- Updating order information.

Dialogs should:
- Be centered within the available content area.
- Respect RTL direction.
- Have clear titles and actions.
- Avoid unnecessary complexity.
- Provide clear confirmation and cancellation actions.

### Notifications

Use concise Arabic notifications.

- Success notifications for completed operations.
- Error notifications for failed operations.
- Warning notifications for actions requiring attention.
- Informational notifications for system updates.

### Charts & Analytics

Charts should communicate operational information clearly.

Use them for:
- Sales trends.
- Order statistics.
- Revenue overview.
- Popular menu items.
- Delivery performance.

Use the Berlin Food palette consistently.

Avoid excessive gradients, 3D charts, and unnecessary decorative effects.

### Page-Specific Design Guidance

**Home / Dashboard**
- Welcome message.
- KPI statistics.
- Sales and order charts.
- Recent orders.
- Latest delivery requests.
- Platform activity overview.

**Users**
- Customer listing.
- Search and filtering.
- User information.
- Account status.
- Relevant management actions.

**Orders**
- Order listing.
- Order number and customer.
- Items and total price.
- Order status.
- Order details.
- Status management.

**Delivery Requests**
- Delivery request listing.
- Customer and delivery information.
- Request status.
- Assignment and tracking information when available.

**Menu**
- Food categories.
- Menu item images.
- Product names and descriptions.
- Prices.
- Availability.
- Add, edit, and delete actions.

**Profile**
- Admin information.
- Profile picture.
- Personal details.
- Account settings.
- Password management.

**Admin Management**
- Accessible only to Superadmins.
- Administrator listing.
- Create administrator accounts.
- Manage administrator permissions and account status.

## Do's and Don'ts

### Do

- Do preserve the Berlin Food brand identity.
- Do use warm minimalism and restrained visual styling.
- Do maintain consistent RTL layouts.
- Do use IBM Plex Sans Arabic throughout.
- Do prioritize desktop productivity.
- Do use the brand primary color for important actions.
- Do create reusable components.
- Do maintain consistent spacing and typography.
- Do make tables easy to scan.
- Do support light and dark modes.
- Do provide loading, empty, error, and success states.
- Do maintain accessible contrast (WCAG AA where applicable).
- Do use semantic HTML and accessible interactive controls.

### Don't

- Don't create a generic SaaS dashboard aesthetic.
- Don't introduce unrelated brand colors.
- Don't use pure black or pure white as dominant surfaces.
- Don't use unnecessary borders.
- Don't overuse shadows and gradients.
- Don't overcrowd dashboard cards.
- Don't use inconsistent corner radii.
- Don't mix LTR and RTL layouts unintentionally.
- Don't use English UI labels.
- Don't use decorative elements that reduce information clarity.
- Don't use color as the only indicator of status.
- Don't create a separate visual identity for individual dashboard pages.

### Final Design Goal

Create a premium, sophisticated, Arabic-first RTL desktop administration experience that feels like an extension of the Berlin Food brand.

The result should combine:

**Berlin Food Identity + Urban Alchemist Aesthetic + Modern Dashboard Usability.**

Every screen should feel consistent, refined, readable, and operationally efficient.