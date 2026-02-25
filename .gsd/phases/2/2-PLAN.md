# Phase 2 — Plan 2: Normalization + Validation + Counter Matrix

> **Wave**: 2 of 3
> **Dependencies**: Plan 2.1 complete (raw scraped data in `raw-data.json`)
> **Scope**: Normalize raw data into application types, build counter matrix, validate with Zod

---

## Context

You have raw scraped data in `scripts/scraper/output/raw-data.json` from Plan 1. This plan creates the normalization layer that transforms raw scrape output into validated, application-ready data conforming to the Champion type definition.

Read these files first for context:
- `.gsd/phases/2/RESEARCH.md` — Data availability and mapping
- `src/types/champion.ts` — Target Champion interface
- `src/lib/data/tags.ts` — COUNTER_CATEGORY_MAP and tag definitions
- `scripts/scraper/output/raw-data.json` — Raw scraped data (from Plan 1 output)

---

## Tasks

### Task 1: Create Zod validation schemas

<task id="2.2.1" depends="">
<action>

Create `src/lib/data/validation.ts`:

Define strict Zod schemas that match our TypeScript types. These validate raw scraped data before it enters the database.

```typescript
import { z } from "zod";

// ─── Raw Data Schemas (from scraper output) ─────────────────────────────

/** Validates a single raw champion entry from scraped data */
export const RawChampionSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9-]+$/, "ID must be kebab-case"),
  name: z.string().min(1),
  roles: z.array(z.string()).min(1),
  winrate: z.number().min(30).max(80), // realistic winrate range
  pickRate: z.number().min(0).max(100),
  banRate: z.number().min(0).max(100),
  tier: z.enum(["S+", "S", "A", "B", "C", "D"]),
  roleTags: z.array(z.string()),
  iconUrl: z.string(),
  pageUrl: z.string().url(),
});

/** Validates a counter pair entry */
export const RawCounterPairSchema = z.object({
  championId: z.string().min(1),
  threatId: z.string().min(1),
  category: z.enum(["extreme", "major", "minor", "even"]),
});

/** Validates the full raw data output */
export const RawDataSchema = z.object({
  meta: z.object({
    scrapedAt: z.string().datetime(),
    championCount: z.number().int().positive(),
    version: z.string(),
  }),
  champions: z.array(RawChampionSchema).min(50), // expect 100+ champions
  counterPairs: z.array(RawCounterPairSchema),
});

// ─── Normalized Data Schemas (ready for database) ───────────────────────

/** Valid role values */
export const RoleSchema = z.enum(["baron", "jungle", "mid", "dragon", "support"]);

/** Validates a normalized champion ready for DB insertion */
export const NormalizedChampionSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  roles: z.array(RoleSchema).min(1),
  winrate: z.number().min(30).max(80),
  pickRate: z.number().min(0).max(100),
  banRate: z.number().min(0).max(100),
  tier: z.enum(["S+", "S", "A", "B", "C", "D"]),
  
  // Damage profile (derived, each 0-1)
  damageProfileAd: z.number().min(0).max(1),
  damageProfileAp: z.number().min(0).max(1),
  damageProfileTrue: z.number().min(0).max(1),
  
  // Derived scores (each 0-10)
  durabilityScore: z.number().min(0).max(10),
  engageScore: z.number().min(0).max(10),
  peelScore: z.number().min(0).max(10),
  ccScore: z.number().min(0).max(10),
  scalingScore: z.number().min(0).max(10),
  earlyGameScore: z.number().min(0).max(10),
  mobilityScore: z.number().min(0).max(10),
  healingScore: z.number().min(0).max(10),
  shieldScore: z.number().min(0).max(10),
  waveclearScore: z.number().min(0).max(10),
  
  tags: z.array(z.string()),
  iconUrl: z.string(),
});

/** Validates a counter matchup for DB insertion */
export const NormalizedCounterSchema = z.object({
  championId: z.string().min(1),
  opponentId: z.string().min(1),
  value: z.number().min(-5).max(5),
});

// ─── Type Exports ───────────────────────────────────────────────────────

export type RawChampion = z.infer<typeof RawChampionSchema>;
export type RawCounterPair = z.infer<typeof RawCounterPairSchema>;
export type RawData = z.infer<typeof RawDataSchema>;
export type NormalizedChampion = z.infer<typeof NormalizedChampionSchema>;
export type NormalizedCounter = z.infer<typeof NormalizedCounterSchema>;
```

</action>

<verify>
- `npx tsc --noEmit` passes
- Schema constants are correctly typed
</verify>

<done>
- Zod schemas: RawChampionSchema, RawCounterPairSchema, RawDataSchema
- Normalized schemas: NormalizedChampionSchema, NormalizedCounterSchema
- Type exports derived from schemas
</done>
</task>

### Task 2: Create the normalization layer

<task id="2.2.2" depends="2.2.1">
<action>

Create `src/lib/data/normalize.ts`:

This is the core data transformation layer. It converts raw scraped data into normalized application-ready data. Key responsibilities:
1. Role name normalization ("solo" → "baron", "duo" → "dragon")
2. Tier normalization
3. Counter matrix construction from threat pairs
4. Damage profile derivation from role tags
5. Attribute score derivation from role tags and champion class
6. Champion tag assignment from role tags and derived attributes

```typescript
import { COUNTER_CATEGORY_MAP } from "./tags";
import { MatchupCategory } from "@/types/champion";
import type { RawChampion, RawCounterPair, NormalizedChampion, NormalizedCounter } from "./validation";
import { NormalizedChampionSchema, NormalizedCounterSchema } from "./validation";

// ─── Role Normalization ─────────────────────────────────────────────────

const ROLE_NORMALIZE: Record<string, string> = {
  mid: "mid",
  solo: "baron",
  baron: "baron",
  jungle: "jungle",
  duo: "dragon",
  adc: "dragon",
  dragon: "dragon",
  support: "support",
  sup: "support",
};

function normalizeRole(raw: string): string {
  return ROLE_NORMALIZE[raw.toLowerCase()] || raw.toLowerCase();
}

// ─── Damage Profile Derivation ──────────────────────────────────────────

/**
 * Derive damage profile from role tags (Assassin, Fighter, Mage, etc.)
 * This is a rough approximation — scraped data doesn't provide exact damage split.
 */
const DAMAGE_PROFILE_MAP: Record<string, { ad: number; ap: number; true_: number }> = {
  assassin: { ad: 0.7, ap: 0.2, true_: 0.1 },
  fighter: { ad: 0.7, ap: 0.1, true_: 0.2 },
  marksman: { ad: 0.85, ap: 0.1, true_: 0.05 },
  mage: { ad: 0.1, ap: 0.85, true_: 0.05 },
  tank: { ad: 0.3, ap: 0.3, true_: 0.4 },
  support: { ad: 0.2, ap: 0.6, true_: 0.2 },
};

function deriveDamageProfile(roleTags: string[]): { ad: number; ap: number; true_: number } {
  if (roleTags.length === 0) return { ad: 0.5, ap: 0.4, true_: 0.1 };
  
  let ad = 0, ap = 0, true_ = 0;
  let matches = 0;
  
  for (const tag of roleTags) {
    const profile = DAMAGE_PROFILE_MAP[tag.toLowerCase()];
    if (profile) {
      ad += profile.ad;
      ap += profile.ap;
      true_ += profile.true_;
      matches++;
    }
  }
  
  if (matches === 0) return { ad: 0.5, ap: 0.4, true_: 0.1 };
  
  // Average and normalize to sum to 1
  ad /= matches;
  ap /= matches;
  true_ /= matches;
  const total = ad + ap + true_;
  
  return {
    ad: Math.round((ad / total) * 100) / 100,
    ap: Math.round((ap / total) * 100) / 100,
    true_: Math.round((true_ / total) * 100) / 100,
  };
}

// ─── Attribute Score Derivation ─────────────────────────────────────────

/**
 * Derive attribute scores (0-10) from role tags and base stats.
 * See ARCHITECTURE.md §5.5 for derivation methodology.
 *
 * These are HEURISTIC derivations — not scraped data. They provide
 * baseline scores that the scoring engine uses for composition analysis.
 */
interface DerivedAttributes {
  durabilityScore: number;
  engageScore: number;
  peelScore: number;
  ccScore: number;
  scalingScore: number;
  earlyGameScore: number;
  mobilityScore: number;
  healingScore: number;
  shieldScore: number;
  waveclearScore: number;
}

const TAG_ATTRIBUTE_MAP: Record<string, Partial<DerivedAttributes>> = {
  tank: { durabilityScore: 8, engageScore: 6, ccScore: 6, waveclearScore: 5 },
  fighter: { durabilityScore: 5, engageScore: 4, earlyGameScore: 6, waveclearScore: 6 },
  assassin: { mobilityScore: 8, earlyGameScore: 7, waveclearScore: 5 },
  mage: { ccScore: 5, waveclearScore: 7, scalingScore: 6 },
  marksman: { scalingScore: 7, waveclearScore: 5, earlyGameScore: 3 },
  support: { peelScore: 6, healingScore: 4, shieldScore: 4, ccScore: 5 },
};

function deriveAttributes(roleTags: string[], tier: string): DerivedAttributes {
  const base: DerivedAttributes = {
    durabilityScore: 3,
    engageScore: 2,
    peelScore: 2,
    ccScore: 2,
    scalingScore: 5,
    earlyGameScore: 5,
    mobilityScore: 4,
    healingScore: 1,
    shieldScore: 1,
    waveclearScore: 4,
  };
  
  // Apply role tag boosts
  for (const tag of roleTags) {
    const boosts = TAG_ATTRIBUTE_MAP[tag.toLowerCase()];
    if (boosts) {
      for (const [key, value] of Object.entries(boosts)) {
        const k = key as keyof DerivedAttributes;
        base[k] = Math.max(base[k], value as number);
      }
    }
  }
  
  // Tier adjustment: S+ champions get slight boost to all scores
  const tierBoost: Record<string, number> = {
    "S+": 1.5, S: 1.0, A: 0.5, B: 0, C: -0.5, D: -1.0,
  };
  const boost = tierBoost[tier] || 0;
  
  for (const key of Object.keys(base) as (keyof DerivedAttributes)[]) {
    base[key] = Math.max(0, Math.min(10, Math.round((base[key] + boost * 0.3) * 10) / 10));
  }
  
  return base;
}

// ─── Champion Tag Assignment ────────────────────────────────────────────

function deriveChampionTags(
  roleTags: string[],
  attrs: DerivedAttributes
): string[] {
  const tags: string[] = [];
  
  // From role tags
  const lowerTags = roleTags.map(t => t.toLowerCase());
  if (lowerTags.includes("assassin")) tags.push("assassin", "dive", "burst");
  if (lowerTags.includes("tank")) tags.push("frontline", "cc-heavy");
  if (lowerTags.includes("fighter")) tags.push("early");
  if (lowerTags.includes("mage")) tags.push("poke", "waveclear");
  if (lowerTags.includes("marksman")) tags.push("hypercarry", "scaling");
  if (lowerTags.includes("support")) tags.push("peel");
  
  // From derived attributes
  if (attrs.engageScore >= 7) tags.push("engage");
  if (attrs.peelScore >= 7) tags.push("peel");
  if (attrs.ccScore >= 7) tags.push("cc-heavy");
  if (attrs.healingScore >= 5) tags.push("sustain");
  if (attrs.shieldScore >= 5) tags.push("shield");
  if (attrs.waveclearScore >= 7) tags.push("waveclear");
  if (attrs.durabilityScore >= 7) tags.push("frontline");
  if (attrs.mobilityScore >= 7 && lowerTags.includes("fighter")) tags.push("splitpush");
  
  // Deduplicate
  return [...new Set(tags)];
}

// ─── Counter Matrix Construction ────────────────────────────────────────

/**
 * Convert raw counter pairs to normalized counter matchup values.
 *
 * From RESEARCH.md: Only "Extreme" threats are available (free tier).
 * Extreme threats → the champion (championId) is COUNTERED BY the threat (threatId).
 * So from championId's perspective: value is NEGATIVE (disadvantage).
 * From threatId's perspective: value is POSITIVE (advantage).
 */
function normalizeCounterPairs(pairs: RawCounterPair[]): NormalizedCounter[] {
  const counterMap = new Map<string, number>();
  
  for (const pair of pairs) {
    // Champion is threatened by threat → champion has disadvantage vs threat
    const key1 = `${pair.championId}:${pair.threatId}`;
    // Threat has advantage over champion
    const key2 = `${pair.threatId}:${pair.championId}`;
    
    let value: number;
    switch (pair.category) {
      case "extreme": value = 5; break;
      case "major": value = 3; break;
      case "minor": value = 1; break;
      case "even": value = 0; break;
      default: value = 0;
    }
    
    // Champion's perspective: disadvantage
    counterMap.set(key1, Math.min(counterMap.get(key1) ?? -value, -value));
    // Threat's perspective: advantage
    counterMap.set(key2, Math.max(counterMap.get(key2) ?? value, value));
  }
  
  const results: NormalizedCounter[] = [];
  for (const [key, value] of counterMap) {
    const [championId, opponentId] = key.split(":");
    results.push({ championId, opponentId, value });
  }
  
  return results;
}

// ─── Main Normalization Function ────────────────────────────────────────

export interface NormalizedData {
  champions: NormalizedChampion[];
  counters: NormalizedCounter[];
  meta: {
    scrapedAt: string;
    championCount: number;
    version: string;
    validationErrors: string[];
  };
}

export function normalizeRawData(rawData: {
  meta: { scrapedAt: string; championCount: number; version: string };
  champions: RawChampion[];
  counterPairs: RawCounterPair[];
}): NormalizedData {
  const validationErrors: string[] = [];
  const champions: NormalizedChampion[] = [];
  
  for (const raw of rawData.champions) {
    // Normalize roles
    const roles = raw.roles.map(normalizeRole).filter(r =>
      ["baron", "jungle", "mid", "dragon", "support"].includes(r)
    );
    
    if (roles.length === 0) {
      validationErrors.push(`Champion ${raw.id}: no valid roles after normalization`);
      continue;
    }
    
    // Derive attributes
    const damageProfile = deriveDamageProfile(raw.roleTags);
    const attrs = deriveAttributes(raw.roleTags, raw.tier);
    const tags = deriveChampionTags(raw.roleTags, attrs);
    
    const normalized: NormalizedChampion = {
      id: raw.id,
      name: raw.name,
      roles,
      winrate: raw.winrate,
      pickRate: raw.pickRate,
      banRate: raw.banRate,
      tier: raw.tier as "S+" | "S" | "A" | "B" | "C" | "D",
      damageProfileAd: damageProfile.ad,
      damageProfileAp: damageProfile.ap,
      damageProfileTrue: damageProfile.true_,
      ...attrs,
      tags,
      iconUrl: raw.iconUrl,
    };
    
    // Validate with Zod
    const result = NormalizedChampionSchema.safeParse(normalized);
    if (!result.success) {
      validationErrors.push(
        `Champion ${raw.id}: ${result.error.issues.map(i => i.message).join(", ")}`
      );
      continue;
    }
    
    champions.push(result.data);
  }
  
  // Normalize counter pairs
  const rawCounters = normalizeCounterPairs(rawData.counterPairs);
  const counters: NormalizedCounter[] = [];
  
  // Filter to only include champions we have
  const validIds = new Set(champions.map(c => c.id));
  for (const counter of rawCounters) {
    if (validIds.has(counter.championId) && validIds.has(counter.opponentId)) {
      const result = NormalizedCounterSchema.safeParse(counter);
      if (result.success) {
        counters.push(result.data);
      } else {
        validationErrors.push(
          `Counter ${counter.championId}→${counter.opponentId}: ${result.error.issues.map(i => i.message).join(", ")}`
        );
      }
    }
  }
  
  return {
    champions,
    counters,
    meta: {
      scrapedAt: rawData.meta.scrapedAt,
      championCount: champions.length,
      version: rawData.meta.version,
      validationErrors,
    },
  };
}
```

</action>

<verify>
- `npx tsc --noEmit` passes
- Can test normalization with raw data:
  ```
  npx tsx -e "
    const { normalizeRawData } = require('./src/lib/data/normalize');
    const rawData = require('./scripts/scraper/output/raw-data.json');
    const result = normalizeRawData(rawData);
    console.log('Champions:', result.champions.length);
    console.log('Counters:', result.counters.length);
    console.log('Errors:', result.meta.validationErrors.length);
  "
  ```
</verify>

<done>
- `src/lib/data/validation.ts` with Zod schemas for raw + normalized data
- `src/lib/data/normalize.ts` with complete normalization pipeline:
  - Role normalization (solo→baron, duo→dragon)
  - Damage profile derivation from role tags
  - Attribute score derivation (heuristic, tier-adjusted)
  - Champion tag assignment
  - Counter matrix construction (extreme threats → [-5, +5] values)
  - Zod validation on every output record
  - Error collection (non-fatal, reports skipped champions)
</done>
</task>

---

## Success Criteria

1. ✅ Zod schemas validate raw scraper output and normalized output
2. ✅ `normalizeRawData()` takes raw JSON → produces NormalizedChampion[] and NormalizedCounter[]
3. ✅ Counter pairs correctly use bidirectional values (champion=-5, threat=+5 for extreme)
4. ✅ Role normalization handles solo→baron, duo→dragon
5. ✅ Damage profile derived from role tags (assassin→mostly AD, mage→mostly AP)
6. ✅ Attribute scores derived heuristically with tier adjustment
7. ✅ All output validated with Zod (invalid records skipped with descriptive errors)
8. ✅ Build passes (`npx tsc --noEmit`)
