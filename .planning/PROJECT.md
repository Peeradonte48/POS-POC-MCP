# A RAMEN POS

## What This Is

A fully integrated, multi-brand POS platform for restaurant operations that replaces FoodStory POS. It handles order taking (table service and counter), kitchen communication (KDS and thermal printers), flexible billing (split, merge, vouchers/coupons), all payment types (cash, cards, QR/mobile pay), and syncs sales, inventory, and menu data with the in-house ERP system. Built for tablets and desktop terminals used by front-line cashiers and servers.

## Core Value

Cashiers and servers can take orders and process payments without friction — the order-to-payment flow must work reliably every time, because a broken POS stops the entire restaurant.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Multi-brand support with separate menus, branding, and pricing per restaurant concept
- [ ] Table service ordering — waiter takes order at table, sends to kitchen
- [ ] Counter/queue ordering — customer orders at counter, picks up when ready
- [ ] Kitchen display system (KDS) showing incoming orders
- [ ] Thermal printer ticket support for kitchen
- [ ] Configurable kitchen output per location (KDS, printer, or both)
- [ ] Menu management with categories, items, modifiers, and pricing
- [ ] Voucher and coupon promotion system
- [ ] Cash payments
- [ ] Credit/debit card payments
- [ ] QR / mobile payments (PromptPay, TrueMoney, LINE Pay)
- [ ] Split bill by item, by person, or by amount
- [ ] Merge bills from multiple tables into one bill
- [ ] Table management — assign orders to tables, transfer between tables
- [ ] ERP sync — sales/revenue data (transaction totals, daily summaries, per-item sales)
- [ ] ERP sync — inventory (stock deductions, ingredient tracking)
- [ ] ERP sync — menu/pricing (ERP manages items, POS pulls updates)
- [ ] Daily sales reporting and end-of-day summary
- [ ] Multi-location support from single platform
- [ ] Tablet (iPad/Android) interface for servers
- [ ] Desktop/terminal interface for cashier stations

### Out of Scope

- Mobile phone ordering for waiters — tablets and terminals cover the use case
- Customer-facing self-ordering kiosk — not needed for v1
- Online ordering / delivery integration — separate concern from in-house POS
- Loyalty/points program — v1 focuses on vouchers/coupons first
- Offline mode — nice to have but not v1 critical, reliable connection assumed
- Full accounting module — handled by ERP, POS just syncs data

## Context

- Replacing FoodStory POS which lacks customization and promotion features (vouchers/coupons)
- Multiple restaurant brands under one organization, each with distinct menus and pricing
- In-house ERP is web-based — POS will integrate via APIs
- Both table service and counter service restaurants in the portfolio
- Staff are cashiers and servers — UI must be fast and intuitive, minimal training
- v1 success = one location fully running on this POS, FoodStory eliminated
- shadcn/ui already added as dev dependency — signals React/Next.js direction

## Constraints

- **Devices**: Must work on tablets (iPad/Android) and desktop terminals — responsive/adaptive UI required
- **Performance**: Sub-second response for order entry and payment — staff can't wait during rush
- **Integration**: Must integrate with existing web-based in-house ERP via API
- **Multi-brand**: Architecture must support multiple brands from day one, not bolted on later
- **Reliability**: POS downtime = lost revenue — must be stable and recoverable

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Replace FoodStory entirely | Customization limits and missing promotion features make it unsuitable | — Pending |
| Web-based POS (not native app) | Aligns with ERP stack, easier deployment across devices | — Pending |
| shadcn/ui for all UI components | Already installed, consistent design system, MCP available for component search | — Pending |
| Vouchers/coupons over loyalty for v1 | Immediate business need, loyalty can come in v2 | — Pending |
| ERP as source of truth for menu/pricing | Centralizes management, POS consumes | — Pending |

---
*Last updated: 2026-03-09 after initialization*
