# Feature Landscape

**Domain:** Multi-brand Restaurant POS (Thailand market, replacing FoodStory)
**Researched:** 2026-03-09
**Confidence:** MEDIUM (based on domain knowledge; web search unavailable for live verification)

---

## Table Stakes

Features users expect. Missing any of these and staff will reject the system or operations break down.

### Order Management

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Menu browsing with categories and items | Core POS function — staff must find items fast | Low | Category > subcategory > item hierarchy. Must load in <500ms. |
| Item modifiers and options | Every restaurant has "no ice," "extra spicy," size variants | Medium | Modifier groups (single-select, multi-select), price adjustments per modifier. |
| Order creation and editing | Staff add/remove items before sending to kitchen | Low | Must support quantity changes, item notes, and voiding items before submit. |
| Order notes / special instructions | Kitchen needs to see "no peanuts" or "birthday cake at 8pm" | Low | Both per-item notes and per-order notes. |
| Table assignment | Table service restaurants need orders tied to tables | Low | Visual table map is a differentiator; basic table number assignment is table stakes. |
| Table transfer | Move order from table 5 to table 8 when guests relocate | Low | Simple reassignment. Must not lose order data. |
| Counter/queue ordering | Counter-service brands need order numbers, not tables | Low | Auto-incrementing order number, display for pickup. |
| Hold/fire control | Courses — hold dessert until mains are cleared | Medium | "Hold" items in order, "fire" them manually or by course grouping. |

### Billing and Payments

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Cash payment with change calculation | Most basic payment type | Low | Auto-calculate change. Support quick-tender buttons (100, 500, 1000 THB). |
| Credit/debit card payment recording | Record card payments with reference number | Low | POS records payment type + reference. Actual card processing is via external terminal (EDC machine). |
| QR payment — PromptPay | Dominant QR payment in Thailand. Every POS must support it. | Medium | Generate QR code with amount embedded (EMVCo standard), display on screen, confirm payment receipt. May need bank API for auto-confirmation or manual confirm by cashier. |
| QR payment — TrueMoney Wallet | Widely used Thai mobile wallet | Medium | TrueMoney merchant API integration. Similar flow to PromptPay but different API. |
| QR payment — LINE Pay (Rabbit LINE Pay) | Major Thai payment method via LINE app | Medium | LINE Pay merchant API. Thailand-specific integration. |
| Bill generation and printing | Print or display the bill before payment | Low | Thermal printer output. Must show items, prices, subtotal, tax, service charge, total. |
| Receipt printing | Print receipt after payment | Low | Must include tax invoice info for Thai tax compliance (VAT 7%). |
| Tax calculation (VAT 7%) | Thai legal requirement | Low | Configurable tax rate. Some items may be tax-exempt. Show tax breakdown on receipt. |
| Service charge (optional) | Common in Thai sit-down restaurants (10% typical) | Low | Configurable per-brand. Applied before tax. |
| Split bill — by item | Guests want to pay for their own items | Medium | Select items to move to a sub-bill, pay independently. |
| Split bill — by equal amount | "Split evenly among 4 people" | Low | Divide total by N. Handle rounding (last person pays remainder). |
| Split bill — by custom amount | "I'll pay 500, you pay the rest" | Low | Enter arbitrary amounts per split. |
| Merge bills | Combine tables when groups join together | Medium | Merge orders from multiple tables into one bill. Must handle different active orders cleanly. |
| Void / refund | Mistakes happen — must be able to cancel items or refund | Medium | Requires manager authorization. Must track void reasons for audit. |
| Discount application | Percentage or fixed amount discounts on items or whole bill | Low | Per-item discount, per-bill discount. Requires authorization for above-threshold discounts. |

### Promotions

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Voucher redemption | Core requirement — FoodStory replacement is driven by this gap | Medium | Scan/enter voucher code, validate (expiry, usage limits, applicable items), apply discount. |
| Coupon support | Percentage-off or fixed-amount coupons | Medium | Similar to vouchers but may be single-use vs multi-use, brand-specific, minimum spend rules. |
| Promotion rules engine | "Buy 2 get 1 free," "20% off after 9pm" | High | Time-based, quantity-based, combo-based promotions. This is the key differentiator vs FoodStory. |
| Promotion stacking rules | Can voucher + coupon + happy hour stack? | Medium | Must define: which promotions combine, which are exclusive, priority order. |

### Kitchen Operations

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Kitchen Display System (KDS) | Digital order display for kitchen staff | Medium | Real-time order display, organized by station or all-in-one. Status updates (new > in-progress > done). |
| Thermal printer ticket output | Many kitchens prefer paper tickets | Low | Print order to specific printer (food printer, drink printer, etc.). |
| Routing to correct station | Different items go to different stations (bar, grill, cold) | Medium | Configurable routing rules per menu category or item. |
| Order status tracking | Kitchen marks items as started/done, server sees status | Medium | Bidirectional: kitchen updates status, front-of-house sees progress. |
| Priority/rush orders | Mark orders as urgent | Low | Visual flag on KDS + audible alert. |

### Multi-Brand and Multi-Location

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Separate menus per brand | Each brand has distinct menu items and pricing | Medium | Brand > location > menu hierarchy. Same item can exist in multiple brands at different prices. |
| Brand-specific branding | Receipts, display show correct brand name/logo | Low | Configurable per brand: logo, name, address, tax ID. |
| Multi-location management | Central admin manages all locations | Medium | Location-level settings (printers, tables, tax), central menu management. |
| Role-based access control | Cashier vs manager vs admin permissions | Medium | Manager can void/refund/discount. Cashier handles normal flow. Admin configures system. |

### Reporting

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| End-of-day (EOD) summary | Cash-up and daily totals | Medium | Total sales by payment type, item-level breakdown, void/discount summary. Cash drawer reconciliation. |
| Shift-based reporting | Who sold what during their shift | Medium | Clock in/out per cashier, sales attribution. |
| Sales by item report | What's selling, what's not | Low | Quantity and revenue per menu item, per day. |

### ERP Integration

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Sales data sync to ERP | ERP needs transaction data for accounting | Medium | Push completed transactions (or daily summaries) to ERP via API. Retry on failure. |
| Menu/pricing sync from ERP | ERP is source of truth for items and prices | Medium | Pull menu updates from ERP. Handle conflicts (what if ERP updates mid-service?). |
| Inventory deduction sync | ERP tracks stock, POS reports consumption | High | Map menu items to ingredients, calculate deductions per sale, sync to ERP. Recipe/BOM mapping required. |

---

## Differentiators

Features that set this POS apart from FoodStory and competitors. Not expected, but create competitive advantage.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Advanced promotion engine** | FoodStory's biggest gap. Time-based, combo, tiered promotions with flexible rules. | High | This is THE reason to replace FoodStory. Invest heavily here. "Happy hour 5-7pm," "Buy 3 ramen get free gyoza," "Birthday month 15% off with voucher." |
| **Visual table map** | Drag-and-drop table layout, color-coded status (empty/occupied/bill-requested) | Medium | Most Thai POS systems use simple table lists. A visual map speeds up service in large restaurants. |
| **Real-time cross-brand dashboard** | See all brands/locations on one screen — sales, active orders, alerts | Medium | Unique to multi-brand operators. FoodStory doesn't support multi-brand natively. |
| **Smart QR auto-confirmation** | Auto-detect PromptPay payment receipt via bank notification API instead of manual cashier confirm | High | Most Thai POS systems require cashier to manually confirm QR payment. Auto-confirm eliminates errors and speeds checkout. Requires bank API integration (SCB, KBank, BBL offer these). |
| **Ingredient-level inventory tracking** | POS deducts ingredients (not just items) from stock per order | High | Recipe mapping: 1 ramen = 200g noodles + 300ml broth + 1 egg. Enables real-time stock alerts ("86 the tonkotsu — out of broth"). |
| **Multi-language menu support** | Thai + English (+ Japanese for ramen brand authenticity) | Low | Menu items with multiple language labels. Staff sees Thai, receipt prints both. |
| **Customer-facing payment display** | Second screen or tablet showing order summary + QR code to customer | Medium | Common in modern POS setups. Customer verifies order, scans QR directly. |
| **Configurable kitchen output** | Per-location choice of KDS, printer, or both — even per-station | Low | Listed in PROJECT.md requirements. Most POS systems force one or the other. |
| **Offline resilience queue** | Queue orders locally when network drops, sync when restored | High | PROJECT.md lists this as out of scope for v1, but it's a strong differentiator for reliability. |
| **Custom receipt templates** | Brand-specific receipt layouts with custom fields, QR for feedback | Low | Thai tax invoice compliance + brand personality. Most POS systems have rigid receipt formats. |

---

## Anti-Features

Features to explicitly NOT build. These add complexity without proportional value for this project.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Customer-facing self-order kiosk** | Separate product with different UX requirements. Adds scope without helping core cashier/server workflow. | Build clean API layer so a kiosk product could be built later as a separate app consuming the same backend. |
| **Online ordering / delivery integration** | Delivery platforms (GrabFood, LINE MAN, Foodpanda) have their own POS integrations. Building this conflates two products. | Expose order API that delivery middleware could push into, but don't build the integration in v1. |
| **Loyalty/points program** | Complex to design well (earn rates, tiers, redemption rules). Voucher/coupon system covers 80% of the promotional need. | Ship vouchers/coupons first. Design the data model to support loyalty later (customer identity, transaction history). |
| **Full accounting module** | ERP already handles this. Duplicating accounting in POS creates data conflicts. | Sync clean transaction data to ERP. Let ERP handle GL entries, P&L, balance sheets. |
| **Customer mobile app for ordering** | Different product entirely. In-house POS is for staff, not customers. | If needed later, build as separate app consuming same menu/order API. |
| **Complex employee scheduling** | HR/scheduling tools exist. POS only needs to know who's clocked in for shift reporting. | Simple clock-in/clock-out. No shift planning, no availability management. |
| **Built-in payment gateway** | Thailand payment landscape requires multiple gateways (2C2P, Omise/Opn, bank direct). Building your own is regulated. | Integrate with established Thai payment gateways. Use their SDKs. Don't process payments directly. |
| **Offline-first architecture for v1** | Massive complexity (conflict resolution, local DB sync, queue management). PROJECT.md explicitly defers this. | Design for online-first. Add offline queue as a v2 differentiator after core flow is proven stable. |
| **AI-powered menu recommendations** | Trendy but zero value for cashier-operated POS. Staff knows the menu. | If analytics are needed later, build them as reporting features, not real-time suggestions. |
| **Multi-currency support** | All locations are in Thailand. Single currency (THB). | Hardcode THB. If international expansion happens, that's a different product. |

---

## Feature Dependencies

```
Menu Management ─────────────────┐
                                 v
                          Order Creation
                           /    |     \
                          v     v      v
                    Table    Counter   Kitchen Routing
                  Assignment  Queue        |
                      |        |           v
                      v        v      KDS / Printer
                   Billing ◄───┘
                   /  |  \
                  v   v   v
              Split  Merge  Discount/Promo
              Bill   Bill     |
                \    |       v
                 v   v    Voucher/Coupon
                  Payment      |
                 / | | \       v
                v  v v  v   Promotion Rules Engine
            Cash Card QR  (depends on voucher/coupon infra)
                      |
                      v
              PromptPay / TrueMoney / LINE Pay
                      |
                      v
                   Receipt
                      |
                      v
               EOD Reporting
                      |
                      v
               ERP Sync (Sales)

Separate dependency chains:
  ERP Menu Sync ──> Menu Management (menu pulled from ERP)
  ERP Inventory Sync ──> Order Completion (stock deductions on sale)
  Multi-Brand Config ──> Menu Management (menus scoped to brand)
  RBAC ──> Void/Refund, Discount (authorization gates)
```

### Key dependency insights:

1. **Menu Management is the foundation.** Nothing works without items to sell. And since ERP is the source of truth, ERP menu sync should be built early.
2. **Order Creation is the critical path.** Every downstream feature (billing, kitchen, payments) depends on a working order.
3. **Payment methods are parallel.** Cash, card, and QR can be built independently once billing works.
4. **Promotions sit on top of billing.** Don't build the promotion engine until basic billing (subtotal, tax, service charge, discount) is solid.
5. **KDS and printers are parallel to billing.** Kitchen output is triggered at order submission, not at payment. These can be built alongside billing work.
6. **ERP sync is a background concern.** Core POS must work without ERP being available. Sync is asynchronous and can fail/retry independently.

---

## MVP Recommendation

### Must ship for v1 (one location fully on this POS, FoodStory eliminated):

1. **Menu management** with ERP sync for items/pricing — foundation of everything
2. **Order creation** with modifiers, notes, table assignment, and counter mode
3. **Kitchen output** — at minimum thermal printer tickets; KDS can follow fast
4. **Billing** with tax (VAT 7%), service charge, basic discounts
5. **Cash payment** — simplest payment path, gets the POS functional
6. **QR payment — PromptPay** — most used QR method in Thailand, higher priority than card
7. **Card payment recording** — record-only (EDC machine handles actual processing)
8. **Split bill by item** — most common split scenario in Thai restaurants
9. **Voucher/coupon redemption** — the primary reason for replacing FoodStory
10. **Receipt printing** — thermal printer, Thai tax invoice compliant
11. **EOD summary report** — staff needs daily cash-up
12. **ERP sales data sync** — accounting must continue working
13. **Multi-brand menu separation** — architecture from day one per PROJECT.md constraint
14. **RBAC** — at minimum cashier vs manager roles

### Defer to v1.1 or v2:

- **Merge bills**: Less common than split. Can be worked around by manually re-entering items. Ship after split bill is proven.
- **TrueMoney / LINE Pay**: PromptPay covers the majority of QR payments. Add other wallets after PromptPay integration is stable.
- **Advanced promotion rules engine**: Ship basic voucher/coupon first. Time-based and combo promotions are v1.1.
- **Ingredient-level inventory sync**: Complex BOM mapping. Start with item-level sales sync to ERP; let ERP handle ingredient math initially.
- **Visual table map**: Simple table number list works for v1. Visual map is polish, not function.
- **Shift-based reporting**: EOD summary is sufficient for launch. Per-shift breakdown is a refinement.
- **QR auto-confirmation**: Manual confirm works. Auto-confirm via bank API is a reliability improvement for later.
- **Offline resilience**: Explicitly out of scope per PROJECT.md. Design for it, don't build it.

---

## Thailand Market-Specific Considerations

| Consideration | Impact | Notes |
|---------------|--------|-------|
| VAT 7% is mandatory on receipts | Tax compliance — legal requirement | Must show tax ID, VAT amount, tax invoice number on receipts |
| PromptPay uses EMVCo QR standard | QR generation must follow BOT (Bank of Thailand) spec | Use standardized QR payload format. Amount embedded in QR. |
| TrueMoney requires merchant registration | Cannot just generate QR — need merchant account with Ascend | Plan for merchant onboarding process per brand/location |
| Thai script on receipts and KDS | Fonts, encoding, thermal printer compatibility | Thermal printers must support Thai characters (most modern ones do with correct code page) |
| Service charge is pre-tax in Thailand | Calculation order: subtotal + service charge, then VAT on combined | Common mistake: applying VAT then service charge gives wrong total |
| Cash denomination in Thailand | Common bills: 20, 50, 100, 500, 1000 THB | Quick-tender buttons should match these denominations |
| FoodStory is the incumbent to beat | Staff already trained on FoodStory workflow | UI patterns should not be radically different from what Thai restaurant staff expect |

---

## Sources

- Domain knowledge of restaurant POS systems (MEDIUM confidence)
- PROJECT.md requirements and constraints (HIGH confidence — direct project input)
- Knowledge of Thai payment ecosystem (PromptPay EMVCo, TrueMoney, LINE Pay) (MEDIUM confidence)
- Knowledge of Thai tax requirements (VAT 7%, tax invoice) (MEDIUM confidence)
- Note: Web search was unavailable for live verification of current FoodStory features, competitor analysis, and latest Thai payment API docs. Recommend validating PromptPay/TrueMoney/LINE Pay integration requirements against current API documentation before implementation.
