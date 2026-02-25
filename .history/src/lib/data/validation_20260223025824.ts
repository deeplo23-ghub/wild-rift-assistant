import { z } from "zod";

// ─── Raw Data Schemas (from scraper output) ─────────────────────────────────

export const RawChampionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  roles: z.array(z.string()), // May be empty for homepage-only champions
  winrate: z.number().min(0).max(80), // 0 = not yet scraped from page
  pickRate: z.number().min(0).max(100),
  banRate: z.number().min(0).max(100),
  tier: z.string().min(1),
  roleTags: z.array(z.string()),
  iconUrl: z.string(),
  pageUrl: z.string().url(),
  extremeThreats: z.array(z.string()),
  extremeSynergies: z.array(z.string()),
});

export const RawDataSchema = z.object({
  meta: z.object({
    scrapedAt: z.string(),
    championCount: z.number(),
    version: z.string(),
  }),
  champions: z.array(RawChampionSchema),
});

// ─── Normalized Data Schemas (ready for database) ───────────────────────────

export const RoleSchema = z.enum(["baron", "jungle", "mid", "dragon", "support"]);

export const NormalizedChampionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  roles: z.array(RoleSchema).min(1),
  winrate: z.number().min(0).max(80), // 0 allowed for untiered champions
  pickRate: z.number().min(0).max(100),
  banRate: z.number().min(0).max(100),
  tier: z.string().min(1),
  damageProfileAd: z.number().min(0).max(1),
  damageProfileAp: z.number().min(0).max(1),
  damageProfileTrue: z.number().min(0).max(1),
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
  tags: z.array(z.string()).min(1),
  iconUrl: z.string(),
});

// ─── Type Exports ───────────────────────────────────────────────────────────

export type RawChampion = z.infer<typeof RawChampionSchema>;
export type RawData = z.infer<typeof RawDataSchema>;
export type NormalizedChampion = z.infer<typeof NormalizedChampionSchema>;
