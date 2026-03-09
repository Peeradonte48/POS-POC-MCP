---
phase: 02-order-flow-table-management
plan: 03
subsystem: api, ui
tags: [react-query, drizzle-orm, nextjs, shadcn-ui, sheet, tanstack-query]

# Dependency graph
requires:
  - phase: 02-01
    provides: orders/orderItems/orderItemModifiers schema and permissions system
  - phase: 01-04
    provides: /tables page shell, React Query provider, shadcn/ui Sheet component
provides:
  - "GET /api/tables with live status (free/occupied/needs_attention), orderId, orderTotal, openedAt per table"
  - "GET /api/orders/history returning today's completed orders scoped to Asia/Bangkok timezone"
  - "React Query-powered /tables page with color-coded table cards showing status, total, elapsed time"
  - "OrderHistorySheet bottom sheet component for viewing today's completed orders"
affects: [02-04, 02-05, billing-phase]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "inArray batch queries: 3 queries to cover all tables regardless of count (orders → items → modifiers)"
    - "React Query polling pattern: 30s refetchInterval + refetchOnWindowFocus for live floor state"
    - "enabled: open pattern in React Query to lazy-fetch sheet data only when opened"
    - "Asia/Bangkok timezone scoping via SQL AT TIME ZONE for location-aware date filtering"

key-files:
  created:
    - src/app/api/orders/history/route.ts
    - src/components/pos/order-history-sheet.tsx
  modified:
    - src/app/api/tables/route.ts
    - src/app/(pos)/tables/page.tsx
    - src/lib/permissions.ts

key-decisions:
  - "cashier and manager roles granted orders:read permission — required for table status display and order history"
  - "Table total computed server-side via 3-query batch (open orders, non-voided items, modifiers) — avoids N+1"
  - "needs_attention threshold: 90 minutes since openedAt, computed in JS after query"
  - "OrderHistorySheet uses enabled: open in useQuery to avoid fetching on page load"
  - "History item count uses quantity sum of non-voided items (not row count)"

patterns-established:
  - "Batch query pattern: fetch parent IDs, batch-fetch children with inArray, aggregate in JS"
  - "Status determination in JS after single DB round-trip — keeps SQL simple, logic in application layer"

requirements-completed: [ORDR-03, ORDR-04]

# Metrics
duration: 5min
completed: 2026-03-10
---

# Phase 02 Plan 03: Table Status Grid and Order History Summary

**React Query-powered table grid with live color-coded status (free/occupied/needs_attention), Thai Baht order totals and elapsed time, plus bottom-sheet Order History showing today's Bangkok-timezone completed orders**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-09T18:46:05Z
- **Completed:** 2026-03-09T18:50:40Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- GET /api/tables now returns live status per table using 3-query batch (open orders + non-voided items + modifiers) to avoid N+1
- /tables page upgraded from useEffect+fetch to React Query with 30s polling and color-coded cards (green/amber/red)
- GET /api/orders/history returns today's completed orders filtered by Asia/Bangkok timezone
- OrderHistorySheet bottom sheet component with lazy-load (enabled: open) and empty/loading states

## Task Commits

Each task was committed atomically:

1. **Task 1: Update GET /api/tables with live order status** - `2e9ff39` (feat)
2. **Tasks 2 & 3: Live table grid + Order History sheet + API** - `14fc347` (feat)

## Files Created/Modified
- `src/app/api/tables/route.ts` - Updated: joins orders/items/modifiers via inArray batch, returns status/orderId/orderTotal/openedAt
- `src/app/(pos)/tables/page.tsx` - Updated: React Query polling, color-coded cards, orderId in occupied navigation, OrderHistorySheet wired
- `src/app/api/orders/history/route.ts` - Created: GET completed orders for today in Bangkok timezone
- `src/components/pos/order-history-sheet.tsx` - Created: Sheet with lazy fetch, order list rows, empty/loading states
- `src/lib/permissions.ts` - Updated: added orders:read to cashier and manager roles

## Decisions Made
- **cashier/manager get orders:read** — the /tables page calls `/api/tables` which requires reading order data; cashier must be able to do this
- **3-query batch for totals** — fetch all open orders, then inArray for items, then inArray for modifiers; aggregate in JS; avoids per-table N+1
- **90-minute needs_attention threshold** — matches plan spec; computed in JS after query
- **Lazy history fetch** (`enabled: open`) — avoids loading history data on page load; fetches only when sheet opens

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added orders:read permission to cashier and manager roles**
- **Found during:** Task 1 (Update GET /api/tables)
- **Issue:** Plan specifies `requireAuth(request, "orders", "read")` but cashier and manager lacked `orders:read` in permissions.ts — would have blocked cashiers from loading the table grid entirely
- **Fix:** Added `"read"` to cashier's and manager's orders permission arrays in `src/lib/permissions.ts`
- **Files modified:** src/lib/permissions.ts
- **Verification:** All 131 tests pass; existing tests confirm cashier can create/update orders, no regression
- **Committed in:** `2e9ff39` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 — missing critical permission)
**Impact on plan:** Essential fix; without it the entire tables page would return 403 for all cashier sessions. No scope creep.

## Issues Encountered
- Drizzle LEFT JOIN with `and()` in join ON clause caused TypeScript errors; resolved by using separate inArray queries and JS aggregation instead — this is actually a cleaner approach that avoids complex JOIN expressions

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- /tables page is glanceable and live — ready for 02-04 (menu page loading existing order via orderId)
- orderId is now passed in URL for occupied table navigation
- Order history infrastructure ready for billing/payment phase reference
- No blockers for 02-04

---
*Phase: 02-order-flow-table-management*
*Completed: 2026-03-10*
