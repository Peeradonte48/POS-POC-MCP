---
phase: 02-order-flow-table-management
plan: 02
subsystem: api
tags: [nextjs, drizzle, postgres, zod, orders, tdd, vitest, transactions]

requires:
  - phase: 02-01
    provides: orders, orderItems, orderItemModifiers tables + RBAC for orders resource

provides:
  - POST /api/orders (create order with items+modifiers in transaction, daily Bangkok orderNumber)
  - GET /api/orders (list open orders for location with itemCount)
  - GET /api/orders/:id (full order with nested items and modifiers)
  - PATCH /api/orders/:id (table transfer, rejects completed orders)
  - POST /api/orders/:id/items (add new round with MAX(roundNumber)+1 in transaction)
  - src/lib/order-schemas.ts (shared Zod schemas for all order routes)

affects:
  - 02-03-table-management (reads from orders table to derive table occupancy)
  - 02-04-order-panel (calls these endpoints to create and extend orders)
  - 03-kitchen-display (reads order_items.sentAt set by these routes)

tech-stack:
  added: []
  patterns:
    - "db.transaction() for atomic daily order number assignment (COUNT + INSERT)"
    - "Bangkok timezone date: toLocaleString('en-CA', { timeZone: 'Asia/Bangkok' })"
    - "Shared Zod schemas in src/lib/order-schemas.ts imported by all order routes"
    - "MAX(round_number) query in transaction for monotonic round numbering"
    - "params as Promise<{orderId}> per Next.js 15 async params pattern"

key-files:
  created:
    - src/lib/order-schemas.ts
    - src/app/api/orders/route.ts
    - src/app/api/orders/[orderId]/route.ts
    - src/app/api/orders/[orderId]/items/route.ts
    - src/app/api/__tests__/orders-routes.test.ts
  modified: []

key-decisions:
  - "menuItemName required in itemSchema (notNull in DB) — client provides snapshot name at order time"
  - "sentAt set to new Date() on insert for all items (round 1 and subsequent rounds) — Phase 3 kitchen display reads this"
  - "tableTransferSchema exported from order-schemas.ts to keep all order Zod schemas co-located"
  - "GET /api/orders uses inline subquery for itemCount to avoid extra round-trips"

duration: ~4min
completed: 2026-03-10
---

# Phase 2 Plan 02: Order API Routes Summary

**Three order API routes (create/list orders, get/transfer order, add round) with shared Zod schemas, Bangkok-timezone daily order numbering, and DB transaction safety**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-09T18:45:25Z
- **Completed:** 2026-03-09T18:49:25Z
- **Tasks:** 2 (TDD: RED + GREEN + REFACTOR for each)
- **Files created:** 5

## Accomplishments

- Created `src/lib/order-schemas.ts` — 4 exported schemas (`modifierSchema`, `itemSchema`, `createOrderSchema`, `addRoundSchema`, `tableTransferSchema`) shared by all three route files
- Created `src/app/api/orders/route.ts` — POST (atomic order creation with daily Bangkok-timezone orderNumber), GET (open order list with subquery itemCount)
- Created `src/app/api/orders/[orderId]/route.ts` — GET (full order with joined items+modifiers), PATCH (table transfer with completed-order guard)
- Created `src/app/api/orders/[orderId]/items/route.ts` — POST (add new round using MAX(round_number)+1 in transaction)
- Added 25 new tests in `orders-routes.test.ts` — all pass alongside the 25 pre-existing schema tests (131 total)

## Task Commits

1. **RED: Failing tests** — `0857619` (test)
2. **GREEN: Schemas + route implementations** — `d1cebe7` (feat)
3. **REFACTOR: Add menuItemName to itemSchema** — `b5141f1` (refactor)

## Files Created/Modified

- `src/lib/order-schemas.ts` — Shared Zod schemas for all order routes
- `src/app/api/orders/route.ts` — POST + GET handlers
- `src/app/api/orders/[orderId]/route.ts` — GET + PATCH handlers
- `src/app/api/orders/[orderId]/items/route.ts` — POST handler
- `src/app/api/__tests__/orders-routes.test.ts` — 25 tests for route schemas

## Decisions Made

- `menuItemName` added to `itemSchema` (client-provided snapshot) — column is `notNull` in DB schema, so this field is required at order creation and when adding rounds
- `sentAt = new Date()` on all item inserts — all items are immediately "sent" at creation, which is Phase 3's convention for kitchen display
- Shared schemas in `src/lib/order-schemas.ts` — prevents duplication between route files
- `GET /api/orders` uses SQL subquery for itemCount — efficient single query

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] menuItemName not in itemSchema but required by DB**
- **Found during:** REFACTOR review after GREEN
- **Issue:** `orderItems.menuItemName` is `notNull` in DB schema but `itemSchema` didn't include it, causing routes to insert `menuItemId` as a placeholder for the name
- **Fix:** Added `menuItemName: z.string().min(1)` to `itemSchema`, updated both route files to use `item.menuItemName`, added test for rejection when missing
- **Files modified:** `src/lib/order-schemas.ts`, `src/app/api/orders/route.ts`, `src/app/api/orders/[orderId]/items/route.ts`, `src/app/api/__tests__/orders-routes.test.ts`
- **Commit:** `b5141f1`

## Issues Encountered

- Pre-existing TypeScript errors in `src/db/__tests__/` (brand-queries, location-queries, menu-queries) — out of scope, not caused by this plan

## Next Phase Readiness

- Order API is complete — Plan 02-03 (Table Status) can read from the orders table
- Plan 02-04 (Order Panel UI) can call POST /api/orders and POST /api/orders/:id/items
- All items have `sentAt` set immediately, matching Phase 3 kitchen display contract

---
*Phase: 02-order-flow-table-management*
*Completed: 2026-03-10*
