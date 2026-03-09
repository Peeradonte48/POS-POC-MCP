---
phase: 2
slug: order-flow-table-management
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x |
| **Config file** | `vitest.config.ts` (exists) |
| **Quick run command** | `npx vitest run src/app/api/__tests__/orders.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/app/api/__tests__/orders.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 0 | ORDR-01 | unit | `npx vitest run src/app/api/__tests__/orders.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 0 | ORDR-06 | unit | `npx vitest run src/app/api/__tests__/orders.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | ORDR-01 | unit | `npx vitest run src/app/api/__tests__/orders.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | ORDR-02 | unit | `npx vitest run src/app/api/__tests__/orders.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 1 | ORDR-04 | unit | `npx vitest run src/app/api/__tests__/orders.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-04 | 02 | 1 | ORDR-05 | unit | `npx vitest run src/app/api/__tests__/orders.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-05 | 02 | 1 | ORDR-06 | unit | `npx vitest run src/app/api/__tests__/orders.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | ORDR-01 | manual | — | ✅ | ⬜ pending |
| 02-03-02 | 03 | 2 | ORDR-03 | manual | — | ✅ | ⬜ pending |
| 02-03-03 | 03 | 2 | ORDR-04 | manual | — | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/app/api/__tests__/orders.test.ts` — stubs and business logic tests covering ORDR-01 through ORDR-06 (zod schema validation, order number increment, sent/unsent item rules, void authorization, table transfer, counter orders)

*Following established pattern from `src/app/api/__tests__/brands.test.ts`: test zod schemas and business logic, not DB queries.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Table grid shows order total and elapsed time | ORDR-03 | Real-time UI render, no automated assertion | Open /tables, create an order, verify table card shows ฿amount and Xmin |
| Tapping occupied table loads existing order | ORDR-03 | Navigation flow with state | Tap occupied table card, verify order panel pre-loads items |
| Send to Kitchen sends all pending items as a round | ORDR-01 | Full flow requires DB + React Query + UI | Add items, tap Send, verify order panel shows sent group |
| Order history shows today's completed orders | ORDR-03 | Read-only list from server | Complete an order, open history, verify it appears |
| Manager PIN popup appears for sent item void | ORDR-06 | Manager auth dialog interaction | Add+send an item, try to void it, verify PIN modal appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
