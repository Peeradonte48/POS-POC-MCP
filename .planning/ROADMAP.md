# Roadmap: A RAMEN POS

## Overview

This roadmap delivers a multi-brand restaurant POS that replaces FoodStory, following the natural dependency chain: menu data flows into orders, orders flow to the kitchen, completed orders become bills, bills accept payments, and everything syncs to ERP. Six phases move from foundation through go-live, each delivering a coherent capability that can be verified independently.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Multi-Brand Setup** - Database schema, multi-brand architecture, RBAC, and menu module with ERP-sourced data
- [ ] **Phase 2: Order Flow & Table Management** - Order lifecycle from creation through table assignment, counter mode, and void handling
- [ ] **Phase 3: Kitchen Communication** - KDS displays, thermal printer tickets, real-time order status tracking
- [ ] **Phase 4: Billing & Payments** - Bill calculation, split/merge, all payment types, and receipt printing
- [ ] **Phase 5: Promotions & Reporting** - Voucher/coupon redemption, EOD summaries, sales reports, cash reconciliation
- [ ] **Phase 6: ERP Sync & Device Polish** - Sales/inventory push to ERP, async resilience, tablet/desktop optimization, Thai language

## Phase Details

### Phase 1: Foundation & Multi-Brand Setup
**Goal**: The application runs with a working menu system scoped per brand, user authentication, and role-based access -- the foundation every other phase builds on
**Depends on**: Nothing (first phase)
**Requirements**: MENU-01, MENU-02, MENU-03, MENU-04, MENU-05, MBML-01, MBML-02, MBML-03, MBML-04, MBML-05, UIUX-03
**Success Criteria** (what must be TRUE):
  1. Staff can log in and see only the menu for their assigned brand with correct categories, items, modifiers, and pricing
  2. Menu data is pulled from ERP and reflects ERP changes after a sync cycle
  3. Admin can manage multiple brands and locations from a single admin interface with brand-specific settings (logo, tax ID, service charge, printers)
  4. Cashier, manager, and admin roles exist with appropriate permission boundaries (e.g., cashier cannot access admin settings)
  5. All UI is built with shadcn/ui components and renders correctly
**Plans:** 4 plans

Plans:
- [x] 01-01-PLAN.md -- Project scaffolding and database schema with seed data
- [ ] 01-02-PLAN.md -- Auth system (PIN + password), RBAC permissions, route protection
- [ ] 01-03-PLAN.md -- Admin panel with brand/location/staff management and ERP sync
- [ ] 01-04-PLAN.md -- POS floor interface with PIN login, menu browsing, and modifier selection

### Phase 2: Order Flow & Table Management
**Goal**: Staff can create, edit, and manage orders for both table service and counter service, with the full order lifecycle working end-to-end
**Depends on**: Phase 1
**Requirements**: ORDR-01, ORDR-02, ORDR-03, ORDR-04, ORDR-05, ORDR-06
**Success Criteria** (what must be TRUE):
  1. Staff can create an order by browsing the menu, selecting items with modifiers/quantities/notes, and submitting it
  2. Staff can assign an order to a table, and transfer that order to a different table without losing any data
  3. Staff can create counter/queue orders that receive auto-incrementing order numbers
  4. Staff can edit an order (change quantities, remove items, add notes) before it is sent to kitchen
  5. Manager can void items or entire orders with reason tracking and authorization required
**Plans:** 5 plans

Plans:
- [ ] 02-01-PLAN.md -- Order schema (DB tables + enums), permissions update, and test scaffold (TDD)
- [ ] 02-02-PLAN.md -- Order API routes: create, get, add round, table transfer
- [ ] 02-03-PLAN.md -- Table status API + /tables page with live color indicators and elapsed time
- [ ] 02-04-PLAN.md -- Menu page + order panel wired to persistent API (useOrder hook, send-to-kitchen mutation, round grouping)
- [ ] 02-05-PLAN.md -- Void flow: manager PIN verification API, item/order void endpoints, VoidReasonDialog component

### Phase 3: Kitchen Communication
**Goal**: Orders submitted by front-of-house appear instantly in the kitchen via KDS and/or thermal printer, and kitchen status updates flow back to servers in real-time
**Depends on**: Phase 2
**Requirements**: KTCH-01, KTCH-02, KTCH-03, KTCH-04, KTCH-05
**Success Criteria** (what must be TRUE):
  1. When a server submits an order, it appears on the KDS screen within 1 second
  2. When a server submits an order, a thermal printer ticket prints automatically with correct items, modifiers, and notes
  3. Kitchen staff can update item status (new, in-progress, done) on the KDS and front-of-house staff see those updates in real-time
  4. Each location can be configured to use KDS only, printer only, or both -- and the system routes output accordingly
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD
- [ ] 03-03: TBD

### Phase 4: Billing & Payments
**Goal**: Staff can generate accurate bills with Thai tax compliance, split or merge them, and accept every payment type needed to close a transaction
**Depends on**: Phase 3
**Requirements**: BILL-01, BILL-02, BILL-03, BILL-04, BILL-05, BILL-06, BILL-07, BILL-08, BILL-09, BILL-10, PAY-01, PAY-02, PAY-03, PAY-04, PAY-05, PAY-06, PAY-07
**Success Criteria** (what must be TRUE):
  1. Staff can generate a bill that correctly shows items, subtotal, configurable service charge, VAT 7% (applied after service charge), and grand total
  2. Staff can apply per-item or per-bill discounts, with above-threshold discounts requiring manager authorization
  3. Staff can split a bill by item selection, by equal division, or by custom amounts -- and can merge bills from multiple tables into one
  4. Staff can process cash payments with change calculation and quick-tender buttons for Thai denominations (20, 50, 100, 500, 1000 THB)
  5. Staff can process card payments (with reference number), PromptPay QR, TrueMoney, LINE Pay, and mixed payment combinations
  6. Receipts print on thermal printer with Thai tax invoice compliance (tax ID, VAT breakdown, brand details)
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD
- [ ] 04-03: TBD
- [ ] 04-04: TBD

### Phase 5: Promotions & Reporting
**Goal**: Staff can redeem vouchers and coupons at billing time, and managers can run end-of-day reports to reconcile the business day
**Depends on**: Phase 4
**Requirements**: PRMO-01, PRMO-02, PRMO-03, PRMO-04, REPT-01, REPT-02, REPT-03
**Success Criteria** (what must be TRUE):
  1. Staff can enter a voucher code and the system validates it (expiry, usage limits, applicable items) and automatically applies the discount to the bill
  2. Staff can enter a coupon code for percentage-off or fixed-amount discounts with rule enforcement (single-use, multi-use, brand-specific, minimum spend)
  3. Manager can generate an end-of-day summary showing total sales by payment type, item breakdown, and void/discount summary
  4. Manager can view sales-by-item reports (quantity and revenue per menu item per day) and perform cash drawer reconciliation
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD
- [ ] 05-03: TBD

### Phase 6: ERP Sync & Device Polish
**Goal**: The POS syncs all transaction data to ERP reliably, and the interface works smoothly on both tablets and desktop terminals for daily restaurant operations
**Depends on**: Phase 5
**Requirements**: ERP-01, ERP-02, ERP-03, ERP-04, UIUX-01, UIUX-02, UIUX-04, UIUX-05
**Success Criteria** (what must be TRUE):
  1. Completed sales transactions and daily summaries sync to ERP automatically
  2. Inventory/ingredient deductions sync to ERP when orders are completed
  3. ERP sync is asynchronous -- the POS continues operating normally if ERP is temporarily unavailable, and catches up when reconnected
  4. The POS interface works on tablets (iPad/Android) with touch-optimized controls and on desktop terminals with equally usable layout
  5. Order entry and payment processing respond in under one second, and menu items and receipts display correctly in Thai
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD
- [ ] 06-03: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Multi-Brand Setup | 1/4 | In progress | - |
| 2. Order Flow & Table Management | 0/5 | Not started | - |
| 3. Kitchen Communication | 0/3 | Not started | - |
| 4. Billing & Payments | 0/4 | Not started | - |
| 5. Promotions & Reporting | 0/3 | Not started | - |
| 6. ERP Sync & Device Polish | 0/3 | Not started | - |

---
*Roadmap created: 2026-03-09*
*Last updated: 2026-03-10*
