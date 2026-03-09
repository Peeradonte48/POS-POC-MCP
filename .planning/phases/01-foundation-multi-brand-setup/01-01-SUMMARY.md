---
phase: 01-foundation-multi-brand-setup
plan: 01
subsystem: database
tags: [next.js, drizzle-orm, postgresql, shadcn-ui, vitest, tailwind-v4, multi-tenant]

# Dependency graph
requires: []
provides:
  - Next.js 16 project scaffold with Tailwind v4, shadcn/ui components
  - Full Drizzle ORM schema for multi-brand POS (brands, locations, users, terminals, menu, sync_logs)
  - Seed script with 2 brands, realistic menu data, staff with hashed credentials
  - Vitest test infrastructure with schema-level tests
  - Docker Compose for PostgreSQL 16
affects: [01-02, 01-03, 01-04, 02-01]

# Tech tracking
tech-stack:
  added: [next@16.1.6, react@19.2.3, drizzle-orm@0.45, pg, jose, bcryptjs, zod, tanstack-react-query, sonner, nuqs, lucide-react, vitest, shadcn-ui@4, tailwindcss@4]
  patterns: [shared-schema-multi-tenancy, brandId-scoping, uuid-primary-keys, drizzle-relations-v0.45]

key-files:
  created:
    - src/db/schema/brands.ts
    - src/db/schema/locations.ts
    - src/db/schema/users.ts
    - src/db/schema/terminals.ts
    - src/db/schema/menu.ts
    - src/db/schema/sync-logs.ts
    - src/db/schema/index.ts
    - src/db/relations.ts
    - src/db/index.ts
    - src/db/seed.ts
    - docker-compose.yml
    - drizzle.config.ts
    - vitest.config.ts
  modified:
    - package.json
    - src/app/page.tsx

key-decisions:
  - "Used sonner instead of toast component (toast deprecated in shadcn v4)"
  - "Scaffolded Next.js in temp dir to work around npm naming restriction on uppercase directory names"

patterns-established:
  - "Shared-schema multi-tenancy: all tables scoped by brandId FK to brands table"
  - "UUID primary keys on all tables via defaultRandom()"
  - "Dual auth columns: pinHash for floor staff, passwordHash for admin/manager"
  - "JSONB settings column on locations for flexible per-location config"
  - "Modifier system: modifier_groups (single_select/multi_select) with modifier_options (price adjustments)"

requirements-completed: [MBML-01, MBML-02, MBML-04]

# Metrics
duration: 8min
completed: 2026-03-09
---

# Phase 1 Plan 1: Project Scaffolding & Database Schema Summary

**Next.js 16 scaffold with Drizzle ORM multi-brand schema (9 tables), shadcn/ui components, seed data for 2 brands with 30 menu items**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-09T15:23:33Z
- **Completed:** 2026-03-09T15:31:25Z
- **Tasks:** 2
- **Files modified:** 27

## Accomplishments

- Next.js 16 project running with Tailwind v4, shadcn/ui (12 components), and all dependencies installed
- Complete Drizzle ORM schema: brands, locations, users (with role enum), terminals, menu_categories (hierarchical), menu_items, modifier_groups, modifier_options, sync_logs
- Seed script creates 2 brands (A RAMEN, Burger Lab) with 5 categories and 15 menu items each, modifiers, staff (1 admin, 2 managers, 4 cashiers), and terminals
- 21 schema-level unit tests passing via Vitest

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js 16 project with all dependencies and shadcn/ui** - `24ae511` (feat)
2. **Task 2 RED: Add failing schema tests** - `95a5145` (test)
3. **Task 2 GREEN: Implement database schema, relations, and seed data** - `16d8e07` (feat)

## Files Created/Modified

- `package.json` - All dependencies, scripts for dev/build/test/db operations
- `docker-compose.yml` - PostgreSQL 16 Alpine service
- `drizzle.config.ts` - Drizzle Kit config pointing to schema
- `vitest.config.ts` - Vitest with React plugin, path aliases, jsdom
- `src/app/page.tsx` - Root page redirects to /login
- `src/db/schema/brands.ts` - Brand table with logo, name, address, taxId, service charge, VAT
- `src/db/schema/locations.ts` - Location table with brandId FK, settings JSONB
- `src/db/schema/users.ts` - Users table with role enum, pinHash, passwordHash
- `src/db/schema/terminals.ts` - Terminals table brand+location scoped
- `src/db/schema/menu.ts` - Menu categories, items, modifier groups, modifier options
- `src/db/schema/sync-logs.ts` - ERP sync logging table
- `src/db/schema/index.ts` - Re-exports all schema tables
- `src/db/relations.ts` - All Drizzle relations (v0.45 stable API)
- `src/db/index.ts` - Database connection pool and drizzle instance
- `src/db/seed.ts` - Development seed data for 2 brands
- `src/db/__tests__/brand-queries.test.ts` - Brand schema shape tests
- `src/db/__tests__/location-queries.test.ts` - Location schema shape tests
- `src/db/__tests__/menu-queries.test.ts` - Menu schema shape tests (categories, items, modifiers, brand scope)
- `src/components/ui/*.tsx` - 12 shadcn/ui components (button, input, card, dialog, sheet, tabs, scroll-area, separator, badge, avatar, dropdown-menu, sonner)

## Decisions Made

- Used sonner component instead of toast (toast deprecated in shadcn v4)
- Scaffolded Next.js in temp directory to work around npm naming restriction on uppercase directory names, then copied files
- Used Drizzle ORM v0.45.x stable relations API (not v1 beta defineRelations)
- Service charge as brand-level default (not location-level) -- matches plan spec

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] shadcn toast component deprecated**
- **Found during:** Task 1 (shadcn component installation)
- **Issue:** `npx shadcn add toast` failed -- toast component is deprecated in shadcn v4
- **Fix:** Replaced with `sonner` component (shadcn's recommended replacement)
- **Files modified:** src/components/ui/sonner.tsx
- **Verification:** Component installs successfully, build passes
- **Committed in:** 24ae511

**2. [Rule 3 - Blocking] npm naming restriction on uppercase directory**
- **Found during:** Task 1 (create-next-app initialization)
- **Issue:** `npx create-next-app . --yes` failed because directory name "POS" contains uppercase letters
- **Fix:** Created scaffold in /tmp/nextjs-scaffold, then copied all files to project root
- **Verification:** All scaffold files present, next build passes
- **Committed in:** 24ae511

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes necessary to unblock scaffold creation. No scope creep.

## Issues Encountered

None beyond the auto-fixed deviations above.

## User Setup Required

To run the database locally:
```bash
docker compose up -d         # Start PostgreSQL
npx drizzle-kit push         # Create tables
npm run db:seed              # Populate seed data
```

## Next Phase Readiness

- Project scaffold complete with all dependencies
- Database schema ready for auth system (Plan 01-02)
- Users table supports dual auth (PIN + password) with role enum
- shadcn/ui components available for admin panel (Plan 01-03) and POS interface (Plan 01-04)

## Self-Check: PASSED

All 13 key files verified present. All 3 commits verified in git log.

---
*Phase: 01-foundation-multi-brand-setup*
*Completed: 2026-03-09*
