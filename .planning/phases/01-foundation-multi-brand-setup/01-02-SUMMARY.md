---
phase: 01-foundation-multi-brand-setup
plan: 02
subsystem: auth
tags: [jwt, jose, rbac, bcryptjs, next.js-proxy, pin-login, session-cookies]

# Dependency graph
requires:
  - phase: 01-01
    provides: "Database schema with users table (role enum, pinHash, passwordHash) and terminals table"
provides:
  - JWT session creation and verification using jose (HS256, 12h expiry)
  - Static RBAC permission map for admin, manager, cashier roles
  - Password login API route (POST /api/auth/login)
  - PIN login API route (POST /api/auth/pin-login)
  - Session verification endpoint (GET /api/auth/verify)
  - Route protection via proxy.ts with public/admin/POS routing
affects: [01-03, 01-04, 02-01]

# Tech tracking
tech-stack:
  added: []
  patterns: [dual-auth-pin-password, jwt-httponly-cookie, static-rbac-permission-map, proxy-route-protection]

key-files:
  created:
    - src/types/auth.ts
    - src/lib/auth.ts
    - src/lib/permissions.ts
    - src/lib/__tests__/permissions.test.ts
    - src/app/api/auth/login/route.ts
    - src/app/api/auth/pin-login/route.ts
    - src/app/api/auth/verify/route.ts
    - src/proxy.ts
  modified: []

key-decisions:
  - "Static RBAC with 8 resources (brands, locations, staff, menu, settings, reports, orders, sync) rather than 6 from research -- added orders and sync for completeness"
  - "Invalid session cookies cleared on redirect to prevent redirect loops"

patterns-established:
  - "JWT sessions via jose with HS256 and 12h expiry, stored in httpOnly cookie named 'session'"
  - "Static permission map in code (not database) for 3 fixed roles"
  - "PIN login resolves terminal -> location -> users, iterates to find PIN match"
  - "proxy.ts route protection: public routes passthrough, admin requires admin/manager, cashier redirected to /menu"

requirements-completed: [MBML-05, UIUX-03]

# Metrics
duration: 2min
completed: 2026-03-09
---

# Phase 1 Plan 2: Auth & RBAC Summary

**Dual auth (PIN + password) with JWT sessions via jose, static RBAC for 3 roles, and proxy.ts route protection**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-09T15:34:52Z
- **Completed:** 2026-03-09T15:37:09Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- JWT session library using jose with HS256 signing and 12-hour expiry (shift-length), stored in httpOnly cookies
- Static RBAC permission map covering 8 resources and 5 actions across admin, manager, and cashier roles with 29 unit tests passing
- Dual authentication: password login for admin/manager and PIN login for floor staff via terminal context
- Route protection proxy enforcing auth on all non-public routes with role-based admin access control

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Add failing permission tests** - `ee384ce` (test)
2. **Task 1 GREEN: Implement auth types, JWT sessions, and RBAC permissions** - `a760a88` (feat)
3. **Task 2: Implement auth API routes and route protection proxy** - `d5deaa0` (feat)

## Files Created/Modified

- `src/types/auth.ts` - SessionPayload, LoginRequest, PinLoginRequest type definitions
- `src/lib/auth.ts` - JWT createSession and verifySession using jose
- `src/lib/permissions.ts` - Static RBAC permission map with hasPermission and requirePermission
- `src/lib/__tests__/permissions.test.ts` - 29 unit tests covering all role/resource/action combinations
- `src/app/api/auth/login/route.ts` - Email+password login with bcryptjs validation, JWT cookie response
- `src/app/api/auth/pin-login/route.ts` - PIN login with terminal lookup for brand/location context
- `src/app/api/auth/verify/route.ts` - Session verification returning user payload
- `src/proxy.ts` - Route protection redirecting unauthenticated users, blocking cashiers from /admin

## Decisions Made

- Extended RBAC resources to 8 (added orders and sync beyond the 6 in research) for completeness -- orders needed for Phase 2, sync for ERP integration
- Clear invalid session cookies on redirect to prevent redirect loops when token expires
- PIN login iterates all active users at a location to find match (acceptable for small staff counts per location)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

Ensure `AUTH_SECRET` environment variable is set in `.env.local`:
```bash
echo "AUTH_SECRET=$(openssl rand -base64 32)" >> .env.local
```

## Next Phase Readiness

- Auth system complete: both login flows, session management, and route protection operational
- RBAC permissions ready for use in admin panel (Plan 01-03) and POS interface (Plan 01-04)
- proxy.ts enforces authentication on all protected routes
- Permission checks available via `hasPermission` and `requirePermission` for API-level authorization

## Self-Check: PASSED

All 8 key files verified present. All 3 commits verified in git log.

---
*Phase: 01-foundation-multi-brand-setup*
*Completed: 2026-03-09*
