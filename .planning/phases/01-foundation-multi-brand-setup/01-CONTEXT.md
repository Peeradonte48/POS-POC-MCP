# Phase 1: Foundation & Multi-Brand Setup - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Database schema, multi-brand architecture, RBAC, menu module with ERP-sourced data, and shadcn/ui component setup. This is the foundation every other phase builds on — no orders, no billing, no kitchen communication yet.

Requirements: MENU-01, MENU-02, MENU-03, MENU-04, MENU-05, MBML-01, MBML-02, MBML-03, MBML-04, MBML-05, UIUX-03

</domain>

<decisions>
## Implementation Decisions

### Staff Login & Session
- PIN code for cashiers/servers (4-6 digit, fast tap-in on tablets), username+password for admin/manager portal
- Quick user switching on POS terminals — terminal stays active, staff tap PIN to switch user instantly, no full logout required
- Manager authorization uses inline PIN prompt — popup appears on current screen, manager enters PIN to authorize (voids, discounts), cashier stays in same flow
- Terminals are pre-assigned to a brand+location by admin — staff just see brand name, location, and PIN entry on login screen. No brand/location selector at login time

### Menu Browsing UI
- Category sidebar on left + item grid in main area — standard POS layout with fast category switching
- Menu item cards show thumbnail images with item name and price — images managed via ERP sync
- Modifier selection via bottom sheet/drawer — slides up from bottom when item is tapped, shows modifier options (single-select, multi-select), quantity stepper, and notes field. Tap outside to dismiss
- Current order summary always visible in right panel — shows items, quantities, running total, and send button. Three-column layout: categories | item grid | order

### Admin Panel
- Separate /admin route with its own sidebar navigation layout — clean separation from POS floor interface
- Manager gets limited admin panel — can see their location's staff, view menu (read-only), and run location reports. Cannot manage brands, create locations, or change system config
- Menu is read-only in admin panel — ERP is source of truth, admin has "Sync Menu" button and shows sync status (last synced time, in-sync indicator). All menu editing happens in ERP
- Brand settings organized with tabbed settings page — tabs for General (name, logo, tax ID, address), Billing (service charge %, VAT config), and Locations (list with per-location settings)

### Claude's Discretion
- ERP sync mechanism (polling interval, webhook, manual-only) — implementation detail for research phase
- Database schema design (table structure, relationships, indexes)
- Auth token/session management implementation
- Color scheme and exact visual styling within shadcn/ui
- Loading states, error states, empty states throughout

</decisions>

<specifics>
## Specific Ideas

- Three-column POS layout: [Category sidebar] | [Item grid with thumbnails] | [Order panel with running total]
- Bottom sheet pattern for item modifiers — natural on tablets, dismissible
- PIN pad as primary login for floor staff — speed is critical during rush
- Inline manager PIN popup for authorization — no screen switching, no flow interruption
- Brand+location pre-assigned per terminal — zero decisions for staff at login

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- shadcn v4 installed as dev dependency — ready for component generation
- No existing components, hooks, or utilities yet (greenfield)

### Established Patterns
- None yet — Phase 1 establishes all patterns for the project

### Integration Points
- ERP API (web-based, details TBD) — menu data source
- Next.js app router — recommended by research phase (Next.js 15, React 19)
- PostgreSQL + Drizzle ORM — recommended stack from research

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-multi-brand-setup*
*Context gathered: 2026-03-09*
