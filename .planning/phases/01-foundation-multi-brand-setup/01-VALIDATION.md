---
phase: 1
slug: foundation-multi-brand-setup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | MENU-01 | unit | `npx vitest run src/db/__tests__/menu-queries.test.ts -t "categories"` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | MENU-02 | unit | `npx vitest run src/db/__tests__/menu-queries.test.ts -t "modifiers"` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | MENU-03 | unit | `npx vitest run src/components/__tests__/modifier-sheet.test.tsx -t "notes"` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 1 | MENU-04 | unit | `npx vitest run src/lib/__tests__/erp-sync.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-05 | 01 | 1 | MENU-05 | unit | `npx vitest run src/db/__tests__/menu-queries.test.ts -t "brand scope"` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | MBML-01 | unit | `npx vitest run src/db/__tests__/brand-queries.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | MBML-02 | unit | `npx vitest run src/db/__tests__/brand-queries.test.ts -t "branding"` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 1 | MBML-03 | integration | `npx vitest run src/app/api/__tests__/brands.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-04 | 02 | 1 | MBML-04 | unit | `npx vitest run src/db/__tests__/location-queries.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-05 | 02 | 1 | MBML-05 | unit | `npx vitest run src/lib/__tests__/permissions.test.ts` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 1 | UIUX-03 | smoke | `npx vitest run src/components/__tests__/smoke.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — Vitest configuration with Next.js plugin, path aliases
- [ ] `src/db/__tests__/menu-queries.test.ts` — stubs for MENU-01, MENU-02, MENU-05
- [ ] `src/db/__tests__/brand-queries.test.ts` — stubs for MBML-01, MBML-02
- [ ] `src/db/__tests__/location-queries.test.ts` — stubs for MBML-04
- [ ] `src/lib/__tests__/permissions.test.ts` — stubs for MBML-05
- [ ] `src/lib/__tests__/erp-sync.test.ts` — stubs for MENU-04
- [ ] `src/components/__tests__/modifier-sheet.test.tsx` — stubs for MENU-03
- [ ] `src/components/__tests__/smoke.test.tsx` — stubs for UIUX-03
- [ ] `src/app/api/__tests__/brands.test.ts` — stubs for MBML-03
- [ ] Framework install: `npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Menu item thumbnails render correctly | MENU-01 | Visual check | Browse menu grid, verify images load and cards display properly |
| Admin brand settings tabbed UI | MBML-01 | Visual check | Navigate admin > brands, verify tabs switch correctly |
| PIN pad login flow | MBML-05 | E2E interaction | Enter PIN, verify correct user logged in with appropriate role |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
