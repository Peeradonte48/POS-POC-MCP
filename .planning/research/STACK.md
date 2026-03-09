# Technology Stack

**Project:** A RAMEN POS
**Researched:** 2026-03-09
**Overall Confidence:** MEDIUM — Web search and npm verification unavailable; recommendations based on training data (cutoff early-mid 2025) and the existing shadcn v4 dependency. Versions should be verified with `npm view [package] version` before installation.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | ^15.x | Full-stack React framework | App Router with Server Components for fast initial loads. API Routes handle ERP integration server-side. shadcn v4 is already installed which requires Next.js 15+. SSR is not the main value here — routing, API layer, and build tooling are. | MEDIUM |
| React | ^19.x | UI library | Required by Next.js 15. Concurrent features (useTransition, Suspense) improve responsiveness during order entry rush. | MEDIUM |
| TypeScript | ^5.x | Type safety | Non-negotiable for a POS — type errors in payment or order logic cause real revenue loss. Catches integration bugs with ERP API contracts early. | HIGH |

### State Management

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Zustand | ^5.x | Client-side state | Lightweight, no boilerplate. Perfect for POS local state: current order items, active table, cart modifications. Much simpler than Redux for this use case. Works naturally with React 19. | MEDIUM |
| TanStack Query | ^5.x | Server state / caching | Handles ERP data fetching (menus, pricing, inventory) with automatic cache invalidation, retry logic, and optimistic updates. Critical for keeping menu data fresh without manual refetching. | HIGH |

### UI / Styling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| shadcn/ui | ^4.x | Component library | Already installed. Copy-paste components mean full control — critical for POS where you need pixel-perfect touch targets and custom flows. Not a locked-in dependency. | HIGH |
| Tailwind CSS | ^4.x | Utility CSS | Required by shadcn v4. Fast iteration on responsive layouts (tablet vs desktop). | HIGH |
| Radix UI Primitives | (via shadcn) | Accessible primitives | shadcn is built on Radix. Provides keyboard navigation and focus management — important for cashier workflows where speed matters. | HIGH |

### Database

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| PostgreSQL | ^16 | Primary database | ACID transactions are non-negotiable for payment and order data. JSON columns for flexible modifier/option storage. Row-level security for multi-brand isolation. Proven in POS/financial systems. | HIGH |
| Drizzle ORM | ^0.38+ | Database access | Type-safe SQL with zero runtime overhead. Unlike Prisma, Drizzle generates plain SQL — easier to optimize for the query patterns POS needs (complex joins for bill splitting, order aggregation). Schema-as-code with migrations. | MEDIUM |

**Why Drizzle over Prisma:** Prisma's query engine adds latency (separate process). For a POS where sub-second responses are required during rush hour, Drizzle's direct SQL generation is measurably faster. Prisma's DX is slightly better for simple CRUD, but POS queries (split bills, merged orders, modifier combinations) benefit from Drizzle's SQL-close approach.

### Real-Time Communication

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Socket.IO | ^4.x | WebSocket layer | Bidirectional real-time for order-to-kitchen flow and KDS updates. Battle-tested, handles reconnection automatically (critical — kitchen display can't miss orders). Rooms/namespaces map naturally to restaurant locations and kitchen stations. | HIGH |

**Why Socket.IO over alternatives:**
- **SSE (Server-Sent Events):** Unidirectional only. KDS needs to send "order ready" back. Would require separate REST calls for the reverse direction — adds complexity.
- **Pusher/Ably:** Managed services add latency and cost. POS runs on local network — self-hosted Socket.IO is faster and has no per-message billing.
- **tRPC subscriptions:** Good DX but less mature WebSocket support. Socket.IO's reconnection handling is production-proven for environments where WiFi drops (restaurants).
- **Liveblocks/PartyKit:** Optimized for collaborative editing, not order dispatch. Wrong abstraction.

**Architecture note:** Run Socket.IO as a separate Node.js process alongside Next.js, not inside Next.js API routes. Next.js serverless functions don't support persistent WebSocket connections.

### Authentication & Authorization

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| NextAuth.js (Auth.js) | ^5.x | Authentication | Handles staff login with PIN or credentials. Supports role-based access (cashier vs manager vs admin). Session management with JWT for stateless auth across tablets. | MEDIUM |

**POS-specific auth considerations:**
- Staff typically use PIN codes, not email/password. Implement a custom Credentials provider with PIN lookup.
- Manager override for discounts/voids needs a "sudo" pattern — secondary auth on specific actions.
- Sessions should be long-lived on dedicated terminals but shorter on shared tablets.

### Validation & API Contracts

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Zod | ^3.x | Schema validation | Validates order payloads, payment amounts, ERP API responses. Integrates with TypeScript for end-to-end type safety. Used by Next.js Server Actions natively. | HIGH |
| tRPC | ^11.x | Type-safe API layer | End-to-end type safety between POS frontend and backend without code generation. Eliminates an entire class of integration bugs. Works alongside Socket.IO for non-real-time operations. | MEDIUM |

**Why tRPC over REST:** POS has ~30-50 API endpoints (orders, payments, tables, menu, reports). tRPC eliminates the need to manually keep request/response types in sync. When you change the order schema, every client call that doesn't match breaks at compile time — not in production during dinner rush.

### Thermal Printer Integration

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| escpos (or node-escpos) | ^3.x | ESC/POS command generation | Generates ESC/POS byte streams for thermal printers. Handles Thai character encoding (critical for A RAMEN). | LOW |
| WebUSB API | (Browser API) | Direct USB printer access | Allows browser to communicate directly with USB thermal printers without drivers. Supported in Chrome/Edge (Chromium-based browsers). | MEDIUM |

**Printer architecture decision — Server-side printing (recommended):**

Do NOT rely on browser-based printing (WebUSB or window.print()). Instead:
1. **Server generates ESC/POS commands** using a Node.js library
2. **Print server** (small Node process or Go binary) runs on each location's network
3. **Socket.IO dispatches print jobs** to the print server
4. Print server sends raw bytes to thermal printers via USB or network (TCP port 9100)

**Why server-side:** WebUSB requires user gesture for pairing, doesn't work on iPad Safari, and breaks when the browser tab closes. A local print server is reliable, supports network printers (most kitchen printers are networked), and handles Thai text encoding consistently.

**Thai text encoding:** Most ESC/POS libraries default to ASCII/CP437. Thai characters require either TIS-620 encoding or UTF-8 mode (printer-dependent). Test with actual hardware early — this is a common integration pain point.

### Payment Integration

| Technology | Purpose | Why | Confidence |
|------------|---------|-----|------------|
| Custom payment gateway adapter | Payment processing | Thailand-specific: PromptPay QR via bank APIs, card terminals via local acquirer SDK. No Stripe/Square — they don't fully support Thailand's payment ecosystem. | MEDIUM |

**Payment architecture:**
- **Cash:** Pure frontend flow — enter amount, calculate change, record transaction.
- **Card:** Integrate with local payment terminal (EDC machine). Most Thai banks provide Windows SDK or HTTP API for their terminals. POS sends amount, terminal handles card interaction, returns result.
- **PromptPay QR:** Generate QR via bank API (SCB, KBank, etc.), display on screen, poll for payment confirmation.
- **TrueMoney / LINE Pay:** Each has its own API. Implement as payment method plugins.

### Testing

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vitest | ^3.x | Unit & integration tests | Fast, native ESM, works with TypeScript without config. Compatible with Next.js. | MEDIUM |
| Playwright | ^1.x | E2E testing | Tests the actual order-to-payment flow on tablet viewport sizes. Critical for POS where you can't ship broken flows. | HIGH |
| MSW (Mock Service Worker) | ^2.x | API mocking | Mock ERP API responses during development and testing. Avoids coupling tests to live ERP. | HIGH |

### Infrastructure & Deployment

| Technology | Purpose | Why | Confidence |
|------------|---------|-----|------------|
| Docker + Docker Compose | Containerization | Bundles Next.js app + Socket.IO server + print server. Consistent deployment across locations. | HIGH |
| Nginx | Reverse proxy | Routes HTTP to Next.js, WebSocket to Socket.IO. Handles SSL termination. | HIGH |
| PostgreSQL (managed or self-hosted) | Database hosting | Managed (e.g., Supabase, Neon, or cloud provider) for simplicity, or self-hosted if data sovereignty is required. | MEDIUM |

**Deployment model:** This is an on-premise-adjacent system. Each restaurant location needs reliable, low-latency access. Two viable approaches:

1. **Cloud-hosted (recommended for v1):** Single cloud instance serving all locations. Simpler to manage. Requires stable internet at each location.
2. **Hybrid:** Cloud for management/reporting, local server at each location for order flow. More complex but resilient to internet outages. Consider for v2 if offline support is needed.

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| date-fns | ^4.x | Date handling | Daily reports, shift times, order timestamps. Lighter than Moment/Luxon. | HIGH |
| react-hot-toast / sonner | latest | Toast notifications | Order confirmations, error alerts. POS needs non-blocking feedback. Sonner has better animation defaults. | MEDIUM |
| nuqs | ^2.x | URL state management | Table filters, report date ranges stored in URL. Enables shareable/bookmarkable views for managers. | LOW |
| @tanstack/react-table | ^8.x | Data tables | Sales reports, order history, menu management. Handles sorting, filtering, pagination. | HIGH |
| recharts | ^2.x | Charts/reporting | Daily sales charts, revenue breakdowns. Simple API, works with React. | MEDIUM |
| uuid or nanoid | latest | ID generation | Order IDs, transaction IDs. nanoid is smaller and faster. Use nanoid. | HIGH |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Next.js 15 | Remix | Remix has better form handling but smaller ecosystem. shadcn v4 is already installed targeting Next.js. Switching adds friction with no clear benefit. |
| Framework | Next.js 15 | Vite + React Router | No SSR, no API routes. Would need a separate backend. More moving parts for no gain. |
| ORM | Drizzle | Prisma | Prisma's query engine adds measurable latency. Its migration system is heavier. Drizzle's SQL-close approach better fits complex POS queries. |
| ORM | Drizzle | Kysely | Kysely is a query builder, not a full ORM. No migration tooling. Drizzle provides both. |
| State | Zustand | Redux Toolkit | RTK's boilerplate is overkill for POS state. Zustand does the same job in 1/5 the code. |
| State | Zustand | Jotai | Jotai's atomic model is great for forms but awkward for POS cart state where you manipulate a single order object. Zustand's single-store pattern is more natural here. |
| Real-time | Socket.IO | Supabase Realtime | Ties you to Supabase for database. Less control over reconnection behavior. POS needs fine-grained room management. |
| Real-time | Socket.IO | Firebase RTDB | Google lock-in. Pricing unpredictable at scale. Overkill for order dispatch. |
| API | tRPC | GraphQL (Apollo) | GraphQL is overkill for a single-client app. tRPC provides the same type safety with zero schema overhead. |
| API | tRPC | REST + OpenAPI | Works but requires manual type sync. Every API change risks runtime errors. tRPC eliminates this class of bugs. |
| Auth | NextAuth v5 | Clerk | Managed auth service. Adds external dependency for a system that should work reliably on-premise. PIN-based auth is simpler to implement custom. |
| Printer | Server-side ESC/POS | Browser window.print() | CSS-based printing can't control thermal printer features (cut, drawer kick, barcode). Unreliable formatting. |
| Testing | Vitest | Jest | Vitest is faster, native ESM, better DX. Jest requires more config for TypeScript + ESM. |

---

## Installation

```bash
# Core framework
npm install next@latest react@latest react-dom@latest typescript@latest

# UI (shadcn already installed — add components as needed)
# npx shadcn@latest add button card dialog input table tabs

# State management
npm install zustand @tanstack/react-query

# Database
npm install drizzle-orm postgres
npm install -D drizzle-kit

# Real-time
npm install socket.io socket.io-client

# API layer
npm install @trpc/server @trpc/client @trpc/next @trpc/react-query

# Validation
npm install zod

# Auth
npm install next-auth@beta

# Utilities
npm install date-fns nanoid sonner
npm install @tanstack/react-table recharts

# Testing (dev)
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D playwright @playwright/test
npm install -D msw
```

---

## Architecture Quick Reference

```
Browser (Tablet/Desktop)
  |
  |-- Next.js App Router (pages, Server Components)
  |     |-- tRPC client -----> tRPC server (Next.js API routes)
  |     |                         |-- Drizzle ORM --> PostgreSQL
  |     |                         |-- ERP API adapter --> External ERP
  |     |
  |     |-- Socket.IO client --> Socket.IO server (separate process)
  |                                |-- Kitchen displays (KDS)
  |                                |-- Print server --> Thermal printers
  |
  Auth: NextAuth v5 (PIN-based for staff, credentials for managers)
```

---

## Key Technical Decisions Summary

1. **Drizzle over Prisma** — Performance matters more than Prisma's DX advantage in a latency-sensitive POS.
2. **Socket.IO as separate process** — Next.js can't hold WebSocket connections in serverless mode. Dedicated Socket.IO server is required.
3. **Server-side printing** — Browser printing is unreliable for thermal printers. A local print server per location is the proven pattern.
4. **tRPC for type safety** — Single-client app doesn't need GraphQL's flexibility. tRPC gives compile-time safety with less overhead.
5. **Cloud-first for v1** — Simplifies deployment. Defer local/hybrid architecture until offline support is needed.
6. **Custom payment adapters** — Thailand's payment ecosystem (PromptPay, local card terminals) requires custom integration, not Stripe.

---

## Version Verification Needed

**IMPORTANT:** The versions listed above are based on training data (cutoff early-mid 2025). Before installing, verify current stable versions:

```bash
npm view next version
npm view react version
npm view drizzle-orm version
npm view socket.io version
npm view @trpc/server version
npm view zustand version
npm view zod version
```

Update the versions in this document after verification.

---

## Sources

- Training data knowledge (cutoff early-mid 2025) — MEDIUM confidence
- package.json showing shadcn ^4.0.2 already installed — HIGH confidence (direct evidence)
- PROJECT.md requirements and constraints — HIGH confidence (direct evidence)
- No web search or Context7 verification was possible during this research session
