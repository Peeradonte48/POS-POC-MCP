# Project Research Summary

**Project:** A RAMEN POS
**Domain:** Multi-brand restaurant POS platform (Thailand market, replacing FoodStory)
**Researched:** 2026-03-09
**Confidence:** MEDIUM

## Executive Summary

A RAMEN POS is a multi-brand restaurant point-of-sale system for the Thailand market, replacing FoodStory as the primary POS across multiple restaurant brands under one organization. Expert POS builders use a modular monolith architecture with a web-based frontend (for cross-device compatibility), real-time WebSocket communication for kitchen displays, server-side thermal printing, and asynchronous ERP integration. The stack is well-established: Next.js 15 with React 19 for the UI, PostgreSQL for transactional data, Socket.IO for real-time kitchen communication, and tRPC for type-safe API contracts. shadcn/ui v4 is already installed, anchoring the UI layer.

The recommended approach is cloud-hosted for v1 with a single deployment serving all brands/locations, using brand-scoped data isolation (shared database with `brand_id`/`location_id` on every table). The order system must be modeled as a finite state machine from day one -- this is the single most important architectural decision. ERP integration should be designed into the data model from Phase 1, not bolted on later. Payment integration requires Thailand-specific gateways (Omise/2C2P) since Stripe does not adequately cover PromptPay, TrueMoney, or LINE Pay.

The top risks are: (1) no degraded-mode strategy for network drops during service, which will cause staff to reject the system, (2) thermal printer integration being deferred too long -- this requires hardware prototyping in week 1, (3) Thailand payment integration taking 3-4x longer than estimated due to fragmented gateway landscape, and (4) ERP data model misalignment discovered too late. All four risks are mitigable by front-loading spikes and design work in Phase 1.

## Key Findings

### Recommended Stack

The stack centers on Next.js 15 (App Router) with TypeScript, leveraging the already-installed shadcn/ui v4 component library. Drizzle ORM is preferred over Prisma for its lower query latency -- critical for sub-second POS responses during rush hour. Socket.IO runs as a separate Node.js process (not inside Next.js) for persistent WebSocket connections to KDS screens. TanStack Query handles server state caching, and Zustand manages lightweight client state (current order, active table).

**Core technologies:**
- **Next.js 15 + React 19:** Full-stack framework with App Router, API routes for ERP integration, SSR for fast initial loads
- **TypeScript + Zod + tRPC:** End-to-end type safety from database to UI; compile-time catch of integration bugs
- **PostgreSQL 16 + Drizzle ORM:** ACID transactions for payment data, JSON columns for flexible modifiers, row-level security for brand isolation
- **Socket.IO:** Battle-tested WebSocket layer with automatic reconnection for kitchen displays
- **Server-side ESC/POS printing:** Local print relay service per location -- browser-based printing is not viable for thermal printers
- **Custom payment adapters:** Thailand-specific: PromptPay QR via Omise/2C2P, card via EDC terminal, TrueMoney/LINE Pay via their APIs

### Expected Features

**Must have (table stakes for v1):**
- Menu browsing with categories, modifiers, and brand-scoped pricing
- Order creation with table assignment, counter/queue mode, and hold/fire control
- Kitchen output via thermal printer tickets (KDS as fast-follow)
- Billing with VAT 7%, service charge, discounts, and split bill by item
- Cash, PromptPay QR, and card payment recording
- Voucher/coupon redemption -- the primary reason for replacing FoodStory
- Receipt printing (Thai tax invoice compliant)
- EOD summary report with cash reconciliation
- ERP bidirectional sync (menu pull, sales push)
- Multi-brand menu separation and RBAC (cashier vs manager)

**Should have (differentiators):**
- Advanced promotion engine (time-based, combo, tiered rules)
- Visual table map with color-coded status
- Real-time cross-brand dashboard
- Smart QR auto-confirmation via bank API
- Configurable kitchen output (KDS, printer, or both per station)

**Defer to v2+:**
- Merge bills, TrueMoney/LINE Pay, ingredient-level inventory, offline resilience, visual table map, shift-based reporting, customer-facing display, self-order kiosk, loyalty program

### Architecture Approach

Modular monolith with brand-scoped multi-tenancy. Three tiers: client (cashier desktop, server tablet, KDS screen), API (Next.js with tRPC + Socket.IO as separate process), and data (PostgreSQL + optional Redis for active order caching). All client form factors served by a single responsive web app. Orders flow through an explicit state machine. Kitchen communication is event-driven via WebSocket with channel-per-station scoping. ERP sync is asynchronous and never blocks the order path.

**Major components:**
1. **Order Module** -- Order lifecycle FSM: create, modify, submit, complete, cancel, with item-level sub-states
2. **Menu Module** -- Brand-scoped items, categories, modifiers, pricing; synced from ERP
3. **Kitchen Module** -- Routes orders to KDS/printer by station config; real-time via WebSocket
4. **Payment Module** -- Cash, card, QR processing with idempotent transactions and async ERP push
5. **Promotion Module** -- Voucher/coupon validation, discount calculation as bill line items
6. **ERP Sync Module** -- Bidirectional: pull menu/pricing, push sales/inventory; event-driven with polling fallback

### Critical Pitfalls

1. **No degraded-mode strategy** -- Even without full offline support, the POS must queue orders locally during network drops (optimistic UI + local queue). Test by throttling network to 500ms+ latency. Address in Phase 1/2 or face staff rejection.
2. **Thermal printer integration deferred** -- Web browsers cannot print to thermal printers natively. A local print relay service is required. Buy hardware and prototype ESC/POS output in Week 1. Thai character encoding (TIS-620) is a known pain point.
3. **Order state machine too simple** -- A single `status` string field leads to impossible states, lost items, and broken split bills. Model as a finite state machine with explicit transitions and guards from day one.
4. **Thailand payment complexity** -- PromptPay, TrueMoney, LINE Pay each have different APIs and flows. Use Omise or 2C2P as aggregator. Design QR payment as async (poll + webhook). Budget 4-6 weeks for payment integration.
5. **ERP sync as afterthought** -- Use ERP entity IDs as foreign keys in POS database from Phase 1. Review ERP API schema before designing the POS data model. Never block POS operations on ERP availability.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation and Data Model
**Rationale:** Every downstream feature depends on the data model, auth system, and multi-brand tenant architecture. ERP API review must happen here to avoid data model misalignment. Printer hardware spike prevents late-stage integration surprises.
**Delivers:** Database schema with order FSM, multi-brand config, auth (PIN + credentials), menu module with ERP sync, basic API layer (tRPC), printer hardware prototype
**Addresses:** Menu management, multi-brand separation, RBAC, ERP menu sync
**Avoids:** Pitfalls #3 (order state machine), #5 (ERP afterthought), #6 (multi-brand as filter), #2 (printer spike)

### Phase 2: Core Order Flow
**Rationale:** Orders are the critical path -- billing, kitchen, and payments all depend on a working order system. Optimistic UI with local queuing must be built into the order flow from the start, not retrofitted.
**Delivers:** Order creation/editing, table assignment, counter/queue mode, hold/fire, modifiers/notes, optimistic UI with degraded-mode resilience
**Addresses:** Order management features, table operations, counter ordering
**Avoids:** Pitfalls #1 (no degraded mode), #10 (overengineered real-time)

### Phase 3: Kitchen Communication and Printing
**Rationale:** Kitchen output is triggered at order submission (Phase 2 dependency). KDS and printer integration are parallel to billing work and should be validated with real hardware before payment flows are built.
**Delivers:** WebSocket hub, KDS display, station routing, thermal printer ticket output, receipt template rendering with Thai text
**Addresses:** KDS, printer tickets, station routing, order status tracking
**Avoids:** Pitfalls #2 (printer integration), #7 (KDS reliability), #8 (receipt formatting)

### Phase 4: Billing and Payments
**Rationale:** Payment requires completed orders with calculated totals. Thailand's payment landscape requires early sandbox setup (ideally Phase 1) but full implementation here. Split bill depends on a solid order/billing model.
**Delivers:** Bill calculation (VAT 7%, service charge, discounts), cash payment, PromptPay QR, card recording, split bill by item, receipt printing, voucher/coupon redemption
**Addresses:** All billing and payment table stakes, basic promotion support
**Avoids:** Pitfalls #4 (payment underestimation), #13 (voucher scope creep)

### Phase 5: ERP Integration and Reporting
**Rationale:** ERP sync requires payment data flowing. Menu sync was established in Phase 1; now sales/inventory push is layered on. EOD reports are a go-live requirement.
**Delivers:** Sales data push to ERP, inventory deduction sync, EOD summary report, sales by item report, daily reconciliation
**Addresses:** ERP sales sync, EOD reporting, audit trail
**Avoids:** Pitfall #11 (ignoring EOD reconciliation)

### Phase 6: Polish, Migration, and Go-Live
**Rationale:** Final phase focuses on tablet performance optimization, multi-brand theming, FoodStory migration, staff training, and parallel running. This is not optional polish -- it is operational readiness.
**Delivers:** Tablet-optimized responsive UI, performance tuning, FoodStory data migration, staff training mode, parallel running period, rollback plan
**Addresses:** Multi-device UX, FoodStory replacement
**Avoids:** Pitfalls #9 (migration), #12 (tablet performance), #15 (toy data testing)

### Phase Ordering Rationale

- **Menu before orders, orders before kitchen, kitchen before payments:** This follows the dependency chain discovered in FEATURES.md and ARCHITECTURE.md. You cannot test downstream features without upstream data flowing.
- **ERP data model alignment in Phase 1:** PITFALLS.md flagged this as critical. Waiting until Phase 5 to discover mismatches causes rewrites.
- **Printer spike in Phase 1, full printing in Phase 3:** The most common POS project killer is deferred printer integration. A week-1 hardware spike de-risks this without blocking Phase 1 delivery.
- **Payment in Phase 4 (not earlier):** Thailand payment integration is complex and benefits from a stable order/billing foundation. But sandbox account setup should start in Phase 1.
- **Go-live preparation as a dedicated phase:** FoodStory migration, staff training, and parallel running are not afterthoughts -- they determine whether the system actually replaces FoodStory.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Kitchen/Printing):** Thermal printer hardware selection, ESC/POS library evaluation for Thai text, Epson ePOS SDK compatibility testing
- **Phase 4 (Payments):** Omise/2C2P current API docs, PromptPay EMVCo QR spec, bank webhook reliability, settlement reconciliation format
- **Phase 5 (ERP Integration):** ERP API schema review, entity ID mapping, sync frequency requirements, conflict resolution rules

Phases with standard patterns (skip deep research):
- **Phase 1 (Foundation):** Next.js + Drizzle + PostgreSQL setup is well-documented. Multi-tenant schema patterns are established.
- **Phase 2 (Order Flow):** CRUD with state machine is a standard pattern. Optimistic UI with TanStack Query is well-documented.
- **Phase 6 (Polish/Migration):** Responsive design and performance optimization follow established web patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Based on training data. Versions need verification via npm. shadcn v4 is confirmed (package.json). |
| Features | MEDIUM | Strong domain knowledge of POS systems. Thailand market specifics (PromptPay, VAT, TrueMoney) need live API doc verification. |
| Architecture | MEDIUM | Modular monolith + event-driven kitchen is the established pattern for restaurant POS. Specific scalability thresholds are estimates. |
| Pitfalls | MEDIUM-HIGH | Pitfalls are drawn from well-known failure modes in POS projects. Thailand payment and printer integration risks are consistently cited. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **ERP API schema:** Not yet reviewed. Must be examined before Phase 1 data model design is finalized. This is the single biggest unknown.
- **Payment gateway selection:** Omise vs 2C2P vs direct bank APIs -- requires current pricing, PromptPay support verification, and sandbox account setup.
- **Target hardware:** Specific tablet models not defined. Performance budgets depend on knowing the target devices.
- **Thermal printer models:** Need to confirm which printers are already in use at A RAMEN locations (or select new ones). Thai character support varies by model.
- **FoodStory data export:** How to extract current menu data, historical sales, and configuration from FoodStory for migration.
- **Package versions:** All npm package versions based on training data (cutoff early-mid 2025). Must verify current stable versions before installation.

## Sources

### Primary (HIGH confidence)
- PROJECT.md requirements and constraints -- direct project input
- package.json showing shadcn ^4.0.2 -- confirms UI framework choice

### Secondary (MEDIUM confidence)
- Training data knowledge of restaurant POS architecture patterns (Toast, Square, Lightspeed)
- Training data knowledge of Thailand payment ecosystem (PromptPay, TrueMoney, LINE Pay)
- Training data knowledge of ESC/POS protocol and thermal printer integration
- Training data knowledge of PostgreSQL multi-tenant patterns
- Training data knowledge of Next.js, Drizzle, Socket.IO, tRPC ecosystems

### Tertiary (LOW confidence)
- Specific npm package version numbers -- need live verification
- Omise/2C2P current API capabilities and pricing -- need current documentation
- Epson ePOS SDK browser compatibility -- need testing with actual hardware

---
*Research completed: 2026-03-09*
*Ready for roadmap: yes*
