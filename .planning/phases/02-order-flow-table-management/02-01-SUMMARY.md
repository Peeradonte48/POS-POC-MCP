---
phase: 02-order-flow-table-management
plan: 01
subsystem: database
tags: [drizzle, postgres, rbac, orders, zod, vitest, tdd]

requires:
  - phase: 01-foundation-multi-brand-setup
    provides: brands, locations, users, menu tables and RBAC infrastructure

provides:
  - orders table with order_status and order_type enums
  - order_items table with void_reason enum and snapshot columns
  - order_item_modifiers table with nullable FK for menu change resilience
  - Drizzle relations for orders, order_items, order_item_modifiers
  - RBAC: cashier gets orders:create+update, manager gets orders:create+update+delete
  - Vitest test suite covering all ORDR-01 through ORDR-06 validation rules

affects:
  - 02-02-order-api (directly — API routes build on this schema)
  - 02-03-table-management (orders table provides foundation)
  - 03-kitchen-display (reads order_items with sentAt flag)

tech-stack:
  added: []
  patterns:
    - "pgEnum with string literal arrays for domain enums"
    - "Snapshot columns (menuItemName, unitPrice, optionName) for historical accuracy"
    - "Nullable FK (modifierOptionId) for resilience to menu changes"
    - "Named relations (orderItemAddedBy, orderItemVoidedBy) for self-referencing users table"
    - "TDD: write failing tests first, implement to pass, then verify with drizzle-kit push"

key-files:
  created:
    - src/db/schema/orders.ts
    - src/app/api/__tests__/orders.test.ts
  modified:
    - src/db/schema/index.ts
    - src/db/relations.ts
    - src/lib/permissions.ts

key-decisions:
  - "Snapshot columns on order_items (menuItemName, unitPrice) so historical orders survive menu edits"
  - "modifierOptionId is nullable FK — if modifier option is deleted, order history is preserved via optionName snapshot"
  - "sentAt on order_items is set at creation but kept for Phase 3 kitchen display; null means item not yet sent"
  - "manager:delete maps to void capability — delete action on orders resource represents voiding, not hard delete"

patterns-established:
  - "Named Drizzle relations when same table has multiple FKs to same target (users referenced as addedBy and voidedBy)"
  - "Zod refine() for cross-field validation (tableNumber required only when orderType=table)"

requirements-completed: [ORDR-01, ORDR-02, ORDR-03, ORDR-04, ORDR-05, ORDR-06]

duration: 5min
completed: 2026-03-10
---

# Phase 2 Plan 01: Order Schema + Permissions + Test Scaffold Summary

**Three Drizzle tables (orders, order_items, order_item_modifiers) with enums and relations, RBAC updated for cashier/manager order access, 25 Vitest tests covering all ORDR-01 through ORDR-06 rules**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-10T01:41:00Z
- **Completed:** 2026-03-10T01:43:10Z
- **Tasks:** 3 (RED, GREEN, REFACTOR)
- **Files modified:** 5

## Accomplishments

- Created `src/db/schema/orders.ts` with 3 tables, 3 pgEnums, exported via schema/index.ts
- Added `ordersRelations`, `orderItemsRelations`, `orderItemModifiersRelations` to relations.ts
- Updated permissions.ts: cashier gets orders:create+update, manager gets orders:create+update+delete
- 25 Vitest tests pass covering createOrderSchema, updateOrderItemSchema, tableTransferSchema, voidOrderItemSchema, and RBAC
- `drizzle-kit push` succeeded, tables created in dev DB

## Task Commits

Each task was committed atomically:

1. **RED: Failing test file** - `91222ac` (test)
2. **GREEN: Schema + permissions implementation** - `ffb8fe8` (feat)

_REFACTOR: No code changes needed — TypeScript check passed on new files, drizzle-kit push succeeded._

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `src/db/schema/orders.ts` - 3 tables (orders, orderItems, orderItemModifiers) + 3 pgEnums (orderStatusEnum, orderTypeEnum, voidReasonEnum)
- `src/db/schema/index.ts` - Added orders schema re-export
- `src/db/relations.ts` - Added ordersRelations, orderItemsRelations, orderItemModifiersRelations
- `src/lib/permissions.ts` - Added orders resource to cashier (create, update) and manager (create, update, delete) roles
- `src/app/api/__tests__/orders.test.ts` - 25 tests covering ORDR-01 through ORDR-06 + RBAC

## Decisions Made

- Snapshot columns on `order_items` (`menuItemName`, `unitPrice`, `optionName` on modifiers) so order history is durable against menu changes
- `modifierOptionId` is nullable FK — if a modifier option is deleted, the order history is preserved via `optionName` snapshot
- `sentAt` is set at creation for Phase 3 kitchen display; null means not yet sent, non-null means sent (locking quantity changes)
- `manager:delete` maps to void capability — using delete action on orders resource to represent voiding, not hard deletes

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `drizzle-kit push` initially failed because `.env` not auto-loaded (drizzle.config.ts reads DATABASE_URL). Provided it as inline env var. Pre-existing TypeScript errors in `src/db/__tests__/` (brand-queries, location-queries, menu-queries) are unrelated to this plan and out of scope.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Schema is complete and tables exist in dev DB — Plan 02-02 (Order API) can begin immediately
- RBAC permissions are in place so order API routes will resolve correctly at 403 checks
- Test file serves as living documentation of all order business rule validations

---
*Phase: 02-order-flow-table-management*
*Completed: 2026-03-10*
