---
phase: 02-order-flow-table-management
plan: "05"
subsystem: void-flow
tags: [react-query, tanstack-query, nextjs, typescript, void, pos, tdd, bcrypt]

requires:
  - phase: 02-order-flow-table-management
    plan: "04"
    provides: "OrderPanel with serverOrder/pendingItems props, useOrder hook, order API endpoints"

provides:
  - "POST /api/auth/verify-pin: bcrypt PIN check against manager/admin users at location"
  - "POST /api/orders/:orderId/items/:itemId/void: soft-delete item with reason/note/authorizedByUserId"
  - "POST /api/orders/:orderId/void: transaction-voids order + all items, marks completed"
  - "VoidReasonDialog: 3-step inline dialog (reason -> PIN -> confirming)"
  - "useVoidItem(): mutation hook for item-level void with cache invalidation"
  - "useVoidOrder(): mutation hook for order-level void with cache invalidation"
  - "Order panel shows trash icon on sent items and Void Order button on open orders"
  - "orders table updated with voidedAt, voidedByUserId, voidNote columns"

affects:
  - 03-kitchen-display

tech-stack:
  added: []
  patterns:
    - "bcrypt.compare loop over eligible users — first match wins, always 200 response"
    - "Zod void schemas in shared void-schemas.ts imported by all void routes"
    - "TDD: failing import test -> schema file created -> GREEN"
    - "Multi-step inline dialog pattern: reason/note -> PIN -> async confirm"
    - "Auto-submit PIN on 4 digits via PinPad.onSubmit callback"

key-files:
  created:
    - src/lib/void-schemas.ts
    - src/app/api/auth/verify-pin/route.ts
    - src/app/api/orders/[orderId]/items/[itemId]/void/route.ts
    - src/app/api/orders/[orderId]/void/route.ts
    - src/components/pos/void-reason-dialog.tsx
  modified:
    - src/db/schema/orders.ts
    - src/hooks/use-order.ts
    - src/components/pos/order-panel.tsx
    - src/app/api/__tests__/orders.test.ts

key-decisions:
  - "verifyPinSchema accepts only manager/admin requiredRole — cashier cannot authorize voids"
  - "verify-pin always returns 200 with {valid, userId} — HTTP errors reserved for auth/validation failures"
  - "VoidReasonDialog handles confirm inline (step=confirming) instead of a separate step — avoids extra user click"
  - "voidedAt on orders table avoids adding a new enum value to order_status (enum changes require Postgres table rewrite)"
  - "Order void sets status=completed + completedAt to keep existing status enum unchanged"

patterns-established:
  - "PIN verify-then-act pattern: verify-pin returns userId, that userId is passed to void endpoint as authorizedByUserId"
  - "Inline multi-step dialog: single component manages reason/pin/confirming steps with useState"

requirements-completed: [ORDR-02, ORDR-06]

duration: 5min
completed: 2026-03-10
---

# Phase 02 Plan 05: Void Flow Summary

**Inline void flow with manager PIN authorization — staff can remove unsent items freely and void sent items or entire orders with manager PIN, reason selection, and optional note**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-09T19:01:15Z
- **Completed:** 2026-03-09T19:06:57Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Added `voidedAt`, `voidedByUserId`, `voidNote` columns to the `orders` table (schema updated + `drizzle-kit push` applied)
- Created `src/lib/void-schemas.ts` with `verifyPinSchema`, `voidItemSchema`, `voidOrderSchema` — shared across all void routes and tests
- Created `POST /api/auth/verify-pin` — bcrypt compares PIN against all eligible manager/admin users at the session location, returns `{ valid, userId }`, always 200
- Created `POST /api/orders/:orderId/items/:itemId/void` — soft-deletes a sent item with `voidedAt`, `voidReason`, `voidNote`, `voidedByUserId`
- Created `POST /api/orders/:orderId/void` — transaction-voids all non-voided items and marks order `status=completed`, `completedAt=now`, `voidedAt=now`
- Created `VoidReasonDialog` — 3-step inline dialog: 4 reason buttons + optional note, manager PIN pad (reuses `PinPad`), auto-submits on 4 digits
- Added `useVoidItem` and `useVoidOrder` mutations to `use-order.ts` — invalidate `['order', orderId]` and `['tables']` on success
- Updated `OrderPanel` — trash icon on each sent item opens dialog in item mode; "Void Order" button in footer for open orders; `VoidReasonDialog` rendered at bottom of panel

## Task Commits

1. **test(02-05): add failing tests for verify-pin and void schemas** - `0c25bdd` (RED phase)
2. **feat(02-05): add verify-pin endpoint, item void, and order void APIs** - `4394e2e` (GREEN phase)
3. **feat(02-05): add VoidReasonDialog component and order panel void integration** - `4dea9a1`

## Files Created/Modified

- `src/lib/void-schemas.ts` — shared Zod schemas for verify-pin, voidItem, voidOrder
- `src/db/schema/orders.ts` — added voidedAt, voidedByUserId, voidNote to orders table
- `src/app/api/auth/verify-pin/route.ts` — POST endpoint for manager PIN verification
- `src/app/api/orders/[orderId]/items/[itemId]/void/route.ts` — POST item void endpoint
- `src/app/api/orders/[orderId]/void/route.ts` — POST order void endpoint
- `src/components/pos/void-reason-dialog.tsx` — 3-step inline void dialog component
- `src/hooks/use-order.ts` — added useVoidItem, useVoidOrder mutations
- `src/components/pos/order-panel.tsx` — trash icon on sent items, Void Order button, VoidReasonDialog
- `src/app/api/__tests__/orders.test.ts` — 13 new tests for verify-pin and void schemas (38 total)

## Decisions Made

- **verify-pin always returns 200:** HTTP 401/403 is reserved for the session being absent or unauthorized. Invalid PIN is a business-level outcome — the UI handles it by showing an inline error and clearing the PIN pad.
- **voidedAt on orders table instead of new enum value:** Adding `"voided"` to `order_status` enum in Postgres requires a table rewrite. Using `voidedAt` column with `status="completed"` avoids this migration risk while preserving query-ability.
- **VoidReasonDialog calls confirm inline after PIN:** The `confirming` step triggers the void mutation immediately after PIN validation, without requiring an extra "Confirm" click. This reduces friction for time-sensitive corrections.

## Deviations from Plan

None — plan executed exactly as written. The orders schema already had void columns on `order_items` from Plan 02-01; only the `orders` table needed new columns.

## Issues Encountered

- Pre-existing TypeScript errors in `src/db/__tests__/` (PgTable type casting) — out-of-scope, pre-date this plan, documented in 02-04 SUMMARY.

## Self-Check: PASSED

All created files confirmed present. Commits 0c25bdd, 4394e2e, 4dea9a1 confirmed in git log. All 144 tests pass.
