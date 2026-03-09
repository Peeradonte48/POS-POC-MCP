---
phase: 01-foundation-multi-brand-setup
plan: 03
subsystem: admin-panel
tags: [next.js, react, shadcn-ui, admin-panel, erp-sync, rbac, zod, drizzle-orm, base-ui]

# Dependency graph
requires:
  - phase: 01-01
    provides: "Database schema with brands, locations, users, menu, sync_logs tables"
  - phase: 01-02
    provides: "JWT auth (verifySession), RBAC (hasPermission), and login API routes"
provides:
  - Admin panel at /admin with sidebar navigation and role-aware access
  - Brand CRUD API with zod validation (GET/POST/PUT/DELETE)
  - Location CRUD API with role-based filtering
  - Staff management API with PIN/password hashing
  - ERP sync service with mock adapter (ramen and burger menus)
  - Sync trigger API with sync log history
  - Admin login page at /admin/login
  - Management pages for brands, locations, staff, and menu
  - Read-only menu view with sync button and status indicator
affects: [01-04, 02-01, 06-01]

# Tech tracking
tech-stack:
  added: []
  patterns: [api-utils-auth-helper, render-prop-dialog-trigger, admin-route-group-separation, erp-adapter-pattern]

key-files:
  created:
    - src/types/erp.ts
    - src/lib/erp-sync.ts
    - src/lib/api-utils.ts
    - src/app/api/brands/route.ts
    - src/app/api/brands/[brandId]/route.ts
    - src/app/api/locations/route.ts
    - src/app/api/locations/[locationId]/route.ts
    - src/app/api/staff/route.ts
    - src/app/api/sync/route.ts
    - src/app/api/auth/logout/route.ts
    - src/app/(admin)/admin/layout.tsx
    - src/app/(admin)/admin/page.tsx
    - src/app/(admin-auth)/admin/login/page.tsx
    - src/app/(admin)/admin/brands/page.tsx
    - src/app/(admin)/admin/brands/[brandId]/page.tsx
    - src/app/(admin)/admin/locations/page.tsx
    - src/app/(admin)/admin/locations/[locationId]/page.tsx
    - src/app/(admin)/admin/staff/page.tsx
    - src/app/(admin)/admin/menu/page.tsx
    - src/components/admin/admin-sidebar.tsx
    - src/components/admin/brand-form.tsx
    - src/components/admin/brand-settings-tabs.tsx
    - src/components/admin/location-form.tsx
    - src/components/admin/staff-table.tsx
    - src/components/admin/sync-status.tsx
    - src/lib/__tests__/erp-sync.test.ts
    - src/app/api/__tests__/brands.test.ts
  modified:
    - src/app/api/menu/route.ts
    - src/components/ui/dialog.tsx

key-decisions:
  - "Admin login at /admin/login in separate route group (admin-auth) to avoid auth redirect loop from admin layout"
  - "ERP sync uses adapter pattern: fetchERPMenu() returns mock data now, can be swapped for real ERP API later"
  - "Menu page is read-only with manual sync button -- no auto-polling or webhooks in Phase 1"
  - "DialogTrigger uses render prop instead of asChild (shadcn v4 / base-ui pattern)"
  - "Widened dialog max-width from sm to lg for form content usability"

patterns-established:
  - "API auth helper: requireAuth() combines session verification + permission check in one call"
  - "Admin route groups: (admin) for authenticated pages, (admin-auth) for login page without auth layout"
  - "ERP adapter pattern: fetchERPMenu() is the swap point for real ERP integration"
  - "Role-aware data filtering: managers see own location data, admin sees all"

requirements-completed: [MBML-03, MENU-04]

# Metrics
duration: 10min
completed: 2026-03-09
---

# Phase 1 Plan 3: Admin Panel & ERP Sync Summary

**Full admin panel with brand/location/staff CRUD, read-only menu view, and ERP sync service with mock ramen and burger menus**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-09T15:40:31Z
- **Completed:** 2026-03-09T15:50:17Z
- **Tasks:** 3
- **Files modified:** 34

## Accomplishments

- Complete admin panel with sidebar navigation, role-aware access (admin sees all, manager sees Staff+Menu only)
- Brand CRUD with tabbed settings (General/Billing/Locations), location management with printer and table config, staff management with role-based PIN or email+password creation
- ERP sync service with transactional upserts, mock data for "A RAMEN" (15 ramen items with modifiers) and "Burger Lab" (12 burger items with modifiers)
- Read-only menu view with brand selector, accordion categories, "Sync Menu" button, and sync status indicator showing last sync time and result
- 18 new tests for ERP sync types and brand API validation schemas (81 total tests passing)

## Task Commits

Each task was committed atomically:

1. **Task 1: Build admin API routes for brands, locations, staff, and ERP sync** - `d0fb221` (feat)
2. **Task 2: Build admin shell with layout, sidebar, login, and dashboard** - `266fe81` (feat)
3. **Task 3: Build management pages for brands, locations, staff, and menu** - `73f8ad5` (feat)

## Files Created/Modified

- `src/types/erp.ts` - ERP sync types (ERPCategory, ERPMenuItem, ERPSyncResponse, SyncResult)
- `src/lib/erp-sync.ts` - ERP sync service with mock adapter and transactional upserts
- `src/lib/api-utils.ts` - Auth helper (getSession, requireAuth) for API routes
- `src/app/api/brands/route.ts` - Brand list/create API with zod validation
- `src/app/api/brands/[brandId]/route.ts` - Brand detail/update/delete API
- `src/app/api/locations/route.ts` - Location list/create API with role filtering
- `src/app/api/locations/[locationId]/route.ts` - Location detail/update API
- `src/app/api/staff/route.ts` - Staff list/create API with PIN/password hashing
- `src/app/api/sync/route.ts` - Sync trigger (POST) and sync log history (GET)
- `src/app/api/auth/logout/route.ts` - Session cookie clearing endpoint
- `src/app/(admin)/admin/layout.tsx` - Admin shell with auth check and sidebar
- `src/app/(admin)/admin/page.tsx` - Dashboard with brand/location/staff counts
- `src/app/(admin-auth)/admin/login/page.tsx` - Admin login with email/password form
- `src/app/(admin)/admin/brands/page.tsx` - Brand list with create dialog
- `src/app/(admin)/admin/brands/[brandId]/page.tsx` - Brand detail with tabbed settings
- `src/app/(admin)/admin/locations/page.tsx` - Location list grouped by brand
- `src/app/(admin)/admin/locations/[locationId]/page.tsx` - Location detail editor
- `src/app/(admin)/admin/staff/page.tsx` - Staff table with role-aware create form
- `src/app/(admin)/admin/menu/page.tsx` - Read-only menu with sync button
- `src/components/admin/admin-sidebar.tsx` - Role-aware sidebar with collapsible mobile
- `src/components/admin/brand-form.tsx` - Reusable brand create/edit form
- `src/components/admin/brand-settings-tabs.tsx` - Tabbed settings (General/Billing/Locations)
- `src/components/admin/location-form.tsx` - Reusable location create/edit form
- `src/components/admin/staff-table.tsx` - Staff table with role badges
- `src/components/admin/sync-status.tsx` - Sync status with badges and timestamps
- `src/lib/__tests__/erp-sync.test.ts` - 7 tests for ERP sync type shapes
- `src/app/api/__tests__/brands.test.ts` - 11 tests for brand API zod schemas
- `src/app/api/menu/route.ts` - Updated to accept brandId query param for admin
- `src/components/ui/dialog.tsx` - Widened max-width from sm to lg
- `src/components/ui/select.tsx` - Added shadcn select component
- `src/components/ui/table.tsx` - Added shadcn table component
- `src/components/ui/textarea.tsx` - Added shadcn textarea component
- `src/components/ui/label.tsx` - Added shadcn label component
- `src/components/ui/accordion.tsx` - Added shadcn accordion component

## Decisions Made

- Admin login placed in separate route group `(admin-auth)` to avoid the auth redirect loop that would occur if login was under the `(admin)` group's auth-checking layout
- ERP sync uses adapter pattern with fetchERPMenu() as the swap point -- currently returns mock data, designed for easy replacement with real ERP API calls
- Menu page is read-only with manual sync only (per user decision) -- no auto-polling or webhooks in Phase 1
- Used base-ui `render` prop pattern instead of Radix `asChild` prop for DialogTrigger (shadcn v4 breaking change)
- Widened dialog component from sm to lg max-width to accommodate form content without scrolling

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Admin login redirect loop**
- **Found during:** Task 2 (admin layout)
- **Issue:** Plan specified login at `(admin)/login/page.tsx` mapping to `/login`, conflicting with existing POS login at `(pos)/login/page.tsx`
- **Fix:** Created separate `(admin-auth)` route group for login page at `/admin/login`, outside the auth-checking admin layout
- **Files modified:** src/app/(admin-auth)/admin/login/page.tsx
- **Verification:** Build passes, no route conflicts
- **Committed in:** 266fe81

**2. [Rule 1 - Bug] shadcn v4 DialogTrigger asChild prop doesn't exist**
- **Found during:** Task 3 (management pages)
- **Issue:** shadcn v4 uses base-ui which has `render` prop instead of Radix's `asChild`
- **Fix:** Replaced all `<DialogTrigger asChild>` with `<DialogTrigger render={<Button />}>`
- **Files modified:** brands/page.tsx, locations/page.tsx, staff/page.tsx
- **Verification:** TypeScript build passes
- **Committed in:** 73f8ad5

**3. [Rule 1 - Bug] shadcn v4 Accordion API difference**
- **Found during:** Task 3 (menu page)
- **Issue:** base-ui Accordion uses `multiple` prop (not `type="multiple"`) and no `defaultOpen` on items
- **Fix:** Changed to `<Accordion multiple>` and removed `defaultOpen` from AccordionItem
- **Files modified:** src/app/(admin)/admin/menu/page.tsx
- **Verification:** TypeScript build passes
- **Committed in:** 73f8ad5

**4. [Rule 2 - Missing Critical] Logout API route not in plan**
- **Found during:** Task 2 (admin sidebar)
- **Issue:** Sidebar has "Sign Out" button but no logout endpoint existed
- **Fix:** Created POST /api/auth/logout that clears session cookie
- **Files modified:** src/app/api/auth/logout/route.ts
- **Verification:** Build passes, endpoint registered
- **Committed in:** 266fe81

---

**Total deviations:** 4 auto-fixed (2 bugs, 1 blocking, 1 missing critical)
**Impact on plan:** All fixes necessary for correctness. Route group separation was the biggest structural change. No scope creep.

## Issues Encountered

None beyond the auto-fixed deviations above.

## User Setup Required

None - no additional external service configuration required beyond existing database and AUTH_SECRET setup from Plans 01-01 and 01-02.

## Next Phase Readiness

- Admin panel complete: brands, locations, staff management all operational
- ERP sync ready to populate menu data for POS floor interface (Plan 01-04)
- All API routes enforce auth and RBAC permissions
- Manager role sees limited admin panel (Staff + Menu only)
- 81 tests passing across all test files

## Self-Check: PASSED

All 27 key created files verified present. All 3 task commits verified in git log.

---
*Phase: 01-foundation-multi-brand-setup*
*Completed: 2026-03-09*
