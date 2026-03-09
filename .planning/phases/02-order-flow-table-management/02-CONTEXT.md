# Phase 2: Order Flow & Table Management - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Staff can create, persist, edit, and manage orders for both table service and counter/takeaway service. Includes order lifecycle (create, send, add rounds, complete), table transfers, void/cancellation with manager authorization, and order history. Kitchen display and billing are separate phases — this phase focuses on the order data model and POS-side order management.

Requirements: ORDR-01, ORDR-02, ORDR-03, ORDR-04, ORDR-05, ORDR-06

</domain>

<decisions>
## Implementation Decisions

### Order Lifecycle & Status
- Send immediately on "Send to Kitchen" — no draft state in DB. The order panel IS the draft (client-side). One tap persists + sends
- Orders support multiple rounds — staff can add items to an existing table order. New items sent as a separate round to kitchen
- Simple status model: order is "open" or "completed". Individual items track kitchen status separately (Phase 3)
- Order locks after payment — stays open and editable until bill is fully paid
- All orders (table and counter) get a daily auto-incrementing order number

### Counter/Takeaway Ordering
- Counter and takeaway are the same flow, just a label difference. Both get a queue number. Takeaway gets a "Takeaway" tag on the ticket
- Order numbers reset daily, starting at 1. Customer-facing — prominently displayed on receipt and kitchen ticket
- The /tables page already has a "Takeaway" button — counter orders skip table assignment

### Void & Cancellation Rules
- Predefined void reasons (customer changed mind, wrong item, food quality, staff error) with optional free-text note
- No time limit on voids — any open order item can be voided anytime before payment
- Unsent items can be freely removed by cashiers without manager authorization
- Sent items require manager PIN authorization to void (inline popup, decided in Phase 1)
- Both full order void and individual item void are supported

### Order Editing Behavior
- Sent items cannot have quantity changed — only add new items or void existing ones
- Unsent items are freely editable (add, remove, change quantity, modify notes)
- "Send to Kitchen" sends ALL unsent items in one batch — no selective sending
- Order panel groups items: sent items at top (muted styling, "Sent" label), new/unsent items below ("New items" label)
- Table transfer moves entire order to new table — old table becomes free

### Table Status & Visual Indicators
- 3 table states: free (green), occupied (warm/amber), needs attention (red)
- Occupied tables show order total (e.g., "฿450") and time elapsed (e.g., "25 min")
- Tapping an occupied table navigates to /menu with the existing order pre-loaded in the order panel

### Order History
- Simple order history list accessible from /tables page via "Order History" button in header
- Shows today's completed orders
- Useful for reprinting receipts and checking past orders

### Multi-Staff Access
- No table locking — any staff at the location can open a table and add items
- Each order item tracks which staff member added it (stored in DB, no extra UI needed)

### Claude's Discretion
- Database schema design for orders, order items, rounds
- Order API route structure
- Loading and error states for order operations
- Exact table card sizing and responsive behavior
- Order history list design and filtering

</decisions>

<specifics>
## Specific Ideas

- Round-based ordering: each "Send to Kitchen" creates a new round. Rounds are visible as groups in the order panel
- Table grid should be glanceable — color + summary info visible without tapping
- "Send to Kitchen" button changes label/behavior based on context: if no unsent items, show as disabled; if there are unsent items, show item count like "Send 3 items"
- Order numbers format: just the number (e.g., "#12"), not padded zeros

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/pos/order-panel.tsx`: Current client-side order panel with quantity controls, modifier display, notes, running subtotal. Needs to be extended with sent/unsent grouping and round support
- `src/components/pos/modifier-sheet.tsx`: Bottom sheet for item selection with modifiers, quantity, notes. Can be reused as-is
- `src/app/(pos)/tables/page.tsx`: Table selection page with responsive grid. Needs to be enhanced with table status colors, order totals, and time elapsed
- `src/app/(pos)/menu/page.tsx`: Three-column layout with order state management. Currently all client-side — needs to integrate with order API
- `src/hooks/use-menu.ts`: React Query pattern for data fetching. Same pattern for useOrder hook
- `src/lib/api-utils.ts`: requireAuth() helper for API route authentication
- `src/lib/auth.ts`: verifySession() for JWT verification, used by API routes

### Established Patterns
- React Query for data fetching (staleTime-based caching)
- Drizzle ORM for database queries with shared-schema multi-tenancy (brandId/locationId scoping)
- shadcn/ui components with base-ui render prop pattern (not asChild)
- sonner for toast notifications
- Thai Baht formatting via Intl.NumberFormat('th-TH', {style: 'currency', currency: 'THB'})
- Tablet-responsive: floating cart pattern on small screens, inline panel on large screens

### Integration Points
- `src/db/schema/` — Need new order/order_items tables referencing existing menu_items, users, locations
- `src/app/api/` — New order API routes following existing pattern (auth check, brand scoping)
- `src/app/(pos)/menu/page.tsx` — Order state moves from client-side useState to server-persisted with React Query
- `src/app/(pos)/tables/page.tsx` — Needs to fetch table status from API instead of static list

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-order-flow-table-management*
*Context gathered: 2026-03-10*
