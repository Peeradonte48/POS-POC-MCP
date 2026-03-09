# Phase 02: Order Flow & Table Management - Research

**Researched:** 2026-03-10
**Domain:** POS order lifecycle, Drizzle ORM schema design, React Query optimistic mutations, Next.js App Router API routes
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Order Lifecycle & Status**
- Send immediately on "Send to Kitchen" — no draft state in DB. The order panel IS the draft (client-side). One tap persists + sends
- Orders support multiple rounds — staff can add items to an existing table order. New items sent as a separate round to kitchen
- Simple status model: order is "open" or "completed". Individual items track kitchen status separately (Phase 3)
- Order locks after payment — stays open and editable until bill is fully paid
- All orders (table and counter) get a daily auto-incrementing order number

**Counter/Takeaway Ordering**
- Counter and takeaway are the same flow, just a label difference. Both get a queue number. Takeaway gets a "Takeaway" tag on the ticket
- Order numbers reset daily, starting at 1. Customer-facing — prominently displayed on receipt and kitchen ticket
- The /tables page already has a "Takeaway" button — counter orders skip table assignment

**Void & Cancellation Rules**
- Predefined void reasons (customer changed mind, wrong item, food quality, staff error) with optional free-text note
- No time limit on voids — any open order item can be voided anytime before payment
- Unsent items can be freely removed by cashiers without manager authorization
- Sent items require manager PIN authorization to void (inline popup, decided in Phase 1)
- Both full order void and individual item void are supported

**Order Editing Behavior**
- Sent items cannot have quantity changed — only add new items or void existing ones
- Unsent items are freely editable (add, remove, change quantity, modify notes)
- "Send to Kitchen" sends ALL unsent items in one batch — no selective sending
- Order panel groups items: sent items at top (muted styling, "Sent" label), new/unsent items below ("New items" label)
- Table transfer moves entire order to new table — old table becomes free

**Table Status & Visual Indicators**
- 3 table states: free (green), occupied (warm/amber), needs attention (red)
- Occupied tables show order total (e.g., "฿450") and time elapsed (e.g., "25 min")
- Tapping an occupied table navigates to /menu with the existing order pre-loaded in the order panel

**Order History**
- Simple order history list accessible from /tables page via "Order History" button in header
- Shows today's completed orders
- Useful for reprinting receipts and checking past orders

**Multi-Staff Access**
- No table locking — any staff at the location can open a table and add items
- Each order item tracks which staff member added it (stored in DB, no extra UI needed)

### Claude's Discretion
- Database schema design for orders, order items, rounds
- Order API route structure
- Loading and error states for order operations
- Exact table card sizing and responsive behavior
- Order history list design and filtering

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ORDR-01 | Staff can create orders by adding items with modifiers and quantities | Schema design (orders + order_items), POST /api/orders, order panel mutation |
| ORDR-02 | Staff can edit orders (change quantity, remove items, add notes) before sending | Unsent-item edit flow in order panel; quantity/remove only for unsent items |
| ORDR-03 | Staff can assign orders to tables for table service | tableId FK on orders, table status query, /tables page integration |
| ORDR-04 | Staff can transfer orders between tables without losing data | PATCH /api/orders/:id with tableId update, atomic reassignment |
| ORDR-05 | Staff can create counter/queue orders with auto-incrementing order numbers | daily_order_number column with per-location-per-day sequence logic |
| ORDR-06 | Staff can void items or entire orders with manager authorization and reason tracking | void_reason enum, manager PIN check, voidedAt timestamp, voided items kept in DB |
</phase_requirements>

---

## Summary

Phase 2 connects the existing client-side POS UI to a persistent order backend. The core data model challenge is designing `orders` and `order_items` tables that support: multi-round ordering (each "Send to Kitchen" is a new round), sent/unsent item states, void tracking with reason and auth, and daily auto-incrementing order numbers scoped to location.

The existing code gives a clean foundation: React Query pattern from `use-menu.ts`, the `requireAuth` helper in `api-utils.ts`, Drizzle ORM with `brandId`/`locationId` scoping across all tables. The order panel component already handles client-side state — the work is wiring it to persistent API calls via React Query mutations and adding round-aware display logic.

The most architecturally significant decision already made: there is no draft state in the database. The order only exists in the DB after "Send to Kitchen". This dramatically simplifies the schema — no `status: draft` needed, no draft-cleanup jobs. The order panel `useState` is the draft. On send, a single API call creates the order (if first round) or adds a new round (if subsequent send on existing order).

**Primary recommendation:** Design the schema first (orders, order_items with round number, void tracking), then build API routes following the established pattern, then wire the existing UI components with React Query mutations and optimistic updates.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Drizzle ORM | (existing, project-installed) | Schema definition, queries | Already established; pgEnum, pgTable, relations pattern in use |
| @tanstack/react-query | (existing) | Server state, mutations, cache | Already used in use-menu.ts; useMutation + invalidateQueries pattern |
| zod | (existing — used in tests) | API request validation | Established pattern from brands API validation tests |
| Next.js App Router | 16.1.6 | API routes, page routing | Already established |
| sonner | (existing) | Toast notifications on mutation results | Established in Phase 1 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| crypto.randomUUID() | native | Client-side temp IDs for optimistic UI | Assign temp IDs to new items before server confirmation |
| Intl.NumberFormat | native | Thai Baht formatting | Already in use for price display |
| date-fns or native Date | native Date preferred | Elapsed time calculation for table cards | "25 min" display on occupied tables |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Round number (integer on order_items) | Separate rounds table | Simpler queries, no joins; rounds are just a display grouping, not a first-class entity |
| Soft-delete via voidedAt timestamp | Hard delete | Void items must be kept for audit trail and kitchen display (Phase 3 KDS needs to show voided items) |
| Per-location sequence for order numbers | UUID or global sequence | User-facing requirement: "#12" format, resets daily |

**Installation:** No new dependencies required. All needed libraries are already installed.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── db/schema/
│   └── orders.ts              # orders + order_items tables, enums
├── app/api/orders/
│   ├── route.ts               # GET (list open orders), POST (create order)
│   └── [orderId]/
│       ├── route.ts           # GET (single order), PATCH (update/transfer)
│       └── items/
│           └── route.ts       # POST (add round), PATCH/:itemId (void item)
├── hooks/
│   └── use-order.ts           # React Query hooks: useOrder, useCreateOrder, useSendToKitchen, useVoidItem
├── components/pos/
│   ├── order-panel.tsx        # EXTEND: add sent/unsent grouping, round labels, void action
│   └── void-reason-dialog.tsx # NEW: manager PIN + reason selector
└── app/(pos)/
    ├── tables/page.tsx        # EXTEND: fetch table status, show total/elapsed
    └── menu/page.tsx          # EXTEND: load existing order on mount, wire mutations
```

### Pattern 1: Order Creation (First Send)
**What:** Client holds unsent items in useState. On "Send to Kitchen," POST to /api/orders with all items. Response returns order with id, orderNumber, round 1.
**When to use:** When `orderId` is null in menu page state (new order)
**Example:**
```typescript
// POST /api/orders
// Body:
{
  tableId: string | null,        // null for counter/takeaway
  orderType: "table" | "counter" | "takeaway",
  items: Array<{
    menuItemId: string,
    quantity: number,
    unitPrice: number,           // snapshot at time of order
    notes: string,
    selectedModifiers: Array<{
      modifierOptionId: string,
      optionName: string,
      priceAdjustment: number
    }>,
    addedByUserId: string
  }>
}
// Response:
{
  orderId: string,
  orderNumber: number,           // daily sequence: 1, 2, 3...
  roundNumber: 1,
  items: OrderItem[]
}
```

### Pattern 2: Adding a Round (Subsequent Send)
**What:** Order already exists in DB. Staff added new items (client-side). "Send to Kitchen" calls POST /api/orders/:id/items with only the unsent items. Server assigns next round number.
**When to use:** When `orderId` is not null and there are new unsent items
**Example:**
```typescript
// POST /api/orders/:orderId/items
// Body:
{
  items: Array<{ menuItemId, quantity, unitPrice, notes, selectedModifiers, addedByUserId }>
}
// Server: SELECT MAX(roundNumber) + 1 FROM order_items WHERE orderId = :orderId
// Response: { roundNumber: 2, items: OrderItem[] }
```

### Pattern 3: Table Status Query
**What:** /tables page fetches all tables for the location, joined with open orders to get status, total, and openedAt.
**When to use:** Every time /tables renders (React Query with short staleTime ~30s)
**Example:**
```typescript
// GET /api/tables
// Returns:
{
  tables: Array<{
    number: number,
    label: string,
    status: "free" | "occupied" | "needs_attention",
    orderId: string | null,
    orderTotal: number | null,
    openedAt: string | null    // ISO timestamp for elapsed time calc
  }>
}
```

### Pattern 4: Daily Order Number Sequence
**What:** Each location gets a sequence that resets daily. Use a single-row upsert into an `order_sequences` table or compute via SELECT COUNT + 1 within a transaction.
**When to use:** Every order creation
**Recommended approach:** Compute with SELECT + FOR UPDATE lock to avoid race conditions:
```typescript
// In a transaction:
const today = new Date().toISOString().split('T')[0]; // "2026-03-10"
const [{ count }] = await tx
  .select({ count: sql<number>`count(*)` })
  .from(orders)
  .where(and(
    eq(orders.locationId, locationId),
    sql`DATE(created_at) = ${today}`
  ));
const orderNumber = Number(count) + 1;
```

### Pattern 5: Manager PIN Void Authorization
**What:** Inline dialog (not page navigation). Staff selects void reason + optional note. Then enters manager PIN. Client POSTs to /api/auth/verify-pin to validate. On success, calls void endpoint.
**When to use:** Voiding sent items only. Unsent items are removed client-side with no auth.
**Example:**
```typescript
// POST /api/auth/verify-pin
// Body: { pin: string, requiredRole: "manager" | "admin" }
// Response: { valid: boolean, userId: string | null }

// POST /api/orders/:orderId/items/:itemId/void
// Body: { reason: VoidReason, note?: string, authorizedByUserId: string }
```

### Pattern 6: React Query Mutation + Cache Invalidation
**What:** Use useMutation for all write operations. On success, invalidate the order query so the panel re-renders with server state.
**When to use:** All order mutations (create, add items, void, transfer)
**Example:**
```typescript
// Source: established use-menu.ts pattern + React Query docs
const sendToKitchen = useMutation({
  mutationFn: (payload: SendPayload) =>
    fetch('/api/orders', { method: 'POST', body: JSON.stringify(payload) })
      .then(res => res.json()),
  onSuccess: (data) => {
    queryClient.setQueryData(['order', data.orderId], data);
    queryClient.invalidateQueries({ queryKey: ['tables'] });
    toast.success(`Order #${data.orderNumber} sent to kitchen`);
  },
  onError: () => {
    toast.error('Failed to send order. Please try again.');
  }
});
```

### Anti-Patterns to Avoid
- **Draft orders in DB:** Never persist an order until "Send to Kitchen." The panel is the draft. Persisting draft state adds cleanup complexity and corrupts order numbers.
- **Fetching full order in tables list:** Don't join all order items for the table grid. Fetch only the aggregate (total, openedAt) needed for the card display. Full order loads on table tap.
- **Allowing quantity changes on sent items:** Once an item has `sentAt` timestamp, the quantity field must be read-only. Only void + add new item is permitted.
- **Global daily sequence:** Order numbers must be scoped to `locationId`. A multi-location brand would have two "#1" orders otherwise.
- **Hard-deleting voided items:** Always soft-delete via `voidedAt` + `voidedReason`. Kitchen Phase 3 needs to show void events, and audit trail is a compliance concern.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Request body validation | Manual type checks | zod `.safeParse()` | Established pattern in tests; handles nested arrays cleanly |
| Daily sequence counting | Custom sequence table | COUNT(*) in transaction with FOR UPDATE | Sufficient for single-location POS; no external dep |
| Elapsed time display | Custom duration library | Native Date arithmetic | "25 min" is simple subtraction; date-fns overkill here |
| Manager PIN verification | Inline bcrypt check in void route | Separate /api/auth/verify-pin endpoint | Reusable for Phase 4 discount authorization; keeps void route clean |
| Optimistic UI for items | Manual state merging | React Query `setQueryData` on mutation success | Standard pattern; handles race conditions correctly |

**Key insight:** The order state machine is simpler than it looks. There are only two DB states (`open`, `completed`) and one soft-delete mechanism (`voidedAt`). Do not build a complex FSM.

---

## Common Pitfalls

### Pitfall 1: Race Condition on Daily Order Numbers
**What goes wrong:** Two simultaneous orders at the same location get the same daily number
**Why it happens:** COUNT(*) query without transaction isolation reads stale count
**How to avoid:** Wrap order creation in a Drizzle transaction. Use `db.transaction(async (tx) => { ... })` so the count + insert are atomic. For very high volume (not this use case), a sequence table with `ON CONFLICT DO UPDATE` would be needed.
**Warning signs:** Duplicate order numbers appearing in logs

### Pitfall 2: Permissions Not Updated for Cashiers
**What goes wrong:** Cashiers can't create or update orders because `permissions.ts` only grants cashiers `menu:read`
**Why it happens:** The permissions table was set up in Phase 1 without order operations for cashier role
**How to avoid:** Update permissions.ts to add `orders: ["create", "update"]` for cashier, and `orders: ["create", "update", "delete"]` for manager. This MUST be done before any order API routes work.
**Warning signs:** 403 responses on POST /api/orders from cashier session

### Pitfall 3: Stale Order State After Concurrent Staff Edits
**What goes wrong:** Two staff members have the same table order open. One sends a round. The other's panel doesn't reflect the new sent items.
**Why it happens:** React Query cache is per-client; no real-time sync
**How to avoid:** Set a short `staleTime` (15-30 seconds) on the order query so re-focusing the tab re-fetches. Add `refetchOnWindowFocus: true` to the order query. (Full real-time sync is Phase 3 WebSocket territory — don't implement now.)
**Warning signs:** Panel shows different state than DB after concurrent edits

### Pitfall 4: Table ID as a Number vs. Entity
**What goes wrong:** Currently tables are just numbers derived from `location.settings.tableCount`. Phase 2 needs to associate orders with tables, but there's no `tables` DB entity.
**Why it happens:** Phase 1 stored tables as a count, not as rows
**How to avoid:** Two valid approaches: (a) Keep tables as numbers, store `tableNumber integer` on the orders table — simple and consistent with current API, (b) Create a `tables` table with rows — needed for Phase 6 visual table map. Recommend option (a) for Phase 2 since UIUX-06 (visual table map) is deferred to v2. Store `tableNumber` as an integer on orders.
**Warning signs:** Over-engineering if you create a tables entity now

### Pitfall 5: Order Panel State Split Between Client and Server
**What goes wrong:** Menu page holds unsent items in useState, but loaded order comes from React Query. These two sources can diverge.
**Why it happens:** Design conflict between "panel is the draft" and "server state loaded into panel"
**How to avoid:** Keep a clear separation: `pendingItems` (useState, client-only, cleared on send) and `serverOrder` (React Query, loaded from DB). The panel renders `[...serverOrder.items, ...pendingItems]`. On "Send to Kitchen," move pendingItems to server, then clear pendingItems and let React Query handle server state. Never merge them into one array.
**Warning signs:** Duplicate items appearing after send, or pending items lost on re-render

### Pitfall 6: Missing brandId Scope on Order Queries
**What goes wrong:** An API route returns orders across brands if locationId is shared or if query forgets brandId filter
**Why it happens:** Drizzle queries are easy to write without all required WHERE clauses
**How to avoid:** All order queries MUST include `where(and(eq(orders.brandId, session.brandId), eq(orders.locationId, session.locationId)))`. Add a utility function `orderScope(session)` that returns this base condition.
**Warning signs:** Orders from other brands appearing in list

---

## Code Examples

Verified patterns from official sources and established project code:

### Drizzle Schema: orders table
```typescript
// Source: established pattern from src/db/schema/menu.ts + brands.ts
import { pgTable, pgEnum, uuid, varchar, integer, decimal, timestamp, text } from "drizzle-orm/pg-core";
import { brands } from "./brands";
import { locations } from "./locations";
import { users } from "./users";

export const orderStatusEnum = pgEnum("order_status", ["open", "completed"]);
export const orderTypeEnum = pgEnum("order_type", ["table", "counter", "takeaway"]);
export const voidReasonEnum = pgEnum("void_reason", [
  "customer_changed_mind",
  "wrong_item",
  "food_quality",
  "staff_error",
  "other"
]);

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").notNull().references(() => brands.id),
  locationId: uuid("location_id").notNull().references(() => locations.id),
  tableNumber: integer("table_number"),           // null for counter/takeaway
  orderType: orderTypeEnum("order_type").notNull().default("table"),
  status: orderStatusEnum("status").notNull().default("open"),
  orderNumber: integer("order_number").notNull(),  // daily sequence per location
  openedAt: timestamp("opened_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  createdByUserId: uuid("created_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### Drizzle Schema: order_items table
```typescript
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id),
  menuItemId: uuid("menu_item_id").notNull().references(() => menuItems.id),
  menuItemName: varchar("menu_item_name", { length: 255 }).notNull(), // snapshot
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(), // snapshot
  quantity: integer("quantity").notNull().default(1),
  notes: text("notes"),
  roundNumber: integer("round_number").notNull().default(1),
  sentAt: timestamp("sent_at"),                   // null = unsent (should not exist in DB per design — all items are sent on creation, but kept for Phase 3 kitchen status)
  voidedAt: timestamp("voided_at"),               // null = active
  voidReason: voidReasonEnum("void_reason"),
  voidNote: text("void_note"),
  voidedByUserId: uuid("voided_by_user_id").references(() => users.id),
  addedByUserId: uuid("added_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### Drizzle Schema: order_item_modifiers table
```typescript
// Separate table to snapshot modifier selections at time of order
export const orderItemModifiers = pgTable("order_item_modifiers", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderItemId: uuid("order_item_id").notNull().references(() => orderItems.id),
  modifierOptionId: uuid("modifier_option_id").references(() => modifierOptions.id),
  optionName: varchar("option_name", { length: 255 }).notNull(), // snapshot
  priceAdjustment: decimal("price_adjustment", { precision: 10, scale: 2 }).notNull().default("0"),
});
```

### API Route Pattern (follows established project pattern)
```typescript
// Source: follows src/app/api/menu/route.ts and src/lib/api-utils.ts patterns
// POST /api/orders
export async function POST(request: NextRequest) {
  const { session, error } = await requireAuth(request, "orders", "create");
  if (error) return error;

  const body = await request.json();
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const order = await db.transaction(async (tx) => {
    // Daily order number — scoped to location
    const today = new Date().toISOString().split('T')[0];
    const [{ count }] = await tx
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(
        eq(orders.locationId, session.locationId),
        sql`DATE(created_at AT TIME ZONE 'Asia/Bangkok') = ${today}`
      ));
    const orderNumber = Number(count) + 1;

    const [newOrder] = await tx.insert(orders).values({
      brandId: session.brandId,
      locationId: session.locationId,
      tableNumber: parsed.data.tableNumber ?? null,
      orderType: parsed.data.orderType,
      orderNumber,
      createdByUserId: session.userId,
    }).returning();

    // Insert items + modifiers...
    return newOrder;
  });

  return NextResponse.json(order, { status: 201 });
}
```

### React Query Hook Pattern (follows use-menu.ts)
```typescript
// Source: established use-menu.ts pattern
export function useOrder(orderId: string | null) {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) throw new Error("Failed to fetch order");
      return res.json() as Promise<OrderWithItems>;
    },
    enabled: !!orderId,
    staleTime: 15 * 1000,       // 15 seconds — balance freshness vs. perf
    refetchOnWindowFocus: true,
  });
}

export function useSendToKitchen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrderPayload | AddRoundPayload) => {
      if ('orderId' in payload) {
        return fetch(`/api/orders/${payload.orderId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).then(r => r.json());
      }
      return fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(r => r.json());
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['order', data.orderId], data);
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });
}
```

### Table Status with Elapsed Time
```typescript
// Source: native Date API — no library needed
function getElapsedMinutes(openedAt: string): string {
  const elapsed = Math.floor((Date.now() - new Date(openedAt).getTime()) / 60000);
  if (elapsed < 1) return "< 1 min";
  if (elapsed < 60) return `${elapsed} min`;
  const hours = Math.floor(elapsed / 60);
  const mins = elapsed % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| useState for server data | React Query (useMutation, useQuery) | ~2021-2022 | Cache invalidation, loading states, error handling built-in |
| Manual fetch in useEffect | useQuery with queryFn | ~2021 | Already adopted in this project (use-menu.ts) |
| Separate draft table in DB | Client-side draft (panel = draft) | Project decision | Eliminates cleanup jobs, simplifies schema, keeps order numbers accurate |

**Deprecated/outdated:**
- `useEffect` + `useState` for data fetching: The project already uses React Query — do not introduce `useEffect`-based fetching for orders.
- Page-level table fetch in `/tables/page.tsx` uses raw `useEffect` + `fetch` (not React Query). This is a legacy pattern from Phase 1 — Phase 2 should convert this page to React Query via `useQuery`.

---

## Open Questions

1. **Thailand timezone for daily order number reset**
   - What we know: PostgreSQL stores timestamps in UTC. "Today" for order number reset should be based on Bangkok time (UTC+7), not UTC.
   - What's unclear: Whether `DATE(created_at AT TIME ZONE 'Asia/Bangkok')` performs well under index; whether Postgres is configured with correct timezone
   - Recommendation: Use `DATE(created_at AT TIME ZONE 'Asia/Bangkok') = current_date AT TIME ZONE 'Asia/Bangkok'` in the sequence query. Low volume (one restaurant location), so performance is not a concern.

2. **"Needs attention" table state trigger**
   - What we know: Three table states exist: free, occupied, needs_attention (red)
   - What's unclear: What triggers "needs attention"? Time threshold (e.g., >2 hours)? Manual flag? Phase 3 kitchen status? The CONTEXT.md defines the visual but not the trigger.
   - Recommendation: For Phase 2, implement only free/occupied. Reserve needs_attention as a placeholder returned when order is older than a configurable threshold (default: 90 minutes). This can be refined in Phase 3 when kitchen status is available.

3. **Order panel state management when navigating away and back**
   - What we know: Tapping an occupied table loads `/menu?table=3`. The order must be pre-loaded.
   - What's unclear: The current menu page uses URL param `?table=3` — but there's no `orderId` in the URL. The page needs to look up the open order for that table.
   - Recommendation: On menu page mount, if `tableParam` is set (not takeaway), call `GET /api/orders/active?tableNumber=3`. This returns the active order or null. Store `orderId` in state. Load order via `useOrder(orderId)`.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x |
| Config file | `vitest.config.ts` (exists) |
| Quick run command | `npx vitest run src/app/api/__tests__/` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ORDR-01 | Order creation schema validation (required fields, types) | unit | `npx vitest run src/app/api/__tests__/orders.test.ts` | ❌ Wave 0 |
| ORDR-01 | Order number increments correctly per location per day | unit | `npx vitest run src/app/api/__tests__/orders.test.ts` | ❌ Wave 0 |
| ORDR-02 | Unsent item edit: quantity change allowed | unit | `npx vitest run src/app/api/__tests__/orders.test.ts` | ❌ Wave 0 |
| ORDR-02 | Sent item edit: quantity change rejected (only void allowed) | unit | `npx vitest run src/app/api/__tests__/orders.test.ts` | ❌ Wave 0 |
| ORDR-04 | Table transfer: orderId retains all items, old table freed | unit | `npx vitest run src/app/api/__tests__/orders.test.ts` | ❌ Wave 0 |
| ORDR-05 | Counter order: orderType = "counter", no tableNumber | unit | `npx vitest run src/app/api/__tests__/orders.test.ts` | ❌ Wave 0 |
| ORDR-06 | Void unsent item: succeeds without manager auth | unit | `npx vitest run src/app/api/__tests__/orders.test.ts` | ❌ Wave 0 |
| ORDR-06 | Void sent item: requires authorizedByUserId | unit | `npx vitest run src/app/api/__tests__/orders.test.ts` | ❌ Wave 0 |
| ORDR-06 | Void reason enum: invalid reason rejected | unit | `npx vitest run src/app/api/__tests__/orders.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/app/api/__tests__/orders.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/app/api/__tests__/orders.test.ts` — covers ORDR-01 through ORDR-06 (zod schema validation tests, business rule tests)
- [ ] No additional framework setup needed — vitest.config.ts exists and is configured

*(Following the established pattern from `src/app/api/__tests__/brands.test.ts`: test zod schemas and business logic, not DB queries)*

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `src/db/schema/menu.ts`, `brands.ts`, `locations.ts`, `users.ts` — established Drizzle schema patterns
- Direct code inspection: `src/app/api/menu/route.ts`, `src/app/api/tables/route.ts` — established API route patterns
- Direct code inspection: `src/hooks/use-menu.ts` — React Query pattern in use
- Direct code inspection: `src/lib/api-utils.ts`, `src/lib/permissions.ts` — auth and permission helpers
- Direct code inspection: `src/app/(pos)/menu/page.tsx`, `src/components/pos/order-panel.tsx` — existing UI components to extend
- Direct code inspection: `vitest.config.ts`, `src/app/api/__tests__/brands.test.ts` — test infrastructure

### Secondary (MEDIUM confidence)
- Drizzle ORM transaction API — `db.transaction(async (tx) => { ... })` is the documented Drizzle pattern for atomic operations
- React Query `useMutation` + `invalidateQueries` pattern — standard and documented

### Tertiary (LOW confidence)
- PostgreSQL timezone handling for daily sequences — standard SQL but specific behavior of `AT TIME ZONE` in Drizzle raw SQL context not verified against Drizzle docs directly

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and in use; no new dependencies
- Architecture: HIGH — patterns derived directly from existing project code
- Pitfalls: HIGH (permissions gap, table-as-number) / MEDIUM (timezone, concurrent edits)
- Schema design: HIGH — follows established Drizzle patterns exactly

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable stack; 30-day window)
