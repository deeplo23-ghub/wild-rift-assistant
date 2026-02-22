---
phase: 1
plan: 3
wave: 2
---

# Plan 1.3: Prisma Schema, Zustand Store, tRPC Scaffold, and Scoring Stubs

## Objective
Create the database schema, draft state management store, tRPC API scaffold, and empty scoring engine module structure. This completes the infrastructure foundation — after this plan, every architectural layer has a file and a contract, ready for implementation in Phase 2+.

## Context
- .gsd/SPEC.md — Database and state requirements
- .gsd/ARCHITECTURE.md — Directory structure (§2), data flow (§3), scoring components (§4)
- src/types/ (created by Plan 1.2) — Type definitions
- src/lib/data/tags.ts (created by Plan 1.2) — Tag system

## Tasks

<task type="auto">
  <name>Create Prisma schema and tRPC scaffold</name>
  <files>
    - prisma/schema.prisma (create)
    - src/lib/trpc/context.ts (create)
    - src/lib/trpc/router.ts (create)
    - src/lib/trpc/client.ts (create)
    - src/app/api/trpc/[trpc]/route.ts (create)
  </files>
  <action>
    1. Run `npx prisma init` to create prisma/ directory and .env file.
    2. Edit `prisma/schema.prisma`:
       - Provider: postgresql
       - Model `Champion`:
         - id: String @id
         - name: String @unique
         - roles: String[] (stored as array of role strings)
         - winrate: Float
         - pickRate: Float
         - banRate: Float
         - tier: String
         - damageProfileAd: Float
         - damageProfileAp: Float
         - damageProfileTrue: Float
         - durabilityScore: Float
         - engageScore: Float
         - peelScore: Float
         - ccScore: Float
         - scalingScore: Float
         - earlyGameScore: Float
         - mobilityScore: Float
         - healingScore: Float
         - shieldScore: Float
         - waveclearScore: Float
         - tags: String[] (stored as array of tag strings)
         - iconUrl: String @default("")
         - updatedAt: DateTime @updatedAt
       - Model `CounterMatchup`:
         - id: String @id @default(cuid())
         - championId: String
         - opponentId: String
         - value: Float (range -5 to +5)
         - @@unique([championId, opponentId])
         - @@index([championId])
       - Model `DataMeta`:
         - id: String @id @default("singleton")
         - lastScrapedAt: DateTime
         - championCount: Int
         - version: String

    3. Create `src/lib/trpc/context.ts`:
       - Export createContext function that returns Prisma client instance.
       - Import PrismaClient.

    4. Create `src/lib/trpc/router.ts`:
       - Create appRouter with tRPC.
       - Define procedures (stubs — query functions return empty arrays or placeholder data):
         - `champion.getAll` — returns all champions
         - `champion.getById` — returns single champion by id
         - `counter.getMatrix` — returns counter matchups
         - `meta.getLastScraped` — returns scrape metadata
       - Export type AppRouter.

    5. Create `src/lib/trpc/client.ts`:
       - Create and export tRPC client with superjson transformer.
       - Create and export tRPC React hooks.

    6. Create `src/app/api/trpc/[trpc]/route.ts`:
       - Wire tRPC handler for Next.js App Router API route.
       - Handle GET and POST.

    7. Do NOT run `prisma migrate` — just define the schema. Migration happens in Phase 2 when we have a database.
    8. Do NOT implement actual query logic — just return stub data to prove the wiring works.
  </action>
  <verify>
    Run `npx prisma validate` — schema valid.
    Run `npx tsc --noEmit` — zero type errors.
  </verify>
  <done>
    - Prisma schema with Champion, CounterMatchup, DataMeta models
    - tRPC router with 4 stub procedures
    - tRPC client with React hooks
    - API route handler wired
    - Schema validates
    - TypeScript compiles
  </done>
</task>

<task type="auto">
  <name>Create Zustand draft store and empty scoring engine modules</name>
  <files>
    - src/store/draftStore.ts (create)
    - src/store/uiStore.ts (create)
    - src/lib/scoring/engine.ts (create)
    - src/lib/scoring/base.ts (create)
    - src/lib/scoring/synergy.ts (create)
    - src/lib/scoring/counter.ts (create)
    - src/lib/scoring/composition.ts (create)
    - src/lib/scoring/threat.ts (create)
    - src/lib/scoring/flexibility.ts (create)
    - src/lib/scoring/risk.ts (create)
    - src/lib/scoring/weights.ts (create)
    - src/lib/scoring/stage.ts (create)
    - src/lib/scoring/explain.ts (create)
    - src/lib/scoring/types.ts (create)
  </files>
  <action>
    1. Create `src/store/draftStore.ts`:
       - Zustand store with the following state shape:
         - phase: DraftPhase (default: Ban)
         - ally: TeamState (all 5 slots null)
         - enemy: TeamState (all 5 slots null)
         - bans: BanState (empty arrays)
       - Actions:
         - setAllyPick(role: Role, championId: string | null): void
         - setEnemyPick(role: Role, championId: string | null): void
         - addAllyBan(championId: string): void
         - addEnemyBan(championId: string): void
         - removeAllyBan(championId: string): void
         - removeEnemyBan(championId: string): void
         - setPhase(phase: DraftPhase): void
         - resetDraft(): void
       - Derived getters (using Zustand subscribeWithSelector or computed):
         - allyPickedIds: string[] (all non-null ally champion IDs)
         - enemyPickedIds: string[] (all non-null enemy champion IDs)
         - allBannedIds: string[] (union of both ban lists)
         - totalPicks: number (ally + known enemy picks count)
         - currentStage: DraftStage (derived from totalPicks)
       - Import types from src/types/draft.ts

    2. Create `src/store/uiStore.ts`:
       - Zustand store for UI state:
         - searchQuery: string (default: "")
         - roleFilter: Role | null (default: null)
         - sortBy: 'score' | 'synergy' | 'counter' | 'winrate' (default: 'score')
         - selectedChampionId: string | null (for detail view)
       - Actions:
         - setSearchQuery(q: string): void
         - setRoleFilter(role: Role | null): void
         - setSortBy(sort: string): void
         - setSelectedChampion(id: string | null): void

    3. Create scoring engine module files — ALL AS STUBS:
       Each file should:
       - Import appropriate types from src/types/scoring.ts and src/types/champion.ts
       - Export the function signature with correct parameters and return type
       - Return a placeholder value (0 or neutral score)
       - Include a JSDoc comment describing what the function will compute (reference ARCHITECTURE.md section)
       - Include a `// TODO: Implement in Phase 3` comment

       Specific stubs:
       - `src/lib/scoring/types.ts`: Re-export scoring types (might add engine-internal types later)
       - `src/lib/scoring/stage.ts`: `detectStage(totalPicks: number): DraftStage` → returns Early
       - `src/lib/scoring/weights.ts`: `getWeights(stage: DraftStage): WeightConfig` → returns base weights
         Also export `BASE_WEIGHTS` and `STAGE_MODIFIERS` constants with the exact values from ARCHITECTURE.md §4.2 and §4.3.
       - `src/lib/scoring/base.ts`: `computeBaseScore(champion: Champion, allChampions: Champion[]): number` → returns 50
       - `src/lib/scoring/synergy.ts`: `computeSynergyScore(champion: Champion, allies: Champion[]): number` → returns 50
       - `src/lib/scoring/counter.ts`: `computeCounterScore(champion: Champion, enemies: Champion[], counterMatrix: CounterMatrix): number` → returns 50
       - `src/lib/scoring/composition.ts`: `computeCompositionScore(champion: Champion, allies: Champion[]): number` → returns 50
       - `src/lib/scoring/threat.ts`: `computeThreatScore(champion: Champion, enemies: Champion[]): number` → returns 50
       - `src/lib/scoring/flexibility.ts`: `computeFlexibilityScore(champion: Champion): number` → returns 50
       - `src/lib/scoring/risk.ts`: `computeRiskPenalty(champion: Champion, allies: Champion[]): number` → returns 0
       - `src/lib/scoring/explain.ts`: `generateExplanations(champion: Champion, breakdown: ScoreBreakdown, allies: Champion[], enemies: Champion[]): string[]` → returns []
       - `src/lib/scoring/engine.ts`: `scoreChampion(champion: Champion, draftState: DraftState, allChampions: Champion[], counterMatrix: CounterMatrix): ScoredChampion` → calls all component stubs, aggregates with weights
         This is the ONLY file that should import and call other scoring modules.
         Even as a stub, wire the aggregation formula correctly: weighted sum using getWeights().

    4. `weights.ts` is the ONE exception to "no logic yet":
       - Define `BASE_WEIGHTS` constant exactly matching ARCHITECTURE.md §4.2
       - Define `STAGE_MODIFIERS` constant exactly matching ARCHITECTURE.md §4.3
       - Implement `getWeights()` function fully — it's pure config lookup, not scoring logic.
       This is allowed because weights are configuration, not computation.

    5. Do NOT implement any actual scoring formulas.
    6. Do NOT add champion data or test data.
    7. Every module must compile with `tsc --noEmit`.
  </action>
  <verify>
    Run `npx tsc --noEmit` — zero type errors.
    Verify all 14 scoring files exist in src/lib/scoring/.
    Verify both Zustand stores exist in src/store/.
    Verify engine.ts imports all 7 scoring components.
    Verify weights.ts has BASE_WEIGHTS matching ARCHITECTURE.md values.
  </verify>
  <done>
    - Zustand draftStore with full state shape and all actions
    - Zustand uiStore with search, filter, sort state
    - 12 scoring engine files (all stubs except weights.ts)
    - Scoring engine orchestrator correctly wired to call all components
    - BASE_WEIGHTS and STAGE_MODIFIERS constants defined
    - getWeights() function implemented
    - All files compile with zero type errors
  </done>
</task>

<task type="auto">
  <name>Final build verification and placeholder landing page</name>
  <files>
    - src/app/page.tsx (modify)
    - src/app/layout.tsx (modify)
  </files>
  <action>
    1. Update `src/app/layout.tsx`:
       - Set page title to "Wild Rift Draft Assistant"
       - Set meta description
       - Import Inter font from next/font/google
       - Apply dark mode class to html element

    2. Update `src/app/page.tsx`:
       - Replace default Next.js content with a simple centered placeholder:
         - Title: "Wild Rift Draft Assistant"
         - Subtitle: "Phase 1 Foundation Complete"
         - A shadcn Button component (just to verify shadcn works)
         - Dark background styling via Tailwind
       - Do NOT build draft UI — that's Phase 4.
       - This is purely to verify the full stack compiles and renders.

    3. Run `npx next build` — must succeed with zero errors.
    4. Run `npm run dev` and verify the page renders in browser.
  </action>
  <verify>
    Run `npx next build` — zero errors.
    Run `npm run dev` — page loads at localhost:3000 showing the placeholder.
    Verify shadcn Button component renders correctly.
  </verify>
  <done>
    - Landing page renders with correct title
    - shadcn Button component works
    - Full build succeeds
    - Dark mode applied
    - Phase 1 infrastructure is complete
  </done>
</task>

## Success Criteria
- [ ] Prisma schema validates with 3 models (Champion, CounterMatchup, DataMeta)
- [ ] tRPC router has 4 stub procedures wired to API route
- [ ] Zustand draftStore has full state shape with all actions
- [ ] Zustand uiStore has search/filter/sort state
- [ ] 12 scoring engine stub files exist and compile
- [ ] BASE_WEIGHTS and STAGE_MODIFIERS match ARCHITECTURE.md
- [ ] engine.ts orchestrator calls all 7 scoring components
- [ ] `npx next build` succeeds with zero errors
- [ ] Landing page renders in browser
