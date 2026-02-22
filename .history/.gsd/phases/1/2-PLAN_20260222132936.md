---
phase: 1
plan: 2
wave: 1
---

# Plan 1.2: shadcn/ui, TypeScript Types, and Tag System

## Objective
Initialize shadcn/ui component library, define all TypeScript type definitions for the Champion, Draft, and Scoring domains, and implement the champion tag system. These types are the contract that all future code builds against.

## Context
- .gsd/SPEC.md — Champion object specification
- .gsd/ARCHITECTURE.md — Type definitions (§2), tag system, champion attributes
- .gsd/STACK.md — shadcn/ui as UI library
- src/ directory (created by Plan 1.1)

## Tasks

<task type="auto">
  <name>Initialize shadcn/ui and configure component library</name>
  <files>
    - components.json (created by shadcn init)
    - src/lib/utils.ts (created by shadcn init)
    - src/components/ui/ (directory created by shadcn init)
  </files>
  <action>
    1. Run `npx shadcn@latest init` with these settings:
       - Style: New York
       - Base color: Zinc
       - CSS variables: Yes
    2. Install essential shadcn components:
       ```
       npx shadcn@latest add button card badge input dialog scroll-area separator tooltip tabs select
       ```
    3. Verify shadcn components are in `src/components/ui/`.
    4. Verify `src/lib/utils.ts` contains the `cn()` utility function.
    5. Do NOT customize component styles yet — that's Phase 4.
  </action>
  <verify>
    Verify `src/components/ui/button.tsx` exists.
    Verify `src/lib/utils.ts` exports `cn` function.
    Run `npx next build` — build succeeds with shadcn components.
  </verify>
  <done>
    - shadcn/ui initialized with New York style
    - 10 base components installed
    - cn() utility available
    - Build succeeds
  </done>
</task>

<task type="auto">
  <name>Create TypeScript type definitions and tag system</name>
  <files>
    - src/types/champion.ts (create)
    - src/types/draft.ts (create)
    - src/types/scoring.ts (create)
    - src/lib/data/tags.ts (create)
  </files>
  <action>
    1. Create `src/types/champion.ts`:
       - `Champion` interface with all fields from ARCHITECTURE.md:
         - id: string
         - name: string
         - roles: Role[] (enum: Baron, Jungle, Mid, Dragon, Support)
         - winrate: number (0–100)
         - pickRate: number (0–100)
         - banRate: number (0–100)
         - tier: Tier (enum: S+, S, A, B, C, D)
         - damageProfile: { ad: number, ap: number, true: number } (each 0–1)
         - durabilityScore: number (0–10)
         - engageScore: number (0–10)
         - peelScore: number (0–10)
         - ccScore: number (0–10)
         - scalingScore: number (0–10)
         - earlyGameScore: number (0–10)
         - mobilityScore: number (0–10)
         - healingScore: number (0–10)
         - shieldScore: number (0–10)
         - waveclearScore: number (0–10)
         - tags: ChampionTag[]
         - iconUrl: string
       - `Role` enum
       - `Tier` enum
       - `ChampionTag` enum (all 13+ tags)
       - `CounterEntry` type: { championId: string, value: number } // -5 to +5
       - `CounterMatrix` type: Map<string, Map<string, number>>

    2. Create `src/types/draft.ts`:
       - `DraftPhase` enum: Ban, Pick
       - `DraftStage` enum: Early, Mid, Late
       - `TeamSide` enum: Ally, Enemy
       - `RoleSlot` interface: { role: Role, championId: string | null }
       - `TeamState` interface: { baron, jungle, mid, dragon, support } (each RoleSlot)
       - `BanState` interface: { ally: string[], enemy: string[] }
       - `DraftState` interface: { phase, ally: TeamState, enemy: TeamState, bans: BanState }

    3. Create `src/types/scoring.ts`:
       - `ScoreComponent` enum: Base, Synergy, Counter, Composition, Threat, Flexibility, Risk
       - `ScoreBreakdown` interface: { base, synergy, counter, composition, threat, flexibility, risk } (each number 0–100)
       - `WeightConfig` interface: matching ScoreBreakdown shape (each number 0–1)
       - `ScoredChampion` interface: { championId, finalScore, breakdown: ScoreBreakdown, explanations: string[] }
       - `StageWeights` type: Record<DraftStage, WeightConfig>

    4. Create `src/lib/data/tags.ts`:
       - Export `CHAMPION_TAGS` constant array with all 13+ tag definitions:
         engage, poke, dive, peel, frontline, hypercarry, burst, sustain, scaling, early, splitpush, antiheal, cc-heavy
       - Each tag definition: { id: ChampionTag, label: string, description: string, color: string }
       - Export `SYNERGY_RULES` constant array with all tag-pair synergy rules from ARCHITECTURE.md §4.5:
         Each rule: { tagA: ChampionTag, tagB: ChampionTag, score: number, reason: string }
       - Include all positive and negative synergy rules (17+ rules).
       - Export `COUNTER_CATEGORY_MAP` constant: maps categorical strings to numerical values.
       - Do NOT implement any scoring logic — just define the rule data.

    5. All types must use `as const` where appropriate for literal types.
    6. All enums should be string enums for serialization safety.
    7. Export everything. No default exports.
  </action>
  <verify>
    Run `npx tsc --noEmit` — zero type errors.
    Verify all 4 files exist and export the specified types.
    Verify ChampionTag enum has ≥13 members.
    Verify SYNERGY_RULES has ≥17 rules.
  </verify>
  <done>
    - Champion type with all 20+ fields defined
    - Draft state types fully specified
    - Scoring types with breakdown and weights defined
    - Tag system with 13+ tags, 17+ synergy rules, counter category map
    - Zero type errors
    - All exports named (no defaults)
  </done>
</task>

## Success Criteria
- [ ] shadcn/ui initialized and 10 components available
- [ ] Champion, Draft, Scoring types fully defined
- [ ] Tag system with synergy rules and counter mapping defined
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npx next build` succeeds
