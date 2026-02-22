# ARCHITECTURE.md — System Design

> **Project**: Wild Rift Draft Assistant
> **Updated**: 2026-02-22

---

## 1. System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    WILD RIFT DRAFT ASSISTANT                  │
├──────────────┬──────────────────────┬────────────────────────┤
│  ALLY PANEL  │   CHAMPION POOL      │    ENEMY PANEL         │
│  (5 roles)   │   (searchable grid)  │    (5 roles)           │
│  Score sum   │   Role filter        │    Threat analysis     │
│  Comp gaps   │   Sort: score/syn/ct │    Damage profile      │
│  Weaknesses  │   Visual tags        │    Risk warnings       │
├──────────────┴──────────────────────┴────────────────────────┤
│                   SCORING ENGINE (Client-Side)                │
│  Base(20%) + Synergy(20%) + Counter(20%) + Comp(20%)         │
│  + Threat(10%) + Flex(5%) - Risk(5%)                         │
├──────────────────────────────────────────────────────────────┤
│                   PRECOMPUTED DATA LAYER                      │
│  Champions │ Counter Matrix │ Synergy Rules │ Tag System      │
├──────────────────────────────────────────────────────────────┤
│                   DATA PIPELINE (Offline)                     │
│  Scraper → Normalizer → Database → Client Cache              │
└──────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **Client-side scoring**: All scoring runs in the browser from precomputed data. No server round-trips during draft.
2. **Offline scraping**: Data pipeline runs independently (cron or manual). Scrape → normalize → seed DB → serve via API.
3. **Monolithic Next.js**: Single Next.js app handles frontend, API (tRPC), and scraper scripts. No microservices.
4. **Precomputed matrices**: Counter matrix and champion attributes are computed at scrape time, stored in DB, and loaded into client memory at app start.

---

## 2. Directory Structure

```
/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Main draft page
│   ├── layout.tsx                # Root layout
│   └── api/
│       └── trpc/[trpc]/route.ts  # tRPC API handler
│
├── components/
│   ├── draft/                    # Draft-specific components
│   │   ├── AllyPanel.tsx         # Left column: ally team
│   │   ├── EnemyPanel.tsx        # Right column: enemy team
│   │   ├── ChampionPool.tsx      # Center: champion grid
│   │   ├── RoleSlot.tsx          # Individual role slot
│   │   ├── BanPhase.tsx          # Ban phase overlay
│   │   ├── ScoreBreakdown.tsx    # Score component visualization
│   │   ├── CompositionSummary.tsx# Team composition analysis
│   │   ├── ThreatAnalysis.tsx    # Enemy threat profile
│   │   └── ChampionCard.tsx      # Individual champion in pool
│   └── ui/                       # shadcn/ui components
│
├── lib/
│   ├── scoring/                  # Scoring engine (PURE FUNCTIONS)
│   │   ├── engine.ts             # Main orchestrator
│   │   ├── base.ts               # Base stat scoring
│   │   ├── synergy.ts            # Synergy scoring
│   │   ├── counter.ts            # Counter scoring
│   │   ├── composition.ts        # Composition gap scoring
│   │   ├── threat.ts             # Threat mitigation scoring
│   │   ├── flexibility.ts        # Flexibility scoring
│   │   ├── risk.ts               # Risk penalty scoring
│   │   ├── weights.ts            # Weight configuration & stage adjustment
│   │   ├── stage.ts              # Stage detection
│   │   ├── explain.ts            # Human-readable explanation generator
│   │   └── types.ts              # Scoring types
│   ├── data/
│   │   ├── champions.ts          # Champion data access
│   │   ├── matrices.ts           # Counter/synergy matrix utilities
│   │   ├── normalize.ts          # Data normalization functions
│   │   ├── tags.ts               # Tag system definitions & rules
│   │   └── derive.ts             # Attribute derivation from raw data
│   └── trpc/
│       ├── router.ts             # tRPC router definition
│       ├── context.ts            # tRPC context
│       └── client.ts             # tRPC client
│
├── hooks/
│   ├── useDraft.ts               # Draft flow management
│   ├── useScoring.ts             # Scoring computation hook
│   └── useChampionPool.ts        # Champion pool filtering/sorting
│
├── store/
│   ├── draftStore.ts             # Zustand: draft state (picks, bans, phase)
│   └── uiStore.ts                # Zustand: UI state (filters, sort, modals)
│
├── types/
│   ├── champion.ts               # Champion data types
│   ├── draft.ts                  # Draft state types
│   └── scoring.ts                # Scoring types
│
├── prisma/
│   └── schema.prisma             # Database schema
│
├── scripts/
│   └── scraper/
│       ├── index.ts              # Scraper orchestrator
│       ├── wr-meta.ts            # wr-meta.com scraper
│       ├── normalize.ts          # Post-scrape normalization
│       ├── derive.ts             # Attribute derivation pipeline
│       └── seed.ts               # Database seeding
│
└── public/
    └── champions/                # Champion icons (scraped)
```

---

## 3. Data Flow

### 3.1 Offline Pipeline (Scrape → DB)

```
wr-meta.com
    │
    ▼
[Puppeteer + Cheerio Scraper]
    │
    ├── Raw winrate, pickrate, banrate, tier
    ├── Matchup categories per champion
    └── Champion role classifications
    │
    ▼
[Normalizer]
    │
    ├── WinratePercentile (0–100)
    ├── TierScore mapping (S+→100, S→90, A→75, B→60, C→45, D→30)
    ├── PickRateConfidence (0–100)
    ├── Counter Matrix: categorical → numerical [-5, +5]
    │
    ▼
[Attribute Deriver]
    │
    ├── DurabilityScore (0–10)
    ├── EngageScore (0–10)
    ├── PeelScore (0–10)
    ├── CcScore (0–10)
    ├── ScalingScore (0–10)
    ├── EarlyGameScore (0–10)
    ├── MobilityScore (0–10)
    ├── HealingScore (0–10)
    ├── ShieldScore (0–10)
    ├── DamageProfile { ad, ap, true }
    │
    ▼
[Prisma Seed → PostgreSQL]
```

### 3.2 Runtime Pipeline (DB → Client → Scores)

```
App Load
    │
    ▼
[tRPC Query: getAllChampions]
    │
    ├── Full champion objects
    ├── Flattened counter matrix
    └── Tag definitions
    │
    ▼
[Zustand Store: draftStore]
    │
    ├── allyPicks: { baron?, jungle?, mid?, dragon?, support? }
    ├── enemyPicks: { baron?, jungle?, mid?, dragon?, support? }
    ├── allyBans: string[]
    ├── enemyBans: string[]
    ├── phase: 'ban' | 'pick'
    │
    ▼
[Scoring Engine (pure functions, client-side)]
    │
    ├── Input: candidateChampion + draftState + allChampions
    ├── Output: ScoredChampion { finalScore, breakdown, explanations }
    │
    ▼
[UI Render]
```

---

## 4. Scoring Engine — Mathematical Specification

### 4.1 Final Score Formula

```
FinalScore(c) = clamp(0, 100,
    w_base × S_base(c)
  + w_syn  × S_synergy(c)
  + w_ctr  × S_counter(c)
  + w_comp × S_composition(c)
  + w_thr  × S_threat(c)
  + w_flex × S_flexibility(c)
  - w_risk × S_risk(c)
)
```

Where `c` = candidate champion, and all component scores `S_i(c) ∈ [0, 100]`.

### 4.2 Base Weight Table

| Component   | Symbol  | Base Weight | Min | Max |
|-------------|---------|-------------|-----|-----|
| Base Stats  | w_base  | 0.20        | 0.10| 0.35|
| Synergy     | w_syn   | 0.20        | 0.10| 0.35|
| Counter     | w_ctr   | 0.20        | 0.10| 0.35|
| Composition | w_comp  | 0.20        | 0.10| 0.35|
| Threat Mit. | w_thr   | 0.10        | 0.05| 0.25|
| Flexibility | w_flex  | 0.05        | 0.00| 0.15|
| Risk Penalty| w_risk  | 0.05        | 0.00| 0.15|

**Constraint**: No single weight may exceed 0.35 after stage adjustment.

### 4.3 Stage Detection & Weight Adjustment

```
totalPicks = |allyPicks| + |knownEnemyPicks|

Stage:
  EARLY  = totalPicks ∈ [0, 2]
  MID    = totalPicks ∈ [3, 6]
  LATE   = totalPicks ∈ [7, 10]
```

**Stage Modifiers** (additive to base weights, then re-clamped):

| Weight  | EARLY   | MID   | LATE    |
|---------|---------|-------|---------|
| w_base  | +0.00   | +0.00 | +0.00   |
| w_syn   | +0.00   | +0.00 | +0.00   |
| w_ctr   | -0.10   | +0.00 | +0.15   |
| w_comp  | +0.00   | +0.00 | +0.10   |
| w_thr   | +0.00   | +0.00 | +0.00   |
| w_flex  | +0.10   | +0.00 | -0.05   |
| w_risk  | -0.02   | +0.00 | +0.05   |

**After adjustment**: Re-normalize so positive weights sum to ≤ 1.0. Clamp each to [min, max].

---

### 4.4 Component: Base Score

```
S_base(c) = 0.50 × WinratePercentile(c)
           + 0.30 × TierScore(c)
           + 0.20 × PickRateConfidence(c)
```

**WinratePercentile(c)**:
```
Sort all champions by winrate ascending.
WinratePercentile(c) = (rank(c) / totalChampions) × 100
```

**TierScore(c)**:
```
S+ → 100    S → 90    A → 75    B → 60    C → 45    D → 30
```

**PickRateConfidence(c)**:
```
medianPR = median(allPickRates)
PickRateConfidence(c) = min(1.0, pickRate(c) / medianPR) × 100
```

Rationale: Champions with very low pick rates have less reliable statistics.

---

### 4.5 Component: Synergy Score

```
S_synergy(c) = Σ_i pairwiseSynergy(c, ally_i) / maxPossibleSynergy × 100
```

Where `ally_i` = each locked ally champion. If no allies locked, `S_synergy = 50` (neutral).

**Pairwise Synergy** is computed from tag interaction rules:

| Tag A (Champion 1) | Tag B (Champion 2) | Score | Reasoning |
|---------------------|---------------------|-------|-----------|
| engage              | burst               | +3    | Engage creates burst window |
| engage              | hypercarry          | +3    | Engage peels attention from carry |
| peel                | hypercarry          | +4    | Peel directly enables carry |
| frontline           | hypercarry          | +3    | Frontline absorbs for carry |
| frontline           | poke                | +2    | Frontline enables poke siege |
| cc-heavy            | burst               | +2    | CC chains extend burst window |
| dive                | dive                | +2    | Double dive overwhelms backline |
| engage              | engage              | +1    | Multiple engage angles |
| poke                | poke                | +2    | Poke siege synergy |
| sustain             | scaling             | +2    | Sustain enables scaling timeline |
| early               | early               | +2    | Snowball composition |
| peel                | poke                | +2    | Peel protects poke range |
| engage              | cc-heavy            | +2    | Layered CC chains |
| splitpush           | engage              | -2    | 4-1 conflicts with 5v5 engage |
| splitpush           | splitpush           | -1    | Double split is risky |
| early               | scaling             | -1    | Tempo mismatch |
| poke                | engage              | -1    | Poke wants distance, engage doesn't |

**Max Possible Synergy per pair**: +4 (single highest rule match)
**Max Possible Synergy total**: maxPairAllies × 4 (if 4 allies: 16)

Multiple matching rules per pair: take the **sum** of all matching rules, capped at [-5, +8] per pair.

---

### 4.6 Component: Counter Score

```
S_counter(c) = (directCounter + indirectCounter) / maxCounterRange × 100
```

**Direct Counter** (role-matched):
```
If enemy in same role is known:
  directCounter = counterMatrix[c][enemy_same_role]
Else:
  directCounter = 0
```

**Indirect Counter** (team-wide):
```
indirectCounter = Σ_i counterMatrix[c][enemy_i] × 0.5
  for all known enemy champions (non-role-matched)
```

**Counter Matrix Values** (from scraped categorical data):

| Category              | Numerical Value |
|-----------------------|-----------------|
| Extreme Advantage     | +5              |
| Major Advantage       | +3              |
| Minor Advantage       | +1              |
| Even                  | 0               |
| Minor Disadvantage    | -1              |
| Major Disadvantage    | -3              |
| Extreme Disadvantage  | -5              |

**Normalization**: 
```
maxCounterRange = 5 + (4 × 5 × 0.5) = 15 (direct + 4 indirect at max)
Normalized: ((raw + maxCounterRange) / (2 × maxCounterRange)) × 100
```

If no enemies known: `S_counter = 50` (neutral).

---

### 4.7 Component: Composition Score

Evaluate which compositional elements the team is **missing** and reward champions that fill those gaps.

**Compositional Elements** (each 0 or 1: present or not):

| Element       | Detection Rule                                | Ideal Count |
|---------------|-----------------------------------------------|-------------|
| AD Damage     | ≥1 champion with damageProfile.ad > 0.5       | ≥2          |
| AP Damage     | ≥1 champion with damageProfile.ap > 0.5       | ≥1          |
| Frontline     | ≥1 champion with durabilityScore ≥ 7          | ≥1          |
| Engage        | ≥1 champion with engageScore ≥ 6              | ≥1          |
| Peel          | ≥1 champion with peelScore ≥ 5                | ≥1          |
| Waveclear     | ≥2 champions with waveclearScore ≥ 5           | ≥2          |
| CC            | ≥2 champions with ccScore ≥ 4                 | ≥2          |
| Anti-heal     | If enemy has sustain: ≥1 with antiheal tag     | conditional |

**Gap Detection**:
```
gaps = [] // list of missing elements
For each element:
  if currentTeam + candidate does NOT meet ideal: gaps.push(element)

gapsFilled = elements that WERE missing but candidate fills
```

**Composition Score**:
```
S_composition(c) = (gapsFilled / totalGaps) × 100

If no gaps exist: S_composition = 75 (healthy team, diminishing returns)
If no allies picked: S_composition = 50 (neutral)
```

---

### 4.8 Component: Threat Mitigation

Evaluate enemy team's **threat profile** and score candidate's ability to mitigate.

**Threat Categories** (each 0–10):

| Threat        | Detection                                      |
|---------------|-------------------------------------------------|
| Burst         | Σ enemy burst tags / maxBurst                    |
| Poke          | Σ enemy poke tags / maxPoke                      |
| Dive          | Σ enemy dive + engage scores / maxDive           |
| Sustain       | Σ enemy sustain + healing scores / maxSustain    |
| Splitpush     | Σ enemy splitpush tags / maxSplit                |

**Mitigation Ability** (candidate c, per threat):

| Threat    | Mitigation by c                                        |
|-----------|--------------------------------------------------------|
| Burst     | c.durabilityScore + c.shieldScore + c.peelScore        |
| Poke      | c.engageScore + c.mobilityScore + c.healingScore       |
| Dive      | c.peelScore + c.ccScore + c.durabilityScore            |
| Sustain   | c has antiheal tag → +8, else c.burstScore             |
| Splitpush | c.waveclearScore + c.mobilityScore + c.dueling         |

```
S_threat(c) = Σ_t (mitigationAbility(c, t) × threatLevel(t)) / Σ_t threatLevel(t)
             × (100 / maxMitigationPerThreat)

If no enemies known: S_threat = 50 (neutral)
```

---

### 4.9 Component: Flexibility

```
S_flexibility(c) =
    (|c.roles| / 5) × 40          // Multi-role capability
  + hybridDamage(c) × 30          // AD+AP mix
  + adaptiveScore(c) × 30         // Build versatility
```

**hybridDamage(c)**: `1 - |c.damageProfile.ad - c.damageProfile.ap|` (0 = pure, 1 = perfect hybrid)

**adaptiveScore(c)**: `1.0` if champion has both AD and AP viable builds in meta, `0.5` otherwise. Derived from role classification diversity.

---

### 4.10 Component: Risk Penalty

Detect team-wide vulnerabilities that **worsen** by adding the candidate.

| Vulnerability          | Condition                                  | Penalty |
|------------------------|--------------------------------------------|---------|
| All AD                 | All allies AD & candidate is AD            | 25      |
| All AP                 | All allies AP & candidate is AP            | 25      |
| No Frontline           | No ally frontline & candidate not frontline | 20      |
| No Engage              | No ally engage & candidate not engage      | 20      |
| No Peel                | No ally peel & candidate not peel          | 15      |
| Too Scaling            | ≥3 scaling allies & candidate is scaling   | 15      |
| No Early Pressure      | No early ally & candidate not early        | 10      |
| No Waveclear           | <2 waveclear allies & candidate lacks it   | 10      |

```
S_risk(c) = min(100, Σ applicablePenalties)
```

Active penalties only when ≥2 allies are locked (with fewer picks, risks aren't yet meaningful).

---

## 5. Data Normalization Rules

### 5.1 Winrate Normalization
```
Input: raw winrate (e.g., 52.3%)
Step 1: Collect all champion winrates
Step 2: Sort ascending
Step 3: WinratePercentile = (rank / N) × 100
Output: 0–100 percentile
```

### 5.2 Tier Normalization
```
Input: tier string (e.g., "S+", "A", "D")
Output: TierScore via lookup table:
  S+ → 100, S → 90, A → 75, B → 60, C → 45, D → 30
```

### 5.3 Pick Rate Confidence
```
Input: raw pick rate (e.g., 8.5%)
Step 1: Compute median pick rate across all champions
Step 2: PickRateConfidence = min(1.0, pickRate / medianPickRate) × 100
Output: 0–100
```

### 5.4 Counter Matrix Normalization
```
Input: categorical string per matchup (e.g., "Major Advantage")
Output: numerical [-5, +5] via lookup table:
  "Extreme Advantage" → +5
  "Major Advantage"   → +3
  "Minor Advantage"   → +1
  "Even"              →  0
  "Minor Disadvantage" → -1
  "Major Disadvantage" → -3
  "Extreme Disadvantage" → -5
```

### 5.5 Derived Attribute Normalization
All derived attributes normalized to 0–10 scale.

**DurabilityScore** (0–10):
```
baseHP_norm = (baseHP - minHP) / (maxHP - minHP) × 3
armor_norm = (baseArmor - minArmor) / (maxArmor - minArmor) × 2
mr_norm = (baseMR - minMR) / (maxMR - minMR) × 1
roleBonus = isTank ? 2 : isFighter ? 1 : 0
shieldBonus = hasSelfShield ? 1 : 0
healBonus = hasSelfHeal ? 1 : 0
DurabilityScore = min(10, baseHP_norm + armor_norm + mr_norm + roleBonus + shieldBonus + healBonus)
```

**EngageScore** (0–10):
```
hardCC = countHardCC × 2.5        // stuns, knockups, suppressions
dashEngage = hasDashEngage ? 2 : 0
aoeCC = hasAoECC ? 2 : 0
ultEngage = hasEngageUlt ? 2 : 0
rangeBonus = isRangedEngage ? 1 : 0
EngageScore = min(10, hardCC + dashEngage + aoeCC + ultEngage + rangeBonus)
```

**PeelScore** (0–10):
```
knockbacks = countKnockbacks × 2
shields = countShields × 2
slows = countSlows × 1
disengage = hasDisengage ? 2 : 0
healPeel = hasAllyHeal ? 1 : 0
PeelScore = min(10, knockbacks + shields + slows + disengage + healPeel)
```

**CcScore** (0–10):
```
hardCC = countHardCC × 2
softCC = countSoftCC × 1
aoeCC = hasAoECC ? 2 : 0
ccDuration_norm = totalCCDuration / maxCCDuration × 2
CcScore = min(10, hardCC + softCC + aoeCC + ccDuration_norm)
```

**ScalingScore** (0–10):
```
hypercarry = hasHypercarryTag ? 3 : 0
lateWinrateTrend = (lateGameWR - earlyGameWR) norm to 0-3
ratioScaling = hasHighRatios ? 2 : 1
infiniteScale = hasInfiniteScaling ? 2 : 0
ScalingScore = min(10, hypercarry + lateWinrateTrend + ratioScaling + infiniteScale)
```

**EarlyGameScore** (0–10):
```
baseDamage_norm = (baseDamage - minBaseDamage) / range × 3
laneBully = hasLaneBullyTag ? 3 : 0
earlyWR_norm = earlyGameWR percentile × 2
levelSpike = hasEarlyLevelSpike ? 2 : 0
EarlyGameScore = min(10, baseDamage_norm + laneBully + earlyWR_norm + levelSpike)
```

---

## 6. Stage Logic

### 6.1 Stage Transitions

```
State Machine:

  BAN_PHASE → PICK_PHASE
  
  PICK_PHASE substates:
    EARLY_DRAFT  (0–2 total known picks)
    MID_DRAFT    (3–6 total known picks)
    LATE_DRAFT   (7–10 total known picks)
```

### 6.2 Stage Behavioral Impact

| Behavior | EARLY | MID | LATE |
|----------|-------|-----|------|
| Flexibility emphasis | HIGH (+10%) | BASE | LOW (-5%) |
| Counter emphasis | LOW (-10%) | BASE | HIGH (+15%) |
| Composition emphasis | BASE | BASE | HIGH (+10%) |
| Risk penalty severity | LOW (-2%) | BASE | HIGH (+5%) |
| Recommended strategy | Pick flex/comfort | Balance team | Counter-pick & fill gaps |

### 6.3 Explanation Text by Stage

- **EARLY**: "Prioritize flexible champions with strong base stats. Counter-picking is less valuable with limited enemy information."
- **MID**: "Balance synergy with allies and begin evaluating enemy composition. Fill key team roles."
- **LATE**: "Focus on counter-picking revealed enemies and filling compositional gaps. Risk penalties are amplified."

---

## 7. Performance Architecture

### 7.1 Memoization Strategy

```
Layer 1: Champion data (loaded once, cached in Zustand)
Layer 2: Counter matrix lookups (O(1) via Map<string, number>)
Layer 3: Tag synergy rules (O(k) where k = tag count, memoized per pair)
Layer 4: Component scores (recomputed only when relevant inputs change)
Layer 5: Final scores (recomputed via selector when any component changes)
```

### 7.2 Recalculation Triggers

| Trigger | Recomputes |
|---------|------------|
| Ally pick added/removed | Synergy, Composition, Risk, Final |
| Enemy pick revealed | Counter, Threat, Risk, Final |
| Ban toggled | Available pool filter only |
| Filter/sort changed | UI sort only (scores stable) |

### 7.3 Performance Budget

- Full recalculation (all ~100 champions): < 50ms
- Single champion score: < 0.5ms
- UI re-render after state change: < 16ms (60fps)
