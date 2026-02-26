import { NormalizedChampion, RawChampion, RoleSchema } from "./validation";
import { getJunglerIcon } from "../utils";
import { Role } from "@/types/champion";

const DAMAGE_MAP: Record<string, { ad: number; ap: number; true_: number }> = {
  assassin: { ad: 0.8, ap: 0.2, true_: 0.0 },
  fighter: { ad: 0.8, ap: 0.2, true_: 0.0 },
  mage: { ad: 0.1, ap: 0.9, true_: 0.0 },
  marksman: { ad: 0.9, ap: 0.1, true_: 0.0 },
  tank: { ad: 0.5, ap: 0.5, true_: 0.0 },
  support: { ad: 0.2, ap: 0.8, true_: 0.0 },
};

// Champions who should bypass the class assumptions and get explicit True Damage
const TRUE_DAMAGE_OVERRIDES: Record<string, { ad: number; ap: number; true_: number }> = {
  "vayne": { ad: 0.4, ap: 0.05, true_: 0.55 },
  "fiora": { ad: 0.6, ap: 0.05, true_: 0.35 },
  "camille": { ad: 0.65, ap: 0.05, true_: 0.3 },
  "master-yi": { ad: 0.65, ap: 0.05, true_: 0.3 },
  "gwen": { ad: 0.1, ap: 0.65, true_: 0.25 },
  "ahri": { ad: 0.1, ap: 0.75, true_: 0.15 },
  "darius": { ad: 0.75, ap: 0.05, true_: 0.20 },
  "garen": { ad: 0.75, ap: 0.05, true_: 0.20 },
  "sett": { ad: 0.7, ap: 0.05, true_: 0.25 },
  "olaf": { ad: 0.7, ap: 0.05, true_: 0.25 },
};

const ATTR_MAP: Record<string, Record<string, number>> = {
  assassin: { mobilityScore: 8, burstScore: 9, durabilityScore: 3, objectiveScore: 4, teamfightScore: 4 },
  fighter: { durabilityScore: 6, sustainScore: 7, ccScore: 4, objectiveScore: 8, teamfightScore: 6 },
  mage: { ccScore: 6, waveclearScore: 8, rangeScore: 7, burstScore: 8, teamfightScore: 7 },
  marksman: { scalingScore: 9, rangeScore: 9, durabilityScore: 2, objectiveScore: 9, sustainScore: 5 },
  tank: { durabilityScore: 9, engageScore: 8, ccScore: 8, teamfightScore: 9, objectiveScore: 4 },
  support: { peelScore: 8, ccScore: 6, healingScore: 5, teamfightScore: 9, rangeScore: 6 },
};

function deriveTags(raw: RawChampion, attrs: Record<string, number>): string[] {
  const tags = new Set<string>();
  raw.roleTags.forEach(rt => {
    if (rt === "assassin") tags.add("assassin").add("burst").add("dive");
    if (rt === "tank") tags.add("frontline").add("cc");
    if (rt === "fighter") tags.add("early").add("skirmisher");
    if (rt === "mage") tags.add("poke").add("waveclear").add("aoe");
    if (rt === "marksman") tags.add("hypercarry").add("scaling").add("range");
    if (rt === "support") tags.add("peel").add("utility");
  });
  
  if (attrs.engageScore >= 7) tags.add("engage");
  if (attrs.durabilityScore >= 7) tags.add("frontline");
  
  if (tags.size === 0) tags.add("skirmisher"); // Default fallback
  
  return Array.from(tags);
}

export function normalizeChampion(raw: RawChampion): NormalizedChampion {
  const roles = raw.roles.map(r => {
    const res = RoleSchema.safeParse(r);
    return res.success ? res.data : null;
  }).filter(Boolean) as Role[];

  if (roles.length === 0) roles.push("mid" as Role); // Default fallback

  const dmgProfile = { ad: 0, ap: 0, true_: 0 };
  const attrs: Record<string, number> = {
    durabilityScore: 4, engageScore: 4, peelScore: 4, ccScore: 4,
    scalingScore: 5, earlyGameScore: 5, mobilityScore: 4,
    healingScore: 1, shieldScore: 1, waveclearScore: 4,
    burstScore: 3, rangeScore: 3, sustainScore: 3, 
    teamfightScore: 4, objectiveScore: 4
  };

  raw.roleTags.forEach(tag => {
    // If the champion has an explicit override, ignore the generic tags
    const dmg = TRUE_DAMAGE_OVERRIDES[raw.id] || DAMAGE_MAP[tag];
    if (dmg) {
      dmgProfile.ad += dmg.ad;
      dmgProfile.ap += dmg.ap;
      dmgProfile.true_ += dmg.true_;
    }
    const attr = ATTR_MAP[tag];
    if (attr) {
      Object.keys(attr).forEach(k => {
        attrs[k] = Math.max(attrs[k], attr[k]);
      });
    }
  });

  const tagCount = raw.roleTags.length || 1;
  dmgProfile.ad /= tagCount;
  dmgProfile.ap /= tagCount;
  dmgProfile.true_ /= tagCount;
  // Final sum normalization (guard against division by zero)
  const sum = dmgProfile.ad + dmgProfile.ap + dmgProfile.true_;
  if (sum > 0) {
    dmgProfile.ad /= sum;
    dmgProfile.ap /= sum;
    dmgProfile.true_ /= sum;
  } else {
    // Default balanced profile when no role tags
    dmgProfile.ad = 0.4;
    dmgProfile.ap = 0.4;
    dmgProfile.true_ = 0.2;
  }

  return {
    id: raw.id,
    name: raw.name,
    roles,
    winrate: raw.winrate,
    pickRate: raw.pickRate,
    banRate: raw.banRate,
    tier: raw.tier,
    damageProfileAd: dmgProfile.ad,
    damageProfileAp: dmgProfile.ap,
    damageProfileTrue: dmgProfile.true_,
    durabilityScore: attrs.durabilityScore || 0,
    engageScore: attrs.engageScore || 0,
    peelScore: attrs.peelScore || 0,
    ccScore: attrs.ccScore || 0,
    scalingScore: attrs.scalingScore || 0,
    earlyGameScore: attrs.earlyGameScore || 0,
    mobilityScore: attrs.mobilityScore || 0,
    healingScore: attrs.healingScore || 0,
    shieldScore: attrs.shieldScore || 0,
    waveclearScore: attrs.waveclearScore || 0,
    burstScore: attrs.burstScore || 0,
    rangeScore: attrs.rangeScore || 0,
    sustainScore: attrs.sustainScore || 0,
    teamfightScore: attrs.teamfightScore || 0,
    objectiveScore: attrs.objectiveScore || 0,
    tags: deriveTags(raw, attrs),
    iconUrl: raw.iconUrl.includes("wr-meta") ? getJunglerIcon(raw.name) : raw.iconUrl,
  };
}
