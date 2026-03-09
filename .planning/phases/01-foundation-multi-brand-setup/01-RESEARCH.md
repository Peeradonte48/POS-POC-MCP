# Phase 1: Foundation & Multi-Brand Setup - Research

**Researched:** 2026-03-09
**Domain:** Next.js full-stack app with multi-brand POS architecture, RBAC, menu system, ERP sync
**Confidence:** HIGH

## Summary

Phase 1 establishes the entire technical foundation for the POS system: database schema, multi-brand architecture, authentication with dual login methods (PIN for floor staff, username+password for admin/manager), role-based access control, menu browsing UI, and ERP menu sync. The project is greenfield -- only shadcn v4 is installed as a dev dependency. Everything else must be set up from scratch.

The current stable Next.js version is 16.x (released October 2025), not 15 as previously noted in project research. The project context references "Next.js 15, React 19" but Next.js 16 is now the actively maintained version with React 19.2, Turbopack as default bundler, and important API changes (async params/cookies/headers, middleware renamed to proxy). Since this is a greenfield project, starting with Next.js 16 avoids a future migration. Drizzle ORM stable is 0.45.x with v1.0 in beta.

**Primary recommendation:** Use Next.js 16 + Drizzle ORM 0.45.x + PostgreSQL with a shared-schema multi-tenancy approach (brandId column on tenant-scoped tables). Roll custom auth with JWT sessions rather than Better Auth, because POS-specific requirements (PIN login, quick user switching, terminal pre-assignment, inline manager authorization) are too specialized for general-purpose auth libraries.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- PIN code for cashiers/servers (4-6 digit, fast tap-in on tablets), username+password for admin/manager portal
- Quick user switching on POS terminals -- terminal stays active, staff tap PIN to switch user instantly, no full logout required
- Manager authorization uses inline PIN prompt -- popup appears on current screen, manager enters PIN to authorize (voids, discounts), cashier stays in same flow
- Terminals are pre-assigned to a brand+location by admin -- staff just see brand name, location, and PIN entry on login screen. No brand/location selector at login time
- Category sidebar on left + item grid in main area -- standard POS layout with fast category switching
- Menu item cards show thumbnail images with item name and price -- images managed via ERP sync
- Modifier selection via bottom sheet/drawer -- slides up from bottom when item is tapped, shows modifier options (single-select, multi-select), quantity stepper, and notes field
- Current order summary always visible in right panel -- three-column layout: categories | item grid | order
- Separate /admin route with its own sidebar navigation layout -- clean separation from POS floor interface
- Manager gets limited admin panel -- can see their location's staff, view menu (read-only), and run location reports
- Menu is read-only in admin panel -- ERP is source of truth, admin has "Sync Menu" button and shows sync status
- Brand settings organized with tabbed settings page -- tabs for General, Billing, and Locations

### Claude's Discretion
- ERP sync mechanism (polling interval, webhook, manual-only)
- Database schema design (table structure, relationships, indexes)
- Auth token/session management implementation
- Color scheme and exact visual styling within shadcn/ui
- Loading states, error states, empty states throughout

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MENU-01 | Staff can browse menu organized by categories and subcategories | Three-column POS layout pattern, shadcn/ui ScrollArea + grid components, hierarchical category schema |
| MENU-02 | Menu items have modifiers and options (single-select, multi-select) with price adjustments | Modifier/option schema with modifier_type enum, bottom sheet UI pattern with shadcn/ui Sheet component |
| MENU-03 | Staff can add per-item notes and special instructions | Textarea in modifier bottom sheet, notes field on order_item (schema prepared for Phase 2) |
| MENU-04 | Menu items and pricing are synced from ERP as source of truth | ERP sync service with manual trigger + configurable polling, sync_status tracking table |
| MENU-05 | Each brand has its own separate menu with distinct items and pricing | brandId foreign key on menu_categories and menu_items tables, brand-scoped API queries |
| MBML-01 | System supports multiple restaurant brands with separate configurations | brands table with config JSON, shared-schema multi-tenancy via brandId |
| MBML-02 | Each brand has its own branding (logo, name, address, tax ID) on receipts | Brand settings columns: logo_url, name, address, tax_id stored in brands table |
| MBML-03 | Central admin can manage all locations from single platform | Admin role has cross-brand access, /admin/brands and /admin/locations routes |
| MBML-04 | Location-level settings for printers, tables, tax, and service charge | locations table with settings JSON column for printer config, service_charge_pct, vat_config |
| MBML-05 | Role-based access control (cashier, manager, admin) with appropriate permissions | Custom RBAC with role enum + permission map, middleware-based route protection |
| UIUX-03 | All UI components built with shadcn/ui component library | shadcn v4 with Tailwind CSS v4, component generation via CLI, Radix primitives |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | ^16.1 | Full-stack React framework | Latest stable, Turbopack default, async APIs, React 19.2 |
| react / react-dom | ^19.2 | UI library | Bundled with Next.js 16, Server Components stable |
| drizzle-orm | ^0.45 | Type-safe SQL ORM | Best TypeScript DX, SQL-like API, no runtime overhead |
| drizzle-kit | ^0.30 | Schema migrations CLI | Paired with drizzle-orm for push/generate/migrate |
| pg | ^8.13 | PostgreSQL driver | Standard Node.js PostgreSQL client |
| shadcn (CLI) | ^4.0 | UI component generator | Already installed, generates accessible Radix-based components |
| tailwindcss | ^4.0 | Utility-first CSS | Required by shadcn v4, no config file needed (CSS-based) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jose | ^6.0 | JWT signing/verification | Auth tokens -- lightweight, Web Crypto API based, edge-compatible |
| bcryptjs | ^2.4 | Password hashing | Hash admin passwords and PIN codes |
| zod | ^3.24 | Schema validation | Validate API inputs, form data, ERP sync payloads |
| @tanstack/react-query | ^5.x | Server state management | Client-side data fetching, cache invalidation, optimistic updates |
| nuqs | ^2.x | URL search params state | Type-safe URL state for admin filters, pagination |
| sonner | ^2.x | Toast notifications | Success/error feedback (shadcn/ui compatible) |
| lucide-react | ^0.460 | Icons | Icon library used by shadcn/ui components |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom JWT auth | Better Auth | Better Auth has RBAC plugin + Drizzle adapter, but POS PIN-login, quick user switching, and terminal pre-assignment are too specialized. Custom auth gives full control over these flows |
| Custom JWT auth | NextAuth/Auth.js v5 | Auth.js was absorbed into Better Auth project; v5 never reached stable release; avoid |
| Drizzle ORM | Prisma | Prisma has heavier runtime, slower cold starts, less SQL control. Drizzle is more performant for POS use case |
| jose | jsonwebtoken | jose is ESM-native, edge-compatible, lighter; jsonwebtoken is CommonJS legacy |
| @tanstack/react-query | SWR | TanStack Query has richer features (mutations, optimistic updates, devtools) needed for POS operations |

**Installation:**
```bash
# Initialize Next.js 16 project (from project root, or in-place if restructuring)
npx create-next-app@latest . --typescript --tailwind --eslint --app --yes

# Core dependencies
npm install drizzle-orm pg jose bcryptjs zod @tanstack/react-query sonner nuqs

# Dev dependencies
npm install -D drizzle-kit @types/pg @types/bcryptjs
```

**Note:** shadcn v4 is already installed. After Next.js init, run `npx shadcn@latest init` to configure component paths and theme. Use `npx shadcn@latest add <component>` to add individual components.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (pos)/                  # POS floor routes (grouped, no layout prefix in URL)
│   │   ├── login/              # PIN login page
│   │   │   └── page.tsx
│   │   ├── menu/               # Menu browsing (three-column layout)
│   │   │   └── page.tsx
│   │   └── layout.tsx          # POS shell layout (three-column)
│   ├── (admin)/                # Admin panel routes
│   │   ├── admin/
│   │   │   ├── brands/         # Brand management
│   │   │   ├── locations/      # Location management
│   │   │   ├── staff/          # Staff management
│   │   │   ├── menu/           # Menu view + sync
│   │   │   ├── settings/       # Brand settings (tabbed)
│   │   │   └── layout.tsx      # Admin sidebar layout
│   │   └── login/              # Admin login (username+password)
│   │       └── page.tsx
│   ├── api/
│   │   ├── auth/               # Auth endpoints (login, verify, refresh)
│   │   ├── menu/               # Menu data endpoints
│   │   ├── brands/             # Brand CRUD
│   │   ├── locations/          # Location CRUD
│   │   ├── staff/              # Staff CRUD
│   │   └── sync/               # ERP sync trigger
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Redirect to appropriate login
├── components/
│   ├── ui/                     # shadcn/ui generated components
│   ├── pos/                    # POS-specific components
│   │   ├── category-sidebar.tsx
│   │   ├── menu-grid.tsx
│   │   ├── menu-item-card.tsx
│   │   ├── modifier-sheet.tsx
│   │   ├── order-panel.tsx
│   │   └── pin-pad.tsx
│   └── admin/                  # Admin-specific components
│       ├── admin-sidebar.tsx
│       ├── brand-settings-tabs.tsx
│       └── sync-status.tsx
├── db/
│   ├── schema/                 # Drizzle schema files
│   │   ├── brands.ts
│   │   ├── locations.ts
│   │   ├── users.ts
│   │   ├── menu.ts
│   │   ├── terminals.ts
│   │   └── index.ts            # Re-exports all schemas
│   ├── relations.ts            # Drizzle relations definition
│   ├── index.ts                # DB connection + drizzle instance
│   └── seed.ts                 # Seed data for development
├── lib/
│   ├── auth.ts                 # JWT helpers (sign, verify, decode)
│   ├── permissions.ts          # RBAC permission map + check functions
│   ├── erp-sync.ts             # ERP API client + sync logic
│   └── utils.ts                # General utilities (cn, formatters)
├── hooks/
│   ├── use-session.ts          # Current user session hook
│   ├── use-terminal.ts         # Terminal context (brand, location)
│   └── use-menu.ts             # Menu data fetching hook
├── types/
│   ├── auth.ts                 # Auth-related types
│   ├── menu.ts                 # Menu domain types
│   └── erp.ts                  # ERP API response types
└── middleware.ts               # Route protection (or proxy.ts for Next.js 16)
```

### Pattern 1: Shared-Schema Multi-Tenancy
**What:** All brands and locations share the same database tables, scoped by `brandId` and `locationId` foreign keys. No schema-per-tenant isolation.
**When to use:** When tenant count is small (< 50 brands) and data isolation at the DB level is not a regulatory requirement.
**Why for this project:** The POS manages a handful of restaurant brands under one organization. Schema-per-tenant adds migration complexity with zero benefit here.

```typescript
// db/schema/brands.ts
import { pgTable, uuid, varchar, text, timestamp, decimal } from "drizzle-orm/pg-core";

export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  logoUrl: text("logo_url"),
  address: text("address"),
  taxId: varchar("tax_id", { length: 50 }),
  serviceChargePct: decimal("service_charge_pct", { precision: 5, scale: 2 }).default("10.00"),
  vatPct: decimal("vat_pct", { precision: 5, scale: 2 }).default("7.00"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// db/schema/menu.ts
export const menuCategories = pgTable("menu_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").notNull().references(() => brands.id),
  parentId: uuid("parent_id"), // self-referencing for subcategories
  name: varchar("name", { length: 255 }).notNull(),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  erpId: varchar("erp_id", { length: 100 }), // ERP foreign key for sync
});

export const menuItems = pgTable("menu_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").notNull().references(() => brands.id),
  categoryId: uuid("category_id").notNull().references(() => menuCategories.id),
  name: varchar("name", { length: 255 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  erpId: varchar("erp_id", { length: 100 }),
});
```

### Pattern 2: Dual Auth Strategy (PIN + Password)
**What:** Two authentication flows sharing one users table but different login mechanisms. Terminals use PIN; admin portal uses username+password. Both produce JWT session tokens.
**When to use:** POS systems where floor staff need fast tap-in while admins need standard credentials.

```typescript
// lib/auth.ts
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET);

interface SessionPayload {
  userId: string;
  role: "admin" | "manager" | "cashier";
  brandId: string;
  locationId: string;
  terminalId?: string;
}

export async function createSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h") // Shift-length sessions
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as SessionPayload;
}
```

### Pattern 3: Next.js 16 Route Protection (proxy.ts)
**What:** In Next.js 16, middleware.ts is renamed to proxy.ts. Use it for route-level auth checks.
**Important:** Next.js 16 renamed `middleware` to `proxy`. If targeting Next.js 15.x, keep using `middleware.ts`.

```typescript
// proxy.ts (Next.js 16) or middleware.ts (Next.js 15)
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

const publicRoutes = ["/login", "/admin/login"];
const adminRoutes = ["/admin"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicRoutes.some(r => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("session")?.value;
  if (!token) {
    const loginUrl = pathname.startsWith("/admin") ? "/admin/login" : "/login";
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }

  try {
    const session = await verifySession(token);

    if (pathname.startsWith("/admin") && session.role === "cashier") {
      return NextResponse.redirect(new URL("/menu", request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

### Pattern 4: ERP Sync Service
**What:** A service layer that fetches menu data from the ERP API and upserts into local PostgreSQL. Triggered manually via admin "Sync Menu" button and optionally on a configurable interval.
**Recommendation for Claude's discretion:** Start with manual-only sync (admin clicks "Sync Menu" button). Add optional polling interval later. This keeps Phase 1 simple and testable.

```typescript
// lib/erp-sync.ts
import { db } from "@/db";
import { menuCategories, menuItems, syncLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

interface ERPMenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl?: string;
  modifiers?: ERPModifier[];
}

export async function syncMenuFromERP(brandId: string): Promise<SyncResult> {
  const syncId = crypto.randomUUID();

  try {
    // 1. Fetch from ERP
    const erpData = await fetchERPMenu(brandId);

    // 2. Upsert categories and items in a transaction
    await db.transaction(async (tx) => {
      for (const category of erpData.categories) {
        await tx.insert(menuCategories)
          .values({ ...category, brandId })
          .onConflictDoUpdate({
            target: [menuCategories.erpId, menuCategories.brandId],
            set: { name: category.name, sortOrder: category.sortOrder },
          });
      }
      // ... similar for items and modifiers
    });

    // 3. Log success
    await db.insert(syncLogs).values({
      id: syncId,
      brandId,
      status: "success",
      itemsSynced: erpData.items.length,
    });

    return { success: true, itemsSynced: erpData.items.length };
  } catch (error) {
    await db.insert(syncLogs).values({
      id: syncId,
      brandId,
      status: "error",
      errorMessage: String(error),
    });
    throw error;
  }
}
```

### Anti-Patterns to Avoid
- **Mixing POS and Admin layouts:** Keep `(pos)` and `(admin)` route groups completely separate. They have different layouts, auth flows, and UX requirements. Never share layout components between them.
- **Querying without brandId scope:** Every menu/location query MUST include a brandId filter. Create helper functions that enforce this to prevent cross-brand data leaks.
- **Storing role permissions in the database:** For 3 fixed roles (admin, manager, cashier), a static permission map in code is simpler and more auditable than a database permissions table. Database-stored permissions add complexity for zero benefit at this scale.
- **Over-engineering ERP sync:** Do not build a queue system, retry logic, or background workers for Phase 1. A simple request-response sync triggered by an admin button is sufficient. Async resilience is Phase 6 (ERP-04).
- **Using Drizzle v1 beta in production:** Stick with stable 0.45.x. The beta has breaking API changes (new relations syntax) and is not production-ready.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UI components | Custom buttons, dialogs, sheets, tabs | shadcn/ui (`npx shadcn@latest add button dialog sheet tabs`) | Accessible, themed, tested. Radix primitives handle focus management, keyboard nav, ARIA |
| Password hashing | Custom hash function | bcryptjs | Timing-safe comparison, salt rounds, battle-tested |
| JWT handling | Manual token string building | jose | Handles signing, verification, expiration, claims validation correctly |
| Form validation | Manual if/else checks | zod schemas | Composable, type-safe, works with React Hook Form and server actions |
| Data fetching + cache | Custom fetch wrappers with useState | @tanstack/react-query | Handles loading/error states, deduplication, background refetch, cache invalidation |
| Date/time formatting | Manual string building | Intl.DateTimeFormat (built-in) | Handles Thai locale, timezone, formatting without a library |

**Key insight:** The POS domain complexity is in multi-brand data scoping, auth flows, and ERP integration -- not in UI primitives or crypto. Use libraries for solved problems; spend engineering effort on domain logic.

## Common Pitfalls

### Pitfall 1: Next.js 16 Async API Breaking Change
**What goes wrong:** Using `params`, `searchParams`, `cookies()`, `headers()` synchronously as in Next.js 14/15 tutorials causes runtime errors in Next.js 16.
**Why it happens:** Next.js 16 made these APIs return Promises. Synchronous access was deprecated in 15, removed in 16.
**How to avoid:** Always `await` these APIs. Use `const { brandId } = await params;` not `const { brandId } = params;`.
**Warning signs:** TypeScript errors about missing `.then()`, runtime "params is a Promise" errors.

### Pitfall 2: Next.js 16 proxy.ts Rename
**What goes wrong:** Creating `middleware.ts` in a Next.js 16 project -- it's deprecated and renamed to `proxy.ts`.
**Why it happens:** Next.js 16 clarified the naming to reflect the network boundary role.
**How to avoid:** Use `proxy.ts` with `export async function proxy()` instead of `export function middleware()`. Check Next.js version before following tutorials.
**Warning signs:** Deprecation warnings in dev console.

### Pitfall 3: Cross-Brand Data Leaks
**What goes wrong:** A cashier at Brand A sees menu items from Brand B because queries don't filter by brandId.
**Why it happens:** Shared-schema multi-tenancy requires explicit filtering on every query.
**How to avoid:** Create scoped query helpers: `getMenuItems(brandId)` that always include the WHERE clause. Never expose unscoped queries to route handlers.
**Warning signs:** During testing, check that brand-scoped users only see their brand's data.

### Pitfall 4: PIN Code Security
**What goes wrong:** PINs stored as plaintext or compared with timing-vulnerable string comparison.
**Why it happens:** PINs seem "low security" so developers skip hashing.
**How to avoid:** Hash PINs with bcryptjs just like passwords. Use `bcrypt.compare()` for constant-time comparison. Rate-limit PIN attempts per terminal.
**Warning signs:** PINs visible in database, instant response difference between valid/invalid PINs.

### Pitfall 5: ERP Sync Partial Failures
**What goes wrong:** Sync crashes midway, leaving the menu in an inconsistent state (some items updated, others stale).
**Why it happens:** Syncing items one-by-one without a transaction.
**How to avoid:** Wrap the entire sync in a database transaction. On failure, everything rolls back to the previous consistent state.
**Warning signs:** Menu shows mix of old and new prices after a failed sync.

### Pitfall 6: shadcn/ui Sheet on Mobile/Tablet
**What goes wrong:** Bottom sheet for modifiers doesn't feel native on tablets, swipe-to-dismiss doesn't work.
**Why it happens:** shadcn/ui Sheet uses Radix Dialog under the hood, which is designed for desktop modals.
**How to avoid:** Use `side="bottom"` on the Sheet component for bottom-sheet behavior. Test on actual tablet devices. Consider using Vaul (drawer component) as an alternative for true bottom-sheet feel -- shadcn/ui has a Drawer component based on Vaul.
**Warning signs:** Sheet opens from the side on mobile, doesn't feel like a native bottom sheet.

## Code Examples

### Database Connection Setup
```typescript
// src/db/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
```

### RBAC Permission Map
```typescript
// src/lib/permissions.ts
type Role = "admin" | "manager" | "cashier";
type Resource = "brands" | "locations" | "staff" | "menu" | "settings" | "reports";
type Action = "read" | "create" | "update" | "delete" | "sync";

const PERMISSIONS: Record<Role, Partial<Record<Resource, Action[]>>> = {
  admin: {
    brands: ["read", "create", "update", "delete"],
    locations: ["read", "create", "update", "delete"],
    staff: ["read", "create", "update", "delete"],
    menu: ["read", "sync"],
    settings: ["read", "update"],
    reports: ["read"],
  },
  manager: {
    locations: ["read"],            // own location only
    staff: ["read"],                // own location only
    menu: ["read"],                 // read-only
    reports: ["read"],              // own location only
  },
  cashier: {
    menu: ["read"],                 // browse menu for ordering
  },
};

export function hasPermission(role: Role, resource: Resource, action: Action): boolean {
  return PERMISSIONS[role]?.[resource]?.includes(action) ?? false;
}

export function requirePermission(role: Role, resource: Resource, action: Action): void {
  if (!hasPermission(role, resource, action)) {
    throw new Error(`Role "${role}" lacks "${action}" permission on "${resource}"`);
  }
}
```

### PIN Pad Component Pattern
```typescript
// src/components/pos/pin-pad.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface PinPadProps {
  onSubmit: (pin: string) => void;
  maxLength?: number;
  isLoading?: boolean;
}

export function PinPad({ onSubmit, maxLength = 6, isLoading }: PinPadProps) {
  const [pin, setPin] = useState("");

  const handleDigit = (digit: string) => {
    if (pin.length < maxLength) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length >= 4) {
        // Auto-submit when minimum length reached (optional)
      }
    }
  };

  const handleBackspace = () => setPin((p) => p.slice(0, -1));
  const handleClear = () => setPin("");
  const handleSubmit = () => {
    if (pin.length >= 4) onSubmit(pin);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* PIN display dots */}
      <div className="flex gap-2">
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className={`h-4 w-4 rounded-full border-2 ${
              i < pin.length ? "bg-primary border-primary" : "border-muted-foreground"
            }`}
          />
        ))}
      </div>

      {/* Number grid */}
      <div className="grid grid-cols-3 gap-2">
        {["1","2","3","4","5","6","7","8","9","","0",""].map((digit, i) => (
          digit ? (
            <Button
              key={i}
              variant="outline"
              size="lg"
              className="h-16 w-16 text-2xl"
              onClick={() => handleDigit(digit)}
              disabled={isLoading}
            >
              {digit}
            </Button>
          ) : (
            <div key={i} />
          )
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant="ghost" onClick={handleClear} disabled={isLoading}>Clear</Button>
        <Button variant="ghost" onClick={handleBackspace} disabled={isLoading}>Back</Button>
        <Button onClick={handleSubmit} disabled={pin.length < 4 || isLoading}>Enter</Button>
      </div>
    </div>
  );
}
```

### Three-Column POS Layout
```typescript
// src/app/(pos)/layout.tsx
export default function POSLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {children}
    </div>
  );
}

// src/app/(pos)/menu/page.tsx
import { CategorySidebar } from "@/components/pos/category-sidebar";
import { MenuGrid } from "@/components/pos/menu-grid";
import { OrderPanel } from "@/components/pos/order-panel";

export default function MenuPage() {
  return (
    <>
      {/* Column 1: Category sidebar */}
      <aside className="w-48 border-r bg-muted/30 overflow-y-auto">
        <CategorySidebar />
      </aside>

      {/* Column 2: Item grid */}
      <main className="flex-1 overflow-y-auto p-4">
        <MenuGrid />
      </main>

      {/* Column 3: Order panel */}
      <aside className="w-80 border-l bg-background flex flex-col">
        <OrderPanel />
      </aside>
    </>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Next.js 15 with middleware.ts | Next.js 16 with proxy.ts | Oct 2025 | Rename middleware → proxy, async params mandatory |
| NextAuth.js / Auth.js v5 | Better Auth (merged project) | 2025 | Auth.js absorbed into Better Auth; for POS use case, custom auth is better |
| tailwind.config.js | Tailwind v4 CSS-based config (@theme directive) | 2025 | No JS config file, theme defined in globals.css |
| Drizzle relations v1 | Drizzle relations v2 (defineRelations) | 2025 beta | New API in v1 beta; stick with v0.45.x stable relations for now |
| serial/autoincrement PKs | UUID or identity columns | PostgreSQL 10+ | Use UUID for distributed-friendly IDs, or identity() for sequential |

**Deprecated/outdated:**
- `tailwind.config.ts` -- Tailwind v4 no longer uses a JS config file; use `@theme` in CSS
- `middleware.ts` filename -- deprecated in Next.js 16, use `proxy.ts`
- `next-auth` package -- project merged into Better Auth; avoid starting new projects with it
- Synchronous `params`/`cookies()`/`headers()` -- removed in Next.js 16

## Open Questions

1. **ERP API Schema**
   - What we know: ERP is web-based, menu data comes from it
   - What's unclear: API authentication method, endpoint structure, data format, rate limits
   - Recommendation: Build the sync service with an adapter pattern so the ERP client can be swapped. Use mock data for Phase 1 development, wire up real ERP in Phase 6

2. **Next.js 15 vs 16 Decision**
   - What we know: Next.js 16 is current stable; project research mentioned Next.js 15
   - What's unclear: Whether the team has a strong preference for 15
   - Recommendation: Use Next.js 16 for a greenfield project. It avoids a migration later and has better defaults (Turbopack, explicit async APIs). If stability concerns exist, Next.js 15.5 is also viable but will need migration within 6-12 months

3. **PostgreSQL Hosting**
   - What we know: PostgreSQL is the chosen database
   - What's unclear: Local Docker vs managed service (Neon, Supabase, RDS)
   - Recommendation: Use Docker for local development (docker-compose.yml). Hosting decision can be deferred -- Drizzle's migration system is host-agnostic

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x |
| Config file | none -- see Wave 0 |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MENU-01 | Categories and subcategories returned for brand | unit | `npx vitest run src/db/__tests__/menu-queries.test.ts -t "categories"` | No -- Wave 0 |
| MENU-02 | Modifiers with price adjustments on items | unit | `npx vitest run src/db/__tests__/menu-queries.test.ts -t "modifiers"` | No -- Wave 0 |
| MENU-03 | Notes field accepted on item selection | unit | `npx vitest run src/components/__tests__/modifier-sheet.test.tsx -t "notes"` | No -- Wave 0 |
| MENU-04 | ERP sync upserts menu data correctly | unit | `npx vitest run src/lib/__tests__/erp-sync.test.ts` | No -- Wave 0 |
| MENU-05 | Menu queries scoped by brandId | unit | `npx vitest run src/db/__tests__/menu-queries.test.ts -t "brand scope"` | No -- Wave 0 |
| MBML-01 | Brand CRUD operations | unit | `npx vitest run src/db/__tests__/brand-queries.test.ts` | No -- Wave 0 |
| MBML-02 | Brand branding fields stored/retrieved | unit | `npx vitest run src/db/__tests__/brand-queries.test.ts -t "branding"` | No -- Wave 0 |
| MBML-03 | Admin can list all brands and locations | integration | `npx vitest run src/app/api/__tests__/brands.test.ts` | No -- Wave 0 |
| MBML-04 | Location settings stored per location | unit | `npx vitest run src/db/__tests__/location-queries.test.ts` | No -- Wave 0 |
| MBML-05 | Role permissions enforced correctly | unit | `npx vitest run src/lib/__tests__/permissions.test.ts` | No -- Wave 0 |
| UIUX-03 | UI components render without errors | smoke | `npx vitest run src/components/__tests__/smoke.test.tsx` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` -- Vitest configuration with Next.js plugin, path aliases
- [ ] `src/db/__tests__/menu-queries.test.ts` -- covers MENU-01, MENU-02, MENU-05
- [ ] `src/db/__tests__/brand-queries.test.ts` -- covers MBML-01, MBML-02
- [ ] `src/db/__tests__/location-queries.test.ts` -- covers MBML-04
- [ ] `src/lib/__tests__/permissions.test.ts` -- covers MBML-05
- [ ] `src/lib/__tests__/erp-sync.test.ts` -- covers MENU-04
- [ ] `src/components/__tests__/modifier-sheet.test.tsx` -- covers MENU-03
- [ ] `src/components/__tests__/smoke.test.tsx` -- covers UIUX-03
- [ ] `src/app/api/__tests__/brands.test.ts` -- covers MBML-03
- [ ] Framework install: `npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom`

## Sources

### Primary (HIGH confidence)
- [Next.js Official Docs](https://nextjs.org/docs/app) - App Router, installation, upgrading to v16
- [Drizzle ORM Docs](https://orm.drizzle.team/docs/get-started/postgresql-new) - PostgreSQL setup, schema declaration
- [Better Auth Docs](https://better-auth.com/docs/integrations/next) - Next.js integration, admin plugin, Drizzle adapter
- [shadcn/ui Docs](https://ui.shadcn.com/docs/installation/next) - Next.js installation, Tailwind v4 setup
- [Vitest Docs via Next.js](https://nextjs.org/docs/app/guides/testing/vitest) - Official Next.js testing guide

### Secondary (MEDIUM confidence)
- [Next.js 16 vs 15 Migration](https://nextjs.org/docs/app/guides/upgrading/version-16) - Breaking changes documented
- [Better Auth Admin Plugin](https://better-auth.com/docs/plugins/admin) - RBAC capabilities and limitations
- [Drizzle ORM npm](https://www.npmjs.com/package/drizzle-orm) - Version 0.45.1 as latest stable

### Tertiary (LOW confidence)
- Auth.js merged into Better Auth -- mentioned in GitHub discussions but official announcement scope unclear
- Drizzle v1 stable release timeline -- beta.2 released Feb 2025, no confirmed stable date

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified versions on npm, official docs confirmed APIs
- Architecture: HIGH - standard multi-tenant POS patterns, well-understood domain
- Pitfalls: HIGH - Next.js 16 breaking changes documented officially, multi-tenant data scoping is a known concern
- Auth approach: MEDIUM - custom auth is the right call for POS-specific needs but more implementation effort than using a library
- ERP sync: MEDIUM - adapter pattern is sound but actual ERP API details unknown

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (30 days -- stack is stable, no major releases expected)
