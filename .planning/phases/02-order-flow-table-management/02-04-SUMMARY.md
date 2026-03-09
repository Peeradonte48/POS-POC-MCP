---
phase: 02-order-flow-table-management
plan: "04"
subsystem: ui
tags: [react-query, tanstack-query, nextjs, typescript, order-flow, pos]

requires:
  - phase: 02-order-flow-table-management
    plan: "02"
    provides: "POST /api/orders, GET /api/orders/:orderId, POST /api/orders/:orderId/items, PATCH /api/orders/:orderId"
  - phase: 02-order-flow-table-management
    plan: "03"
    provides: "Tables page wired with orderId navigation, React Query tables cache"

provides:
  - "useOrder(orderId): React Query hook fetching full order with items/modifiers"
  - "useActiveTableOrder(tableNumber): recovers orderId after page refresh"
  - "useSendToKitchen(): mutation that handles new order creation and add-round"
  - "useTransferTable(): mutation for PATCH /api/orders/:id table reassignment"
  - "GET /api/orders/active?tableNumber=N: returns orderId for open table order"
  - "Menu page wired to persistent API: loads existing order, sends to kitchen"
  - "Order panel renders sent items (grouped by round, muted) + pending (New items label)"
  - "Send to Kitchen button shows item count, disabled when no pending items"

affects:
  - 02-05-void-items
  - 03-kitchen-display

tech-stack:
  added: []
  patterns:
    - "React Query useMutation with onSuccess invalidation of related queries"
    - "PendingItem (flat, client-side) vs OrderWithItems (server, from DB)"
    - "resolvedOrderId state: URL param -> active lookup -> post-send update"
    - "toApiItem() converts PendingItem to API payload with addedByUserId injection"

key-files:
  created:
    - src/hooks/use-order.ts
    - src/app/api/orders/active/route.ts
  modified:
    - src/app/(pos)/menu/page.tsx
    - src/components/pos/order-panel.tsx
    - src/components/__tests__/smoke.test.tsx

key-decisions:
  - "PendingItem uses flat structure (menuItemId, menuItemName) separate from OrderItem which had item: MenuItem — flatter shape maps directly to API payload"
  - "resolvedOrderId state allows menu page to track orderId after first send without requiring URL navigation"
  - "useActiveTableOrder disabled when resolvedOrderId is set to avoid redundant API calls"
  - "POST /api/orders returns orderId (not id) — useSendToKitchen.onSuccess handles both id and orderId via data.id ?? data.orderId"
  - "Smoke test updated to use new OrderPanel props (serverOrder, pendingItems, onSend)"

patterns-established:
  - "PendingItem pattern: client-side items before send stored flat with tempId (crypto.randomUUID())"
  - "Send mutation branches on orderId presence: orderId in payload -> add-round, else -> create order"

requirements-completed: [ORDR-01, ORDR-02, ORDR-03, ORDR-04, ORDR-05]

duration: 18min
completed: 2026-03-10
---

# Phase 02 Plan 04: Order Flow UI Integration Summary

**React Query hooks and menu page wired to persistent order API — staff can create orders, add rounds, and see sent/pending items grouped by round in the order panel**

## Performance

- **Duration:** 18 min
- **Started:** 2026-03-10T01:54:41Z
- **Completed:** 2026-03-10T01:58:02Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Created `use-order.ts` with 4 exports: `useOrder`, `useActiveTableOrder`, `useSendToKitchen`, `useTransferTable` — plus `OrderWithItems` and `PendingItem` TypeScript interfaces
- Added `GET /api/orders/active?tableNumber=N` to recover orderId after page refresh (no orderId in URL)
- Rewired menu page from pure useState to server-state: loads existing order on mount, sends via mutation, clears pending on success
- Extended order panel to display sent items grouped by round (muted, "Sent" badge) and unsent items ("New items" label) with dynamic Send button showing item count

## Task Commits

1. **Task 1: Create useOrder hook with query and mutations** - `3b1adba` (feat)
2. **Task 2: Wire menu page and order panel to persistent API** - `5f8c776` (feat)

## Files Created/Modified

- `src/hooks/use-order.ts` - useOrder, useActiveTableOrder, useSendToKitchen, useTransferTable + shared TypeScript interfaces
- `src/app/api/orders/active/route.ts` - GET handler finding open order for a table number
- `src/app/(pos)/menu/page.tsx` - Rewritten to use persistent order hooks, PendingItem state, handleSendToKitchen
- `src/components/pos/order-panel.tsx` - Extended with serverOrder/pendingItems props, round grouping, dynamic Send button
- `src/components/__tests__/smoke.test.tsx` - Updated smoke test for new OrderPanel prop signature

## Decisions Made

- **PendingItem flat structure:** Used flat shape (`menuItemId`, `menuItemName`, etc.) rather than nesting `item: MenuItem`. This maps directly to API payload without transformation overhead and decouples the pending state from the menu item object.
- **resolvedOrderId state:** Menu page tracks the orderId in state after first send — avoids URL navigation while keeping the correct orderId for subsequent rounds.
- **useActiveTableOrder disabled when resolvedOrderId set:** Prevents redundant `/api/orders/active` calls once the orderId is known.
- **id vs orderId response normalization:** POST `/api/orders` returns `{ orderId, ... }` while POST `.../items` returns `{ id, ... }`. Hook handles both via `data.id ?? data.orderId`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Updated smoke test for changed OrderPanel interface**
- **Found during:** Task 2 (order-panel.tsx update)
- **Issue:** Smoke test used old `items[]` prop — would fail TypeScript and runtime after interface change
- **Fix:** Updated smoke test to pass `serverOrder={null}`, `pendingItems={[]}`, and `onSend={() => {}}` matching new required props
- **Files modified:** src/components/__tests__/smoke.test.tsx
- **Verification:** All 131 tests pass (`npx vitest run`)
- **Committed in:** 5f8c776 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 — missing critical update to keep tests passing)
**Impact on plan:** Necessary correctness fix. No scope creep.

## Issues Encountered

None — all plan steps executed cleanly. Pre-existing TypeScript errors in `src/db/__tests__/` (PgTable type casting) are out-of-scope and pre-date this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Full order creation and round-adding flow is functional end-to-end
- `useTransferTable` is available for any table-transfer UI (Plan 02-05 or later)
- `onVoidItem` prop reserved in OrderPanel for Plan 02-05 void implementation
- Plan 02-05 (void items) can build on the `serverOrder` prop already passed to OrderPanel

---
*Phase: 02-order-flow-table-management*
*Completed: 2026-03-10*
