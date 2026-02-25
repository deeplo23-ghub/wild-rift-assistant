import { NormalizedChampion, RawChampion, RoleSchema } from "./validation";

const DAMAGE_MAP: Record<string, { ad: number; ap: number; true_: number }> = {
  assassin: { ad: 0.8, ap: 0.1, true_: 0.1 },
  fighter: { ad: 0.7, ap: 0.1, true_: 0.2 },
  mage: { ad: 0.1, ap: 0.8, true_: 0.1 },
  marksman: { ad: 0.9, ap: 0.05, true_: 0.05 },
  tank: { ad: 0.4, ap: 0.4, true_: 0.2 },
  support: { ad: 0.2, ap: 0.7, true_: 0.1 },
};

const ATTR_MAP: Record<string, any> = {
  assassin: { mobilityScore: 8, burstScore: 9, durabilityScore: 3 },
  fighter: { durabilityScore: 6, sustainScore: 6, ccScore: 4 },
  mage: { ccScore: 6, waveclearScore: 8, rangeScore: 7 },
  marksman: { scalingScore: 9, rangeScore: 8, durabilityScore: 2 },
  tank: { durabilityScore: 9, engageScore: 8, ccScore: 8 },
  support: { peelScore: 8, utilityScore: 9, healingScore: 5 },
};

function deriveTags(raw: RawChampion, attrs: any): string[] {
  const tags = new Set<string>();
  raw.roleTags.forEach(rt => {
    if (rt === "assassin") tags.add("assassin").add("burst").add("dive");
    if (rt === "tank") tags.add("frontline").add("cc-heavy");
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
  }).filter(Boolean) as any;

  if (roles.length === 0) roles.push("mid"); // Default fallback

  const dmgProfile = { ad: 0, ap: 0, true_: 0 };
  const attrs: any = {
    durabilityScore: 4, engageScore: 4, peelScore: 4, ccScore: 4,
    scalingScore: 5, earlyGameScore: 5, mobilityScore: 4,
    healingScore: 1, shieldScore: 1, waveclearScore: 4
  };

  raw.roleTags.forEach(tag => {
    const dmg = DAMAGE_MAP[tag];
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

  const finalAttrs: any = {};
  [
    "durabilityScore", "engageScore", "peelScore", "ccScore",
    "scalingScore", "earlyGameScore", "mobilityScore",
    "healingScore", "shieldScore", "waveclearScore"
  ].forEach(k => finalAttrs[k] = attrs[k] || 0);

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
    ...finalAttrs,
    tags: deriveTags(raw, attrs),
    iconUrl: raw.iconUrl,
  };
}
