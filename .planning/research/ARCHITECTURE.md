# Architecture Patterns

**Domain:** Multi-brand restaurant POS platform
**Researched:** 2026-03-09
**Confidence:** MEDIUM (based on established POS/hospitality architecture patterns from training data; no web search available for verification)

## Recommended Architecture

### High-Level Overview

```
+---------------------------------------------------+
|                  CLIENT TIER                       |
|  +-------------+  +-------------+  +----------+   |
|  | Cashier App |  | Server App  |  | KDS App  |   |
|  | (Desktop)   |  | (Tablet)    |  | (Screen) |   |
|  +------+------+  +------+------+  +-----+----+   |
|         |                |               |         |
+---------|----------------|---------------|----------+
          |                |               |
     HTTPS/WSS        HTTPS/WSS       WSS (real-time)
          |                |               |
+---------|----------------|---------------|----------+
|                  API TIER                          |
|  +---------------------------------------------+  |
|  |              API Gateway / BFF              |  |
|  |  (Next.js API Routes or standalone server)  |  |
|  +-----+-------+-------+-------+-------+------+  |
|        |       |       |       |       |          |
|  +-----+--+ +--+---+ +-+----+ +--+--+ +--+---+  |
|  | Order   | |Menu  | |Table | |Pay- | |Report|  |
|  | Service | |Svc   | |Svc   | |ment | |Svc   |  |
|  +---------+ +------+ +------+ +-----+ +------+  |
|                                                    |
|  +---------------------------------------------+  |
|  |         WebSocket Hub (Real-time)           |  |
|  +---------------------------------------------+  |
+---------------------------------------------------+
          |                              |
+---------+----------+    +-------------+------------+
|   DATA TIER        |    |   EXTERNAL INTEGRATIONS  |
|  +------+  +----+  |    |  +-----+  +----------+  |
|  |Postgr|  |Redis|  |    |  | ERP |  | Payment  |  |
|  |  SQL  |  |    |  |    |  | API |  | Gateway  |  |
|  +------+  +----+  |    |  +-----+  +----------+  |
+--------------------+    +--------------------------+
```

### Architecture Style: Modular Monolith

**Use a modular monolith, not microservices.** This is a single-organization POS system, not a platform serving thousands of unrelated tenants. Microservices add network latency, operational complexity, and distributed transaction headaches that directly conflict with the "sub-second response" requirement. A modular monolith keeps all domain logic in one deployable unit while maintaining clean module boundaries that can be split later if needed.

The "multi-brand" requirement is handled via tenant-scoped data (brand_id on every query), not separate service instances.

---

## Component Boundaries

| Component | Responsibility | Communicates With | Protocol |
|-----------|---------------|-------------------|----------|
| **Cashier UI** | Order entry, payment processing, bill management (desktop terminals) | API Gateway | HTTPS + WSS |
| **Server UI** | Table-side order taking, table status view (tablets) | API Gateway | HTTPS + WSS |
| **KDS UI** | Display incoming orders, mark items ready, bump orders | WebSocket Hub | WSS (primary), HTTPS (fallback) |
| **API Gateway** | Authentication, brand resolution, request routing, rate limiting | All backend modules | Internal function calls |
| **Order Module** | Order lifecycle: create, modify, submit, complete, cancel | Menu Module, Table Module, Kitchen Module, Payment Module | Internal |
| **Menu Module** | Menu items, categories, modifiers, pricing, availability | ERP Sync Module | Internal |
| **Table Module** | Table layout, assignment, transfer, merge/split | Order Module | Internal |
| **Kitchen Module** | Route orders to KDS/printer, track preparation status | WebSocket Hub, Printer Service | Internal + WSS |
| **Payment Module** | Cash, card, QR payment processing, split/merge bills | External Payment Gateways | HTTPS |
| **Promotion Module** | Voucher/coupon validation, discount calculation | Order Module | Internal |
| **Reporting Module** | Daily summaries, per-item sales, end-of-day | Order Module, Payment Module | Internal |
| **ERP Sync Module** | Bidirectional sync: pull menu/pricing, push sales/inventory | External ERP API | HTTPS (scheduled + event-driven) |
| **WebSocket Hub** | Real-time event broadcast to KDS, status updates to all UIs | All connected clients | WSS |
| **Printer Service** | Thermal printer communication, receipt/kitchen ticket formatting | Physical printers | USB/Network/Bluetooth |

---

## Data Flow

### 1. Order Flow (Table Service)

```
Server (tablet)
  |
  +--> [Create Order] --> Order Module
  |                         |
  |                    assigns to table
  |                         |
  +--> [Add Items] -------> Order Module
  |                         |
  |                    validates menu items + modifiers
  |                    calculates prices
  |                    applies promotions
  |                         |
  +--> [Submit to Kitchen] -> Kitchen Module
                               |
                          +----+----+
                          |         |
                       KDS via    Printer
                       WebSocket  Service
                          |         |
                       KDS UI    Kitchen
                       (screen)  (ticket)
```

### 2. Order Flow (Counter Service)

```
Cashier (terminal)
  |
  +--> [Create Order] --> Order Module (no table assignment)
  |                         |
  +--> [Add Items] -------> Order Module
  |                         |
  +--> [Submit + Pay] ----> Kitchen Module + Payment Module
                               |                |
                            KDS/Printer     Process payment
                               |                |
                          Queue number      Receipt
                          displayed         printed
```

### 3. Payment Flow

```
Cashier/Server UI
  |
  +--> [Request Bill] --> Order Module --> calculate total
  |                                          |
  |                                     apply promotions
  |                                          |
  +--> [Split/Merge] --> Bill adjustments    |
  |                                          |
  +--> [Select Payment Method]               |
         |          |           |             |
       Cash     Card API    QR Payment       |
         |          |           |             |
       Record   Gateway     Gateway          |
         |          |           |             |
         +----------+-----------+             |
                    |                         |
              Payment Module                  |
                    |                         |
              Mark order paid                 |
                    |                         |
              Print receipt                   |
                    |                         |
              ERP Sync (async) -----> ERP API
```

### 4. Real-Time Event Flow

```
Order Module emits events:
  - order.created
  - order.item_added
  - order.submitted_to_kitchen
  - order.item_ready
  - order.completed
  - order.cancelled

WebSocket Hub broadcasts to relevant subscribers:
  - KDS screens: order.submitted_to_kitchen, order.item_ready
  - Server tablets: order.item_ready (notify waiter to serve)
  - Cashier terminals: order status changes
  - Table management: table status changes

Event structure:
{
  brand_id: "ramen-a",
  location_id: "loc-001",
  event: "order.submitted_to_kitchen",
  payload: { order_id, items: [...], table_number, timestamp },
  target_stations: ["kds-grill", "kds-drinks"]
}
```

### 5. ERP Sync Flow

```
ERP --> POS (Pull):
  - Menu items, categories, modifiers (scheduled poll or webhook)
  - Pricing updates
  - Inventory levels

POS --> ERP (Push):
  - Transaction records (after each payment)
  - Daily sales summaries (end-of-day batch)
  - Stock deductions (per-order ingredient usage)
  - Per-item sales data

Sync strategy:
  - Menu/pricing: Pull on app startup + periodic refresh (every 15 min)
  - Sales data: Push immediately after payment (async queue)
  - Daily summaries: Batch job at end-of-day
  - Inventory: Push per-order (async queue, retry on failure)
```

---

## Multi-Brand / Multi-Tenant Architecture

### Tenant Isolation Strategy: Shared Database, Brand-Scoped Rows

Use a single database with `brand_id` and `location_id` columns on every tenant-scoped table. This is the right choice because:

1. **Few tenants (brands under one org)** -- not thousands of unrelated customers
2. **Shared infrastructure reduces cost** -- one database, one deployment
3. **Cross-brand reporting is trivial** -- single query across brands
4. **Staff may work across brands** -- shared auth, role-based brand access

```
organization (top level)
  |
  +-- brand (A RAMEN, Brand B, Brand C...)
       |
       +-- location (physical restaurant)
            |
            +-- station (cashier terminal, KDS screen, server tablet)
```

### Key Schema Pattern

```sql
-- Every tenant-scoped table includes:
brand_id    UUID NOT NULL REFERENCES brands(id),
location_id UUID NOT NULL REFERENCES locations(id),

-- Composite indexes for query performance:
CREATE INDEX idx_orders_brand_location ON orders(brand_id, location_id, created_at);

-- Row-level security (PostgreSQL):
CREATE POLICY brand_isolation ON orders
  USING (brand_id = current_setting('app.current_brand_id')::uuid);
```

### Brand-Specific Configuration

```
brands table:
  - id, name, slug
  - theme (colors, logo, fonts)
  - receipt_template
  - tax_config (rate, included/excluded)
  - currency
  - kitchen_routing_config

locations table:
  - id, brand_id, name, address
  - table_layout_config
  - printer_config
  - kds_station_config
  - operating_hours
```

---

## Patterns to Follow

### Pattern 1: Optimistic UI for Order Entry

**What:** Client-side state updates immediately on user action; server confirms asynchronously.
**When:** Adding items to an order, modifying quantities, applying modifiers.
**Why:** Sub-second response requirement. Staff cannot wait for a round trip during rush hour.

```typescript
// Client: update local state immediately
function addItemToOrder(item: MenuItem) {
  // 1. Update local state (instant)
  dispatch({ type: 'ADD_ITEM', item });

  // 2. Send to server (async)
  api.addOrderItem(orderId, item.id)
    .catch(() => {
      // 3. Rollback on failure
      dispatch({ type: 'REMOVE_ITEM', item });
      toast.error('Failed to add item');
    });
}
```

### Pattern 2: Event-Driven Kitchen Communication

**What:** Orders flow to kitchen via events, not polling. KDS subscribes to a WebSocket channel scoped to its station.
**When:** Every order submission, item status change, order bump.

```typescript
// Server: publish to relevant kitchen stations
function submitToKitchen(order: Order) {
  const routedItems = routeByStation(order.items, location.kitchenConfig);

  for (const [stationId, items] of routedItems) {
    wsHub.publish(`kitchen:${location.id}:${stationId}`, {
      event: 'new_order',
      orderId: order.id,
      items,
      table: order.tableNumber,
      timestamp: Date.now(),
    });

    // Also send to printer if station is configured for it
    if (station.hasPrinter) {
      printerService.printKitchenTicket(station.printerId, order, items);
    }
  }
}
```

### Pattern 3: Idempotent Payment Processing

**What:** Every payment request carries a unique idempotency key. Retry-safe by design.
**When:** All payment operations -- especially critical for card and QR payments.

```typescript
async function processPayment(billId: string, method: PaymentMethod, amount: number) {
  const idempotencyKey = `pay_${billId}_${method}_${Date.now()}`;

  const result = await paymentGateway.charge({
    idempotencyKey,
    amount,
    method,
    metadata: { billId, brandId, locationId },
  });

  // Record locally regardless of ERP sync status
  await db.payments.create({
    billId, amount, method,
    gatewayRef: result.reference,
    erpSynced: false,
  });

  // Async push to ERP (separate queue, retry on failure)
  erpSyncQueue.push({ type: 'payment', paymentId });
}
```

### Pattern 4: Kitchen Station Routing

**What:** Items route to specific kitchen stations based on category configuration per location.
**When:** Every order submission.

```typescript
// Location config maps menu categories to kitchen stations
const kitchenRouting = {
  "grill": ["ramen", "rice-bowls", "grilled-items"],
  "drinks": ["beverages", "desserts"],
  "prep": ["appetizers", "salads"],
};

// An order with ramen + a drink splits into two kitchen tickets
```

### Pattern 5: Printer as Fire-and-Forget with Retry

**What:** Thermal printer communication should not block the order flow. Print async, retry silently, alert on repeated failure.
**When:** Kitchen tickets, receipts.

```typescript
// Never let a printer failure block an order
async function printKitchenTicket(printerId: string, ticket: KitchenTicket) {
  try {
    await printer.print(printerId, formatTicket(ticket));
  } catch (error) {
    // Queue for retry, alert staff after 3 failures
    printQueue.enqueue({ printerId, ticket, retries: 0, maxRetries: 3 });
    logger.warn(`Printer ${printerId} failed, queued for retry`);
  }
}
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Synchronous ERP Calls in the Order Path

**What:** Calling the ERP API during order creation or payment processing.
**Why bad:** ERP downtime or slowness blocks the POS. Restaurant stops taking orders.
**Instead:** POS operates independently. Sync to ERP asynchronously via a background queue. POS is the source of truth for active orders; ERP is the source of truth for menu/pricing (pulled and cached locally).

### Anti-Pattern 2: Single WebSocket Channel for Everything

**What:** Broadcasting all events to all connected clients on one channel.
**Why bad:** KDS screens receive payment events they don't need. Cashier gets kitchen noise. Wastes bandwidth, causes unnecessary re-renders on tablets.
**Instead:** Channel-per-concern with subscription filtering: `kitchen:{locationId}:{stationId}`, `tables:{locationId}`, `payments:{locationId}`.

### Anti-Pattern 3: Storing Active Orders Only in Database

**What:** Every item add/remove during order building hits the database.
**Why bad:** Latency on every interaction. Database becomes bottleneck during rush.
**Instead:** Hold active (unpaid) orders in Redis or in-memory state. Persist to PostgreSQL on submission to kitchen and on payment. Active order count is small (dozens per location, not millions).

### Anti-Pattern 4: Device-Specific Codebases

**What:** Separate apps for tablet and desktop.
**Why bad:** Double the maintenance, diverging behavior, inconsistent UX.
**Instead:** Single responsive web app with adaptive layouts. Use CSS container queries and responsive breakpoints. Same codebase, different layout components triggered by viewport/device context.

### Anti-Pattern 5: Multi-Brand via Separate Deployments

**What:** Deploying a separate POS instance per brand.
**Why bad:** N deployments to maintain, no cross-brand visibility, wasted infrastructure.
**Instead:** Single deployment with brand-scoped data isolation (see Multi-Brand section above).

---

## Key Technical Decisions

### Real-Time Layer: WebSocket via Socket.IO or native WS

Use WebSocket for all real-time communication (KDS updates, order status, table status). HTTP polling is inadequate for kitchen display -- a 1-2 second delay on a new order appearing is unacceptable during rush.

**Recommendation:** Use Socket.IO with Redis adapter for horizontal scaling. It handles reconnection, room-based channels, and fallback to long-polling automatically. Rooms map naturally to `location:stationId` scoping.

### State Management: Server-Authoritative with Client Cache

- **Server** is the authority for order state, menu data, pricing
- **Client** caches aggressively for speed (menu items, table layouts)
- **Active orders** held in Redis for fast access, persisted to PostgreSQL on key transitions
- **React Query / TanStack Query** on the client for server state synchronization

### Printer Integration: Web-Based Approach

Thermal printers in web-based POS typically work via:
1. **Network printers (Epson TM series with ePOS SDK)** -- print via HTTP/WebSocket to printer's built-in server. Best option for web POS.
2. **Print server middleware** -- lightweight local agent that receives print jobs via HTTP and forwards to USB/Bluetooth printers.
3. **Browser print dialog** -- last resort, poor UX for kitchen tickets.

**Recommendation:** Target Epson ePOS-compatible network printers (industry standard for restaurants). For USB printers, use a lightweight print relay service running on the terminal.

### Authentication: Session-Based with PIN for Speed

Restaurant staff authenticate differently than typical web apps:
- **Manager login:** Username + password (standard)
- **Staff shift login:** 4-6 digit PIN on shared terminals (fast, during rush)
- **Session:** Tied to terminal + staff member, auto-timeout on inactivity

---

## Scalability Considerations

| Concern | 1 Location | 5 Locations | 20+ Locations |
|---------|------------|-------------|---------------|
| Database | Single PostgreSQL instance | Single instance, fine up to ~50 concurrent terminals | Read replicas for reporting, primary for writes |
| WebSocket | Single server handles all connections (~10-20 per location) | Single server still fine (~100 connections) | Redis adapter for multi-server WebSocket |
| Active Orders | In-memory or Redis, ~50 concurrent orders | Redis shared across locations | Redis cluster |
| ERP Sync | Direct API calls in background queue | Queue with rate limiting to avoid overwhelming ERP | Dedicated worker processes |
| Printer | Direct network connection per terminal | Same, printers are local per location | Same, printers don't scale centrally |
| Deployment | Single server | Single server, CDN for static assets | Load-balanced API servers, CDN, managed database |

---

## Suggested Build Order (Dependencies)

Phase ordering is driven by the dependency chain. You cannot test payments without orders, cannot test KDS without order submission, etc.

```
Phase 1: Foundation
  |- Database schema + multi-brand tenant model
  |- Auth system (manager + PIN login)
  |- Menu module (CRUD, categories, modifiers, brand-scoped)
  |- Basic API layer

Phase 2: Core Order Flow
  |- Order creation + item management
  |- Table management (layout, assignment)
  |- Counter order flow (no table)
  |- Promotion/voucher application
  (Depends on: Phase 1 menu + auth)

Phase 3: Kitchen Communication
  |- WebSocket hub
  |- KDS display UI
  |- Kitchen station routing
  |- Thermal printer integration
  (Depends on: Phase 2 order submission)

Phase 4: Payment + Billing
  |- Bill calculation (tax, discounts, service charge)
  |- Cash payment recording
  |- Card payment gateway integration
  |- QR/mobile payment integration
  |- Split bill / merge bill
  |- Receipt printing
  (Depends on: Phase 2 orders, Phase 3 printer service)

Phase 5: ERP Integration + Reporting
  |- Menu/pricing pull from ERP
  |- Sales data push to ERP
  |- Inventory deduction sync
  |- Daily sales reports + end-of-day
  (Depends on: Phase 4 completed payment flow)

Phase 6: Polish + Multi-Device
  |- Responsive tablet UI optimization
  |- Desktop terminal UI optimization
  |- Performance tuning (sub-second targets)
  |- Multi-brand theming
  (Parallel with Phases 3-5, but final polish here)
```

**Rationale for this ordering:**
1. Menu data is needed before orders can be created
2. Orders must exist before kitchen can display them
3. Payment requires completed orders with calculated totals
4. ERP sync requires payment data flowing to have anything to sync
5. Device optimization is continuous but final polish comes last

---

## Sources

- Architecture patterns derived from established restaurant POS system design (Toast, Square for Restaurants, Lightspeed Restaurant architecture patterns)
- Multi-tenant database patterns from PostgreSQL row-level security documentation
- WebSocket patterns from Socket.IO documentation and real-time application architecture
- Thermal printer integration patterns from Epson ePOS SDK documentation
- **Confidence note:** All recommendations based on training data. No live web search was available for verification. Core patterns (event-driven kitchen, optimistic UI, async ERP sync) are well-established in the hospitality POS domain.
