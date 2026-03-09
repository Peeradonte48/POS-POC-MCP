---
phase: 01-foundation-multi-brand-setup
plan: 04
subsystem: pos-floor-interface
tags: [next.js, react, shadcn-ui, pos, menu, modifiers, order-panel, pin-login, tablet-responsive]

# Dependency graph
requires:
  - phase: 01-01
    provides: "Database schema with brands, locations, users, menu tables"
  - phase: 01-02
    provides: "JWT auth (verifySession), PIN login API, session cookie management"
provides:
  - POS PIN login with terminal selection at /login
  - Table selection page at /tables
  - Three-column menu page at /menu (categories | item grid | order panel)
  - Modifier bottom sheet with single/multi-select, quantity, notes
  - Brand-scoped menu API with modifier groups and options
  - Tablet-responsive layout with floating cart on small screens
  - Unsplash placeholder images for all 30 menu items
affects: [02-01, 03-01]

# Tech tracking
tech-stack:
  added: []
  patterns: [three-column-layout, floating-cart-pattern, horizontal-pill-bar, slide-over-panel, auto-submit-pin]

key-files:
  created:
    - src/app/(pos)/login/page.tsx
    - src/app/(pos)/menu/page.tsx
    - src/app/(pos)/tables/page.tsx
    - src/components/pos/pin-pad.tsx
    - src/components/pos/category-sidebar.tsx
    - src/components/pos/menu-grid.tsx
    - src/components/pos/menu-item-card.tsx
    - src/components/pos/modifier-sheet.tsx
    - src/components/pos/order-panel.tsx
    - src/hooks/use-menu.ts
    - src/app/api/menu/route.ts
    - src/app/api/menu/[categoryId]/route.ts
    - src/app/api/terminals/route.ts
    - src/app/api/tables/route.ts
    - src/components/__tests__/modifier-sheet.test.tsx
    - src/components/__tests__/smoke.test.tsx
  modified:
    - src/app/(pos)/layout.tsx
    - src/app/layout.tsx
    - src/app/globals.css
    - src/db/seed.ts

key-decisions:
  - "Terminal selection UI instead of query param -- login page fetches terminals, user picks one"
  - "Auto-submit PIN on 4 digits -- no Enter button needed for fast cashier workflow"
  - "Table selection before menu -- cashier picks table or takeaway, then browses menu"
  - "Three-column layout collapses on tablet: sidebar becomes horizontal pill bar, order panel becomes floating cart + slide-over"
  - "Send to Kitchen button disabled when order is empty (not hardcoded disabled)"
  - "100dvh instead of 100vh for iOS Safari viewport compatibility"
  - "Unsplash images as placeholders -- direct URLs, no API key needed"

patterns-established:
  - "Floating cart pattern: on screens < lg, order panel is a slide-over triggered by floating button"
  - "Horizontal pill bar: category sidebar replaced with scrollable pill buttons on mobile/small tablet"
  - "Menu item cards: native button for accessibility, image zoom on hover, gradient fallback"
  - "useMenu hook with react-query: 5-minute staleTime for menu data"

requirements-completed: [MENU-01, MENU-02, MENU-03, MENU-05]

# Metrics
duration: ~60min (across multiple sessions)
completed: 2026-03-10
---

# Phase 1 Plan 4: POS Floor Interface Summary

**Complete POS floor interface with PIN login, terminal/table selection, three-column menu browsing, modifier bottom sheet, and tablet-responsive layout**

## Performance

- **Duration:** ~60 min (across multiple sessions with iterative improvements)
- **Completed:** 2026-03-10
- **Files modified:** 20+

## Accomplishments

- PIN login with terminal selection (auto-selects if only 1 terminal), brand name and location displayed
- Table selection page with responsive grid (3-8 columns), takeaway option, sign out button
- Three-column menu layout: category sidebar (w-44/w-52), item grid (responsive 2-4 cols), order panel (w-72/w-80)
- Tablet-responsive: sidebar becomes horizontal pill bar on <md, order panel becomes floating cart + slide-over on <lg
- Modifier bottom sheet with single-select radio, multi-select checkboxes, quantity stepper, notes field, price adjustments
- Order panel with item list, modifier details, notes, quantity controls, running subtotal, "Send to Kitchen" button
- Brand-scoped menu API returning categories with nested items and modifier groups/options
- Unsplash placeholder images for all 30 menu items (verified working URLs)
- Warm restaurant theme: terracotta primary, cream background, OKLCH color system
- 81 tests passing, build succeeds

## Deviations from Plan

### Improvements Beyond Plan

1. **Terminal selection UI** — Plan assumed terminalId via query param; implemented full terminal selection screen
2. **Table selection flow** — Added /tables page for table/takeaway selection before menu
3. **Tablet responsiveness** — Plan specified fixed three-column; implemented adaptive layout with floating cart pattern
4. **Image placeholders** — Added real food photos from Unsplash for better visual experience
5. **Theme overhaul** — Applied warm restaurant color palette with OKLCH colors

### Auto-fixed Issues

1. **Broken Unsplash URLs** — 10 of 30 image URLs returned 404; replaced with verified working alternatives
2. **Send to Kitchen button** — Was hardcoded `disabled`; changed to `disabled={items.length === 0}`
3. **Seed script truncation** — Added TRUNCATE CASCADE for clean re-runs

## Self-Check: PASSED

- PIN login works with terminal selection
- Menu shows three-column layout with brand-scoped data
- Category filtering works (sidebar and pill bar)
- Modifier sheet opens for items with modifiers
- Items added to order panel with modifiers, notes, running total
- 81 tests passing, build succeeds

---
*Phase: 01-foundation-multi-brand-setup*
*Completed: 2026-03-10*
