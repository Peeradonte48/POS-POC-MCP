# Requirements: A RAMEN POS

**Defined:** 2026-03-09
**Core Value:** Cashiers and servers can take orders and process payments without friction -- the order-to-payment flow must work reliably every time.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Menu Management

- [ ] **MENU-01**: Staff can browse menu organized by categories and subcategories
- [ ] **MENU-02**: Menu items have modifiers and options (single-select, multi-select) with price adjustments
- [ ] **MENU-03**: Staff can add per-item notes and special instructions
- [ ] **MENU-04**: Menu items and pricing are synced from ERP as source of truth
- [ ] **MENU-05**: Each brand has its own separate menu with distinct items and pricing

### Order Management

- [ ] **ORDR-01**: Staff can create orders by adding items with modifiers and quantities
- [ ] **ORDR-02**: Staff can edit orders (change quantity, remove items, add notes) before sending to kitchen
- [ ] **ORDR-03**: Staff can assign orders to tables for table service
- [ ] **ORDR-04**: Staff can transfer orders between tables without losing data
- [ ] **ORDR-05**: Staff can create counter/queue orders with auto-incrementing order numbers
- [ ] **ORDR-06**: Staff can void items or entire orders with manager authorization and reason tracking

### Kitchen Operations

- [ ] **KTCH-01**: Orders appear on Kitchen Display System (KDS) in real-time when submitted
- [ ] **KTCH-02**: Orders print as thermal printer tickets when submitted
- [ ] **KTCH-03**: Kitchen staff can update order item status (new → in-progress → done)
- [ ] **KTCH-04**: Front-of-house staff can see kitchen order status updates in real-time
- [ ] **KTCH-05**: Kitchen output is configurable per location (KDS, printer, or both)

### Billing

- [ ] **BILL-01**: Staff can generate bill showing items, prices, subtotal, service charge, VAT, and total
- [ ] **BILL-02**: VAT 7% is calculated correctly (applied after service charge)
- [ ] **BILL-03**: Service charge is configurable per brand (default 10%, applied before VAT)
- [ ] **BILL-04**: Staff can apply per-item or per-bill discounts (percentage or fixed amount)
- [ ] **BILL-05**: Above-threshold discounts require manager authorization
- [ ] **BILL-06**: Staff can split bill by item (select items to separate sub-bill)
- [ ] **BILL-07**: Staff can split bill by equal amount (divide total by N people)
- [ ] **BILL-08**: Staff can split bill by custom amount
- [ ] **BILL-09**: Staff can merge bills from multiple tables into one bill
- [ ] **BILL-10**: Receipts print on thermal printer with Thai tax invoice compliance (tax ID, VAT amount)

### Payments

- [ ] **PAY-01**: Staff can process cash payments with automatic change calculation
- [ ] **PAY-02**: Quick-tender buttons for common Thai denominations (20, 50, 100, 500, 1000 THB)
- [ ] **PAY-03**: Staff can record credit/debit card payments with reference number (EDC machine processes)
- [ ] **PAY-04**: System generates PromptPay QR code with amount embedded (EMVCo standard)
- [ ] **PAY-05**: Staff can process TrueMoney Wallet QR payments
- [ ] **PAY-06**: Staff can process LINE Pay (Rabbit LINE Pay) payments
- [ ] **PAY-07**: Staff can process mixed payments (e.g., part cash, part QR)

### Promotions

- [ ] **PRMO-01**: Staff can enter voucher code and system validates (expiry, usage limits, applicable items)
- [ ] **PRMO-02**: Valid vouchers automatically apply discount to bill
- [ ] **PRMO-03**: Staff can enter coupon code for percentage-off or fixed-amount discounts
- [ ] **PRMO-04**: Coupons support rules: single-use, multi-use, brand-specific, minimum spend

### Multi-Brand & Multi-Location

- [ ] **MBML-01**: System supports multiple restaurant brands with separate configurations
- [ ] **MBML-02**: Each brand has its own branding (logo, name, address, tax ID) on receipts
- [ ] **MBML-03**: Central admin can manage all locations from single platform
- [ ] **MBML-04**: Location-level settings for printers, tables, tax, and service charge
- [ ] **MBML-05**: Role-based access control (cashier, manager, admin) with appropriate permissions

### Reporting

- [ ] **REPT-01**: End-of-day summary with total sales by payment type, item breakdown, void/discount summary
- [ ] **REPT-02**: Sales by item report (quantity and revenue per menu item per day)
- [ ] **REPT-03**: Cash drawer reconciliation at end of day

### ERP Integration

- [ ] **ERP-01**: Sales transaction data syncs to ERP (completed transactions, daily summaries)
- [ ] **ERP-02**: Menu items and pricing are pulled from ERP and kept in sync
- [ ] **ERP-03**: Inventory/ingredient deductions sync to ERP per order completion
- [ ] **ERP-04**: ERP sync is asynchronous — POS continues working if ERP is unavailable

### UI/UX

- [ ] **UIUX-01**: POS interface works on tablets (iPad/Android) with touch-optimized UI
- [ ] **UIUX-02**: POS interface works on desktop/terminal screens
- [ ] **UIUX-03**: All UI components built with shadcn/ui component library
- [ ] **UIUX-04**: Sub-second response time for order entry and payment processing
- [ ] **UIUX-05**: Thai language support for menu items and receipts

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Promotions

- **PRMO-05**: Time-based promotion rules (happy hour, day-of-week pricing)
- **PRMO-06**: Combo/bundle promotions (buy X get Y free)
- **PRMO-07**: Promotion stacking rules (which promotions can combine)

### Additional Payments

- **PAY-08**: PromptPay auto-confirmation via bank notification API

### Kitchen

- **KTCH-06**: Station routing — route items to specific kitchen stations (bar, grill, cold)
- **KTCH-07**: Hold/fire control for course management
- **KTCH-08**: Priority/rush order flagging with visual and audible alerts

### Reporting

- **REPT-04**: Shift-based reporting (sales per cashier per shift)
- **REPT-05**: Real-time cross-brand dashboard for owners/HQ

### UI/UX

- **UIUX-06**: Visual table map with drag-and-drop layout and color-coded status
- **UIUX-07**: Customer-facing payment display (second screen showing order + QR)
- **UIUX-08**: Offline resilience — queue orders locally during network drops

## Out of Scope

| Feature | Reason |
|---------|--------|
| Customer self-order kiosk | Separate product with different UX — build clean API for future kiosk app |
| Online ordering / delivery integration | Delivery platforms have own integrations — expose API but don't build connector |
| Loyalty/points program | Complex to design well — voucher/coupon covers 80% of promotional need for v1 |
| Full accounting module | ERP handles accounting — POS syncs clean transaction data only |
| Customer mobile ordering app | Different product — staff POS is the focus |
| Employee scheduling | HR tools exist — POS only needs clock in/out for shift reports |
| Built-in payment processing | Use established Thai payment gateways (Omise/2C2P) — don't process directly |
| Multi-currency | All locations in Thailand — THB only |
| AI menu recommendations | Zero value for cashier-operated POS |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| MENU-01 | Phase 1 | Pending |
| MENU-02 | Phase 1 | Pending |
| MENU-03 | Phase 1 | Pending |
| MENU-04 | Phase 1 | Pending |
| MENU-05 | Phase 1 | Pending |
| MBML-01 | Phase 1 | Pending |
| MBML-02 | Phase 1 | Pending |
| MBML-03 | Phase 1 | Pending |
| MBML-04 | Phase 1 | Pending |
| MBML-05 | Phase 1 | Pending |
| UIUX-03 | Phase 1 | Pending |
| ORDR-01 | Phase 2 | Pending |
| ORDR-02 | Phase 2 | Pending |
| ORDR-03 | Phase 2 | Pending |
| ORDR-04 | Phase 2 | Pending |
| ORDR-05 | Phase 2 | Pending |
| ORDR-06 | Phase 2 | Pending |
| KTCH-01 | Phase 3 | Pending |
| KTCH-02 | Phase 3 | Pending |
| KTCH-03 | Phase 3 | Pending |
| KTCH-04 | Phase 3 | Pending |
| KTCH-05 | Phase 3 | Pending |
| BILL-01 | Phase 4 | Pending |
| BILL-02 | Phase 4 | Pending |
| BILL-03 | Phase 4 | Pending |
| BILL-04 | Phase 4 | Pending |
| BILL-05 | Phase 4 | Pending |
| BILL-06 | Phase 4 | Pending |
| BILL-07 | Phase 4 | Pending |
| BILL-08 | Phase 4 | Pending |
| BILL-09 | Phase 4 | Pending |
| BILL-10 | Phase 4 | Pending |
| PAY-01 | Phase 4 | Pending |
| PAY-02 | Phase 4 | Pending |
| PAY-03 | Phase 4 | Pending |
| PAY-04 | Phase 4 | Pending |
| PAY-05 | Phase 4 | Pending |
| PAY-06 | Phase 4 | Pending |
| PAY-07 | Phase 4 | Pending |
| PRMO-01 | Phase 5 | Pending |
| PRMO-02 | Phase 5 | Pending |
| PRMO-03 | Phase 5 | Pending |
| PRMO-04 | Phase 5 | Pending |
| REPT-01 | Phase 5 | Pending |
| REPT-02 | Phase 5 | Pending |
| REPT-03 | Phase 5 | Pending |
| ERP-01 | Phase 6 | Pending |
| ERP-02 | Phase 6 | Pending |
| ERP-03 | Phase 6 | Pending |
| ERP-04 | Phase 6 | Pending |
| UIUX-01 | Phase 6 | Pending |
| UIUX-02 | Phase 6 | Pending |
| UIUX-04 | Phase 6 | Pending |
| UIUX-05 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 54 total
- Mapped to phases: 54
- Unmapped: 0

---
*Requirements defined: 2026-03-09*
*Last updated: 2026-03-09 after roadmap creation*
