# Domain Pitfalls

**Domain:** Multi-brand restaurant POS platform (replacing FoodStory, Thailand market)
**Researched:** 2026-03-09
**Overall confidence:** MEDIUM (based on training data; web verification unavailable)

---

## Critical Pitfalls

Mistakes that cause rewrites, revenue loss, or failed deployments.

---

### Pitfall 1: No Offline/Degraded-Mode Strategy

**What goes wrong:** The project scope explicitly marks offline mode as "out of scope for v1," but internet connections in Thai restaurant locations (especially malls, food courts, older buildings) drop regularly. When the POS cannot reach the backend, the entire restaurant stops taking orders and processing payments. Even 30 seconds of downtime during a lunch rush creates chaos -- orders pile up verbally, payments can't be processed, and the staff loses trust in the system.

**Why it happens:** Developers assume "reliable connection" means the network never drops. In reality, WiFi routers reboot, ISPs have micro-outages, and API servers occasionally lag. The difference between "offline mode" (full local DB sync) and "degraded mode" (queue operations for 2-5 minutes) is enormous in complexity, but the latter is essential.

**Consequences:** Staff revert to manual processes or demand FoodStory be kept as backup. The POS never fully replaces FoodStory because nobody trusts it during peak hours.

**Warning signs:**
- No discussion of what happens when an API call times out
- No local state management strategy for in-flight orders
- Payment flow assumes synchronous server round-trip
- Testing only happens on developer WiFi (fast, stable)

**Prevention:**
- Implement a "degraded mode" even if full offline is out of scope: orders are created and managed locally (optimistic UI), synced to server when available. This is NOT full offline mode -- it is resilient state management.
- Use optimistic updates with a local queue for all order mutations. If the server is unreachable for < 5 minutes, the POS continues working and syncs when reconnected.
- Cash payments can be recorded locally and synced. Card/QR payments genuinely need connectivity, so show a clear "payment unavailable, network issue" message rather than a cryptic spinner.
- Add a network status indicator to the POS UI so staff know immediately.

**Detection:** Test by throttling network to 500ms+ latency and dropping connections mid-order flow. If the app freezes or shows errors, this pitfall is active.

**Phase relevance:** Must be addressed in the core order flow phase (Phase 1/2). Retrofitting resilience into a synchronous architecture is a rewrite.

---

### Pitfall 2: Treating Thermal Printers as Simple Output Devices

**What goes wrong:** Web-based POS systems cannot natively print to thermal printers. ESC/POS commands (the thermal printer protocol) require binary data sent over USB, serial, or network sockets -- none of which are accessible from a browser tab. Teams discover this late and end up with one of several bad solutions: forcing staff to use the browser print dialog (slow, wrong format), building an Electron wrapper just for printing (heavy), or buying expensive cloud-print hardware.

**Why it happens:** Web developers think "printing" means `window.print()`. Thermal receipt/kitchen printers speak ESC/POS binary protocol over raw TCP (port 9100), USB, or serial. Browser security sandboxing blocks all of these.

**Consequences:** Kitchen tickets don't print reliably. Staff miss orders. During rush, a 5-second print delay per order cascades into chaos. This single issue has killed POS replacement projects.

**Warning signs:**
- No spike/prototype for printing in the first 2 weeks
- Assuming `window.print()` or CSS `@media print` will work for kitchen tickets
- No discussion of print server architecture
- No hardware purchased for testing during development

**Prevention:**
- Accept that a **local print relay agent** is required. This is a small background service (Node.js, Go, or Python) running on each POS terminal that receives print jobs via localhost HTTP/WebSocket and sends ESC/POS commands to connected printers.
- Alternatively, use **network thermal printers** (Epson TM-T82X, Star TSP143IV) that accept raw TCP on port 9100. The print relay sends data directly to the printer's IP address.
- Evaluate existing solutions: `node-escpos`, `node-thermal-printer`, or Epson's ePOS SDK for JavaScript (works with Epson network printers directly from the browser via their WebSocket API).
- Prototype printing in Week 1. Buy the actual thermal printer hardware immediately.
- Design print jobs as templates (receipt template, kitchen ticket template) with a rendering layer that outputs ESC/POS binary, not HTML.

**Detection:** If printing hasn't been prototyped on real hardware by the end of Phase 1, this is a major risk.

**Phase relevance:** Must be spiked/prototyped in Phase 1. Full implementation in the kitchen/printing phase. Do NOT defer printer architecture decisions.

---

### Pitfall 3: Ignoring Order State Machine Complexity

**What goes wrong:** Orders in a restaurant POS are not simple CRUD entities. They have complex state transitions: draft -> placed -> acknowledged (by kitchen) -> preparing -> item-ready -> partially-served -> fully-served -> billed -> paid -> closed. Items within an order have their own states. Modifiers, voids, comps, and splits add branching. Teams model orders as simple objects with a `status` string field and end up with impossible states, lost items, and billing errors.

**Why it happens:** Initial prototyping uses a simple `status` field. It works for the happy path. Then edge cases accumulate: "What if a customer adds items after the kitchen acknowledged? What if one item is voided after the ticket printed? What if the bill is split but one person hasn't paid?" Each edge case gets an ad-hoc fix until the order model is an unmaintainable mess.

**Consequences:** Lost orders (items sent to kitchen but not on bill), double charges, incorrect kitchen tickets on modifications, inability to implement split/merge bills cleanly. Staff workaround by voiding and re-entering orders, which corrupts reporting data.

**Warning signs:**
- Order model has a single `status: string` field
- No state transition diagram exists
- "We'll handle edge cases later" in planning
- Split bill and merge bill treated as simple features

**Prevention:**
- Model orders as a **finite state machine** from day one. Use a library like XState or implement a simple state machine with explicit transitions and guards.
- Separate **order-level state** from **item-level state**. An order can be "partially served" because individual items have their own lifecycle.
- Model bill splitting as a first-class concept in the data model, not a UI hack. A bill is a projection of order items, not the order itself. Multiple bills can reference items from the same order (split) or items from multiple orders (merge).
- Document every state transition with: trigger, guard conditions, side effects (print ticket, notify KDS, update ERP).
- Include void/comp as explicit transitions with required reason codes (for reporting accuracy).

**Detection:** Ask "what happens if a customer adds an item to an order that's already been sent to the kitchen?" If the answer involves `if/else` chains rather than state transitions, this pitfall is active.

**Phase relevance:** Must be designed in Phase 1 (data model), implemented in Phase 2 (order flow). Cannot be retrofitted.

---

### Pitfall 4: Thailand Payment Integration Underestimation

**What goes wrong:** Thailand's payment landscape is unique. PromptPay (via QR code) is the dominant electronic payment method, not credit cards. Integration requires working with Thai payment gateways (2C2P, Omise/Opn Payments, SCB Payment Gateway, KBank KPLUS) that have their own SDKs, certification processes, and settlement quirks. Teams assume "just integrate Stripe" and discover Stripe's Thailand support is limited, PromptPay requires specific flows, and LINE Pay/TrueMoney have their own OAuth-based integrations.

**Why it happens:** Developers experienced with Western payment systems expect a single unified API. Thailand's ecosystem is fragmented: PromptPay goes through bank APIs or aggregators, credit cards go through 2C2P or Omise, LINE Pay has its own SDK, TrueMoney has its own API. Each has different settlement periods, webhook formats, and error handling.

**Consequences:** Payment integration takes 3-4x longer than estimated. Settlement reconciliation doesn't match ERP expectations. QR code payment confirmation is unreliable (webhook delays of 5-30 seconds). Staff don't know if payment succeeded and either double-charge or let customers leave without paying.

**Warning signs:**
- Payment architecture assumes a single payment provider
- No Thai payment gateway account set up in first 2 weeks
- QR payment flow designed as synchronous (display QR -> wait -> done)
- No discussion of payment confirmation webhooks vs polling
- Settlement/reconciliation not considered in ERP sync design

**Prevention:**
- Use **Omise (Opn Payments)** or **2C2P** as the primary aggregator -- they support PromptPay, credit/debit cards, and several e-wallets through a single API. This reduces integration surface dramatically.
- Design QR payment flow as **asynchronous**: display QR code -> poll for confirmation (every 2-3 seconds) AND listen for webhook -> show confirmation to staff. Never rely solely on webhooks (they can be delayed) or solely on polling (wastes resources).
- Implement a **payment status checker** that staff can manually trigger ("Check payment status" button) for when automatic confirmation is slow.
- Build a **payment abstraction layer** so the POS core doesn't know about specific providers. Each payment method implements a common interface: `initiate()`, `checkStatus()`, `void()`, `refund()`.
- Budget 4-6 weeks for payment integration, not 1-2. Include time for sandbox testing, certification, and production debugging.
- Handle the cash drawer separately -- cash payments are instant and local, but need physical cash drawer kick commands (sent via the same ESC/POS print relay).

**Detection:** If the team hasn't set up a sandbox account with a Thai payment provider by end of Phase 1, payment integration will be the project's critical path.

**Phase relevance:** Payment provider selection and sandbox setup in Phase 1. Core implementation in Phase 2/3. Full multi-method support before go-live.

---

### Pitfall 5: ERP Sync as Afterthought

**What goes wrong:** The project requires bidirectional ERP sync (menu/pricing FROM ERP, sales/inventory TO ERP), but teams build the POS in isolation and bolt on ERP integration at the end. The POS data model doesn't match ERP data structures. Menu items have different IDs, categories don't align, pricing rules conflict. The "last mile" of ERP integration becomes a 2-month swamp of data mapping, conflict resolution, and edge case handling.

**Why it happens:** The ERP API is owned by another team or system. It's easier to build with mock data first. The POS team doesn't fully understand the ERP's data model until they try to integrate. By then, the POS schema is locked in and doesn't map cleanly.

**Consequences:** Data inconsistencies between POS and ERP. Daily sales reports don't match. Inventory deductions are wrong. Menu price changes in ERP don't reflect in POS (or vice versa). The finance team can't close books. Management loses trust in the data.

**Warning signs:**
- POS data model designed without examining ERP API schemas
- No ERP API documentation reviewed in Phase 1
- Mock data for menus/items uses POS-invented IDs instead of ERP IDs
- "We'll map the data later" in planning
- No discussion of conflict resolution (what if ERP and POS disagree on a price?)

**Prevention:**
- **ERP is the source of truth for menu/pricing** (already decided in PROJECT.md -- good). Enforce this by making the POS menu read-only except for temporary 86'd (out-of-stock) items.
- Review the ERP API schema in Week 1. Use ERP entity IDs as foreign keys in the POS database. Do not create a separate ID system that requires mapping.
- Design sync as **event-driven** where possible: ERP publishes menu changes -> POS subscribes. POS publishes sales transactions -> ERP subscribes. If events aren't feasible, use scheduled polling with change detection (last-modified timestamps).
- Build the ERP sync adapter in Phase 1 alongside the data model, even if it's read-only menu sync first. This forces data model alignment early.
- Define a **reconciliation process**: daily automated comparison of POS sales totals vs ERP records, with alerts on discrepancy.
- Handle **sync failures gracefully**: if ERP is down, POS continues operating with last-known menu data. Queue sales data and retry. Never block POS operations on ERP availability.

**Detection:** If the POS can run for a full day without the ERP and nobody notices data gaps, the sync architecture is probably wrong. Sync should be continuous, not batch.

**Phase relevance:** ERP API review and data model alignment in Phase 1. Menu sync in Phase 2. Sales/inventory sync in Phase 3. Reconciliation before go-live.

---

### Pitfall 6: Multi-Brand/Multi-Location as a Filter Instead of Architecture

**What goes wrong:** "Multi-brand" gets implemented as a `brand_id` foreign key on every table, and "multi-location" as a `location_id`. This works for simple queries but fails when brands have different menu structures, different pricing rules, different tax configurations, different receipt formats, different kitchen workflows, and different promotion rules. The codebase becomes littered with `if (brand === 'X')` conditionals.

**Why it happens:** Multi-tenancy seems simple when you only consider data isolation. But restaurant brands differ in behavior, not just data. One brand might use table service with course-based ordering; another might use counter service with queue numbers. One brand might include service charge; another might not. These are workflow differences, not data differences.

**Consequences:** Adding a new brand requires code changes throughout the application. Brand-specific bugs leak into other brands. Configuration becomes a maze of brand-specific overrides. The "multi-brand platform" is actually multiple hardcoded brands in one codebase.

**Warning signs:**
- Multi-brand requirements described only as "separate menus and pricing"
- No brand configuration schema designed
- Brand-specific logic scattered across components instead of centralized
- No discussion of per-brand workflow differences (service model, tax rules, receipt format)

**Prevention:**
- Design a **brand configuration system** that captures behavioral differences, not just data differences. Each brand config includes: service model (table/counter/both), tax rules, service charge rules, receipt template, kitchen routing rules, available payment methods, and promotion rules.
- Use **composition over conditionals**: brand-specific behaviors are composed from configurable building blocks, not coded with if/else branches. For example, the order flow is assembled from configurable steps, not hardcoded per brand.
- Store brand configuration as structured data (JSON schema), not code. Adding a new brand should require zero code changes -- only configuration.
- Implement **location** as a child of brand with its own overrides (operating hours, available printers, staff, local promotions) but inheriting brand defaults.
- Test with at least 2 brands from day one. If you only test with one brand, multi-brand will be theoretical until it breaks.

**Detection:** Can you add a new brand by only changing configuration data? If the answer is "mostly, except for..." then those exceptions are where multi-brand is broken.

**Phase relevance:** Brand configuration schema must be designed in Phase 1. Must be validated with 2+ brands by Phase 2. Every feature must be tested against multi-brand from inception.

---

## Moderate Pitfalls

---

### Pitfall 7: KDS/Kitchen Communication Reliability

**What goes wrong:** Kitchen Display Systems need real-time updates (new orders appearing instantly) but also need to survive disconnections (a kitchen tablet's WiFi drops for 10 seconds during steam/heat exposure). Teams use WebSockets for real-time updates but don't handle reconnection properly. When a KDS reconnects, it either shows stale data or misses orders that arrived during the disconnection.

**Prevention:**
- Use WebSocket for real-time push, but back it up with a polling fallback. On reconnect, the KDS fetches all active orders for its station, not just new ones.
- Give each KDS station a **last-seen sequence number**. On reconnect, request all orders after that sequence. This handles gaps without full data reload.
- Kitchen environments are hostile to electronics: heat, steam, grease. Use tablet cases and consider screen brightness/contrast for readability in bright kitchen lighting.
- Implement **audible alerts** for new orders -- kitchen staff don't stare at screens constantly. A beep on new order + visual flash is essential.
- Support **bump functionality** (mark item as complete) with physical taps. Kitchen staff have wet/greasy hands -- small touch targets will be missed. Use large buttons.

**Warning signs:** KDS designed without considering kitchen environment constraints. No reconnection strategy. No audible alerts.

**Detection:** Disconnect the KDS tablet's WiFi for 30 seconds during a test order flow. On reconnect, are all orders present and in correct state?

**Phase relevance:** KDS architecture in Phase 2. Must be tested in actual kitchen environment before go-live.

---

### Pitfall 8: Receipt and Kitchen Ticket Formatting Nightmares

**What goes wrong:** Thermal printer output must fit within 42 or 48 characters per line (depending on paper width: 58mm or 80mm). Thai language characters have different rendering widths than ASCII. Modifiers, long item names, and special instructions overflow or truncate. Receipt totals don't align. Kitchen tickets become unreadable.

**Prevention:**
- Standardize on **80mm paper width** (48 chars/line) for all printers. 58mm is too narrow for bilingual Thai/English content.
- Build a **receipt/ticket renderer** that handles Thai character width correctly. Thai characters occupy different visual widths than their byte count suggests. Test with real Thai menu item names (which can be 20+ characters).
- Truncate item names with ellipsis at a fixed width, but show modifiers on a new indented line.
- Use ESC/POS text sizing commands for section headers (order number, table number should be LARGE and BOLD on kitchen tickets so the chef can read them from a distance).
- Test receipts and tickets with real-world orders: 15+ items, multiple modifiers per item, split bills, applied vouchers. Simple test orders will not reveal formatting issues.

**Warning signs:** No receipt template design done. Testing only with English item names. No real printer hardware in the development environment.

**Phase relevance:** Receipt template design in Phase 2. Must be iterated with actual Thai restaurant menu data.

---

### Pitfall 9: FoodStory Migration and Parallel Running

**What goes wrong:** Replacing FoodStory means a transition period where staff need to learn the new system while the restaurant continues operating. Teams plan a "big bang" cutover and discover that staff can't use the new POS at full speed, menu data wasn't migrated completely, or edge cases (voids, refunds, split bills) weren't covered. The restaurant either reverts to FoodStory or operates in painful dual-system mode.

**Prevention:**
- Plan a **parallel running period** (1-2 weeks) where both systems operate. New POS handles new orders; FoodStory is fallback for anything the new POS can't handle yet.
- Migrate menu data from FoodStory (or from ERP, since ERP is the source of truth) before go-live. Verify every menu item, modifier, and price.
- Train staff in **off-peak hours** before go-live. Create a training mode where staff can practice without creating real orders.
- Identify the **FoodStory features staff actually use** (not what FoodStory offers, but what staff rely on daily). Ensure 100% coverage of those specific workflows before cutover.
- Plan go-live for a **low-traffic day** (typically Monday/Tuesday for restaurants). Never cut over on a Friday or weekend.
- Have a **rollback plan**: FoodStory credentials and configuration preserved for 30 days after cutover.

**Warning signs:** No staff training plan. No menu data migration strategy. Go-live planned without parallel running period.

**Phase relevance:** Migration planning must start mid-project. Parallel running and cutover is the final phase.

---

### Pitfall 10: Overengineering the Real-Time Architecture

**What goes wrong:** Teams build an event-sourced, CQRS, real-time-everything architecture because "it's a real-time system." In reality, only a few flows need true real-time updates: order -> KDS, payment confirmation, and table status. Everything else (reports, ERP sync, menu updates) can be near-real-time or periodic. The overengineered architecture adds complexity to every feature, slows development, and makes debugging harder.

**Prevention:**
- Use real-time (WebSocket) only for: KDS order display, payment status polling, and table status board.
- Use standard REST/HTTP for: order creation (from POS terminal), menu fetching, reporting, ERP sync.
- If using WebSocket, use a proven library (Socket.IO with Redis adapter for multi-server, or Ably/Pusher as managed service) rather than raw WebSocket protocol handling.
- Avoid event sourcing for v1. A simple relational database with an `order_events` audit log table gives you the traceability benefits without the architectural complexity.
- Keep the data model simple: orders, items, payments, tables. Don't abstract into "aggregates" and "projections" for v1.

**Warning signs:** Architecture diagrams show event buses, CQRS, event sourcing, and stream processing for a system serving 1-5 locations. More architecture documents than working code in Week 3.

**Phase relevance:** Architecture decisions in Phase 1. Keep it simple. Complexity can be added when scaling beyond 10+ locations warrants it.

---

### Pitfall 11: Ignoring End-of-Day and Shift Reconciliation

**What goes wrong:** Teams focus on the order-to-payment flow and forget that every restaurant day ends with a cash count, sales reconciliation, and shift handover. If the POS doesn't support end-of-day (EOD) closing -- totaling cash, card, and QR payments; comparing expected vs actual cash in drawer; generating Z-reports -- staff will use spreadsheets alongside the POS, undermining its value.

**Prevention:**
- Design the EOD flow as a first-class feature, not a report. It should: lock the current day, calculate expected cash (cash sales minus cash refunds), prompt for actual cash count, record the variance, generate a summary for ERP sync.
- Support **shift-based reporting** if the restaurant runs multiple shifts. Each shift has its own cash drawer total.
- The POS should not allow a new day to start without closing the previous day (or explicitly overriding with manager approval).
- Include void/comp/discount summaries in EOD reports -- management needs to see these to detect theft/waste.

**Warning signs:** No EOD workflow in feature list (it IS listed in PROJECT.md -- good). No discussion of cash drawer tracking. Reports treated as "nice to have."

**Phase relevance:** EOD flow design in Phase 2, implementation in Phase 3. Must be working before go-live -- it's a daily operational requirement.

---

### Pitfall 12: Tablet Performance and Touch UX Misjudgments

**What goes wrong:** The POS is built and tested on developer MacBooks/desktops, then deployed to mid-range Android tablets or older iPads. The web app is sluggish: menu grids with 100+ items lag on scroll, animations stutter, and touch targets are too small for fast-paced restaurant use. Staff frustration leads to errors and resistance.

**Prevention:**
- Test on target hardware from Week 2. Buy the actual tablets that will be deployed and use them as primary test devices.
- Menu grids must use **virtualization** (react-window or react-virtual) if showing 50+ items. Do not render all items in the DOM.
- Touch targets must be minimum **44x44 points** (Apple HIG) / **48x48dp** (Material). For a POS used in a rush, prefer **56-64px** tap targets.
- Minimize animations. No page transitions longer than 150ms. No loading spinners for cached data.
- Avoid heavy client-side state management. Large Redux/Zustand stores with hundreds of menu items cause re-renders on tablets. Use server state (React Query/TanStack Query) and keep client state minimal.
- Pre-load menu data on app start and cache aggressively. A server round-trip to show the menu on every table visit is unacceptable.

**Warning signs:** No target tablet hardware purchased. UI designed at desktop resolution. No performance budget defined.

**Phase relevance:** Hardware procurement and performance baseline in Phase 1. Performance testing throughout all phases.

---

## Minor Pitfalls

---

### Pitfall 13: Voucher/Coupon System Scope Creep

**What goes wrong:** "Vouchers and coupons" sounds simple but rapidly expands: percentage vs fixed discount, per-item vs per-order, minimum spend requirements, usage limits (single-use, multi-use, per-customer), combinability rules (can two vouchers stack?), validity periods, brand-specific vs cross-brand. Each rule adds conditional logic to the billing calculation, and errors here mean revenue loss.

**Prevention:**
- Define a **promotion engine** with a clear rule schema from the start. Each voucher/coupon has: discount type, discount value, conditions (min spend, applicable items/categories, applicable brands), usage limits, and validity period.
- Promotions are applied as **line items on the bill** (negative amounts), not as modifications to item prices. This preserves the original price for reporting and makes it easy to remove a promotion.
- Build combinability rules: default to "not combinable" and whitelist specific combinations. This prevents revenue-leaking edge cases.
- Test with finance/management to confirm which promotion types they actually need for v1. Usually it's: fixed discount coupon, percentage discount coupon, and free item voucher. Don't build a generic rule engine until you need it.

**Warning signs:** No promotion schema defined. Discounts applied by modifying item prices directly. No combinability rules discussed.

**Phase relevance:** Promotion engine design in Phase 2. Implementation in Phase 3. Keep scope tight for v1.

---

### Pitfall 14: Neglecting Audit Trail and Accountability

**What goes wrong:** In restaurants, cash handling and void/comp authority must be tracked for theft prevention. If the POS doesn't log who voided an item, who applied a discount, who opened the cash drawer, and who processed a refund, management has no accountability tools. This isn't a "nice to have" -- it's an operational requirement that, if missing, makes the POS unsuitable for multi-location management.

**Prevention:**
- Log every mutation with: who (staff ID), what (action), when (timestamp), and context (reason code for voids/comps, manager override for restricted actions).
- Require **manager PIN/authorization** for: voids above a threshold, comps, cash drawer opens without a sale, refunds, and price overrides.
- Make the audit log append-only and never deletable from the POS interface.
- Include audit summaries in EOD reports.

**Warning signs:** No staff authentication model. No discussion of restricted operations. No audit log table in database design.

**Phase relevance:** Staff auth and audit logging must be in the data model from Phase 1. Authorization rules in Phase 2.

---

### Pitfall 15: Testing with Toy Data Instead of Real Restaurant Conditions

**What goes wrong:** Developers test with 5 menu items, 3 tables, and single-item orders. Production has 80+ menu items with Thai names, 15+ tables, orders with 8-12 items each, modifiers on every item, concurrent orders from multiple waiters, and a kitchen printing queue of 20+ tickets during rush hour. Performance, formatting, and workflow issues only surface under realistic load.

**Prevention:**
- Seed the development database with **real menu data** from the actual restaurants (exported from FoodStory or ERP) from the start.
- Simulate rush-hour conditions: 10+ concurrent orders being placed, 5+ orders being prepared in kitchen, 3+ payments being processed simultaneously.
- Test with **real Thai text** -- item names, modifier names, special instructions in Thai. Character encoding, text width, and display issues will surface.
- Include edge-case orders in test data: orders with 15+ items, orders with every modifier, split bills with 4+ ways, merged bills from 3+ tables.

**Warning signs:** Test database has English-only menu items. Stress testing not planned. No test scenarios for concurrent operations.

**Phase relevance:** Realistic test data setup in Phase 1. Load/stress testing before go-live phase.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Data model design | Order state machine too simple (#3), ERP IDs not aligned (#5), multi-brand as afterthought (#6) | Design order FSM, review ERP API, brand config schema -- all in Phase 1 |
| Order flow implementation | No degraded mode (#1), overengineered real-time (#10) | Optimistic local state + simple WebSocket for KDS only |
| Kitchen/printing | Thermal printer integration (#2), receipt formatting (#8), KDS reliability (#7) | Spike printer hardware in Week 1, prototype ESC/POS output early |
| Payment integration | Thailand payment complexity (#4), QR confirmation async flow | Set up Omise/2C2P sandbox immediately, design async payment status |
| Billing (split/merge/promos) | Order state complexity (#3), voucher scope creep (#13) | State machine enforces valid transitions, tight promo scope for v1 |
| ERP sync | Data model mismatch (#5), sync failure handling | ERP IDs as foreign keys, event-driven with fallback polling, reconciliation |
| Multi-brand rollout | Configuration vs code (#6), FoodStory migration (#9) | Brand config as data, parallel running period, staff training |
| Pre-go-live | Tablet performance (#12), toy data testing (#15), no EOD flow (#11) | Test on real hardware with real data, EOD flow mandatory for go-live |

---

## Sources

- Training data knowledge of restaurant POS systems, ESC/POS protocol, Thailand payment ecosystem, and multi-tenant SaaS architecture patterns
- PROJECT.md requirements and constraints analysis
- Note: Web search was unavailable during research. Confidence levels are MEDIUM based on training data. Key claims to verify with live sources:
  - Omise/Opn Payments current PromptPay support and API stability
  - Epson ePOS JavaScript SDK current browser compatibility
  - 2C2P current pricing and Thailand coverage
  - shadcn/ui v4 compatibility with tablet performance requirements
