---
status: testing
phase: 02-order-flow-table-management
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md, 02-05-SUMMARY.md]
started: 2026-03-10T00:00:00Z
updated: 2026-03-10T00:00:00Z
---

## Current Test

number: 1
name: Cold Start Smoke Test
expected: |
  Kill any running dev server. Start fresh with `npm run dev` (or equivalent).
  The server should boot without errors. Navigate to /login — the PIN pad loads,
  you can select a terminal, and entering the correct PIN logs you in. The app
  should work end-to-end without requiring a DB re-seed (schema changes were
  applied via drizzle-kit push, not a fresh seed).
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running dev server. Start fresh with `npm run dev`. Server boots without errors. Navigate to /login — PIN pad loads, terminal selection works, correct PIN logs you in. App functions without re-seeding.
result: [pending]

### 2. Table Grid — Status Colors
expected: On /tables, free tables show green styling, occupied tables show amber/warm styling. If any table has been open 90+ minutes it shows red. Color coding is visible at a glance without tapping any table.
result: [pending]

### 3. Occupied Table — Order Info
expected: An occupied table card shows the running order total in Thai Baht (e.g., ฿450) and how long it has been open (e.g., "25 min"). Both pieces of info update on the 30-second polling interval.
result: [pending]

### 4. Tap Occupied Table → Load Existing Order
expected: Tapping an occupied table card navigates to /menu. The order panel on the right (or floating cart on tablet) shows the existing order items already sent to kitchen — displayed with a "Sent" badge and muted styling, grouped by round number.
result: [pending]

### 5. Order History Sheet
expected: The /tables page header has an "Order History" button. Tapping it opens a bottom sheet showing today's completed orders. Each row shows the order number, table label or "Takeaway", item count, total in Thai Baht, and completion time. The sheet is empty if no orders were completed today.
result: [pending]

### 6. Create a New Order
expected: Tap a free table → navigate to /menu → add 2-3 items (with modifiers if desired) → tap "Send to Kitchen" (shows item count). The button is disabled until items are added. After sending, the items appear in the order panel as sent (muted, "Sent" badge). The table on /tables turns amber.
result: [pending]

### 7. Add a Round (Second Send)
expected: From the menu page of an existing order, add more items. The Send button shows the new pending item count. Tap "Send to Kitchen" — new items are sent as round 2. The order panel shows the original round and the new round, each grouped separately with round labels.
result: [pending]

### 8. Order Panel — Sent vs Pending Grouping
expected: When there are both sent items and new (unsent) items in the panel, sent items appear at the top with a round label and muted/greyed styling. New items appear below with a "New items" label. The two groups are visually distinct.
result: [pending]

### 9. Send Button — Dynamic Item Count
expected: The "Send to Kitchen" button shows the number of pending items, e.g. "Send 3 items". It is disabled when there are no pending items. Removing a pending item decrements the count in real time.
result: [pending]

### 10. Remove an Unsent Item
expected: While items are still in the "New items" (unsent) section of the order panel, tapping the trash icon on an unsent item removes it immediately — no confirmation dialog, no PIN required.
result: [pending]

### 11. Void a Sent Item (Manager PIN)
expected: Tap the trash icon on a sent (already-sent-to-kitchen) item. A dialog appears with 4 void reason options ("Customer changed mind", "Wrong item", "Food quality", "Staff error") and an optional note field. After selecting a reason, a manager PIN pad appears and auto-submits after 4 digits. A valid manager PIN voids the item; it disappears from the order panel. An invalid PIN shows an error and clears the pad.
result: [pending]

### 12. Void an Entire Order (Manager PIN)
expected: From an open order, a "Void Order" button appears in the order panel footer. Tapping it opens the same VoidReasonDialog. After selecting a reason and entering a valid manager PIN, the entire order is voided — all items removed, the table returns to free (green) on /tables.
result: [pending]

## Summary

total: 12
passed: 0
issues: 0
pending: 12
skipped: 0

## Gaps

[none yet]
