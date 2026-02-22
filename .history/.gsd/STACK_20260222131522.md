# STACK.md — Technology Stack

> **Project**: Wild Rift Draft Assistant
> **Updated**: 2026-02-22

---

## Rationale

Stack selected for: deterministic client-side computation, fast UI updates during live draft, type-safe data flow, and Vercel deployment compatibility. Every library has a specific justification. No redundancy.

---

## Core Framework

| Package | Version | Purpose |
|---------|---------|---------|
| next | latest stable | App Router, SSR, API routes |
| react | latest stable | UI rendering |
| typescript | latest stable | Strict type safety |
| node | LTS | Runtime |

---

## Styling & UI

| Package | Purpose |
|---------|---------|
| tailwindcss | Utility-first CSS |
| @tailwindcss/postcss | PostCSS integration |
| shadcn/ui | Pre-built accessible component library |
| class-variance-authority | Component variant management |
| tailwind-merge | Tailwind class deduplication |
| clsx | Conditional class joining |
| @radix-ui/* | Headless UI primitives (via shadcn) |
| lucide-react | Icon system |
| tailwindcss-animate | Animation utilities |
| gsap | Subtle motion effects (minimal use) |

**Excluded**: Framer Motion (GSAP covers motion needs), Heroicons (Lucide is sufficient), react-icons (Lucide is sufficient).

---

## State Management

| Package | Purpose |
|---------|---------|
| zustand | Global state (draft picks, bans, phase) |

**Excluded**: Jotai (Zustand handles all state needs), Redux (overkill), Immer (Zustand has built-in immutability patterns).

---

## Data Fetching

| Package | Purpose |
|---------|---------|
| @tanstack/react-query | Server state caching, data loading |
| @trpc/client | Type-safe API calls |
| @trpc/server | Type-safe API definition |
| @trpc/react-query | tRPC + TanStack integration |
| superjson | Serialization for tRPC |

**Excluded**: Axios (tRPC handles API calls), SWR (TanStack Query is primary), ky (unnecessary), node-fetch (Next.js has built-in fetch).

---

## Forms & Validation

| Package | Purpose |
|---------|---------|
| react-hook-form | Form state management |
| zod | Schema validation (shared with tRPC) |
| @hookform/resolvers | Zod + RHF integration |

---

## Database & ORM

| Package | Purpose |
|---------|---------|
| prisma | ORM, migrations, type generation |
| @prisma/client | Database client |
| postgresql | Production database |

**Excluded**: Drizzle (Prisma is primary), SQLite (may add for local dev later), Redis (only if perf bottleneck), Supabase (self-managed PG).

---

## Scraping Pipeline

| Package | Purpose |
|---------|---------|
| puppeteer | Headless browser scraping |
| cheerio | HTML parsing |
| bottleneck | Rate limiting for scraping |
| p-limit | Concurrency control |

**Excluded**: Playwright (Puppeteer is sufficient for scraping), node-cron (manual scraping for V1), Turndown (not needed).

---

## Charts & Visualization (V1 Minimal)

| Package | Purpose |
|---------|---------|
| recharts | Score breakdown charts, composition radar |

**Excluded**: D3 (overkill for V1), visx (unnecessary), Nivo (unnecessary), Chart.js (Recharts is sufficient), react-force-graph (V2), react-heatmap-grid (V2).

---

## Testing

| Package | Purpose |
|---------|---------|
| vitest | Unit & integration testing |
| @testing-library/react | Component testing |
| playwright | E2E testing |

**Excluded**: Jest (Vitest is faster, ESM-native), Cypress (Playwright is chosen E2E), MSW (add when API mocking needed), tsd (add when needed).

---

## Code Quality

| Package | Purpose |
|---------|---------|
| eslint | Linting |
| @typescript-eslint/* | TypeScript linting rules |
| prettier | Code formatting |
| eslint-config-next | Next.js ESLint integration |

**Excluded (V1)**: Husky, lint-staged, commitlint (add in V3 with CI/CD). eslint-plugin-import, eslint-plugin-unused-imports (may add later).

---

## Dev Experience

| Config | Purpose |
|--------|---------|
| Path aliases (@/) | Clean imports |
| Strict TypeScript | Catch errors at compile time |
| Turbopack | Fast dev builds (Next.js native) |

**Excluded (V1)**: Storybook, Chromatic, bundle-analyzer (V3 concerns).

---

## Excluded Categories (Deferred)

| Category | Reason |
|----------|--------|
| Authentication | V3 scope |
| CI/CD | V3 scope |
| Docker | V3 scope |
| Logging (pino, winston) | V3 scope |
| Error tracking (Sentry) | V3 scope |
| Frontend monitoring | V3 scope |
| Security hardening | V3 scope |
| ML/AI (TensorFlow, ONNX) | Out of scope entirely |
| WebAssembly | Unnecessary for scoring perf |
| Graph databases (Neo4j) | Unnecessary |
| Mathematical libs (mathjs, etc.) | Native JS math is sufficient for scoring formulas |

---

## Dependency Count

- **V1 Production Dependencies**: ~25 packages
- **V1 Dev Dependencies**: ~15 packages
- **Total**: ~40 packages (lean, no conflicts)
