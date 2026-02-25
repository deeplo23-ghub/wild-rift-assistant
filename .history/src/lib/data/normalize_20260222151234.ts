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
      roles: roles as any,
      winrate: raw.winrate,
      pickRate: raw.pickRate,
      banRate: raw.banRate,
      tier: raw.tier as "S+" | "S" | "A" | "B" | "C" | "D" | "",
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
        `Champion ${raw.id}: ${result.error.issues.map(i => i.path.join(".") + " " + i.message).join(", ")}`
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
