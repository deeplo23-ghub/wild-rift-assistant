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
  tier: z.enum(["S+", "S", "A", "B", "C", "D", ""]),
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
    championCount: z.number().int().nonnegative(),
    version: z.string(),
  }),
  champions: z.array(RawChampionSchema),
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
  tier: z.enum(["S+", "S", "A", "B", "C", "D", ""]),
  
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
