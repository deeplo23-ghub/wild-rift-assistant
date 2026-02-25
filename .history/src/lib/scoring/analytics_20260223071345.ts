import { Champion, Role, DamageProfile } from "@/types/champion";
import { CompositionElement, ThreatCategory, ThreatProfile } from "@/types/scoring";

export interface TeamAnalytics {
  damageProfile: DamageProfile;
  composition: {
    counts: Record<string, number>;
    gaps: string[];
  };
  threatProfile: ThreatProfile;
  overallPower: number;
}

export function analyzeTeam(teamChampions: Champion[]): TeamAnalytics {
  const count = teamChampions.length || 0;
  
  if (count === 0) {
    return {
      damageProfile: { ad: 0, ap: 0, true: 0 },
      composition: { counts: {}, gaps: [] },
      threatProfile: {
        [ThreatCategory.Burst]: 0,
        [ThreatCategory.Poke]: 0,
        [ThreatCategory.Dive]: 0,
        [ThreatCategory.Sustain]: 0,
        [ThreatCategory.Splitpush]: 0,
      },
      overallPower: 0
    };
  }
  
  // 1. Damage Profile
  const totalDamage = teamChampions.reduce((acc, c) => ({
    ad: acc.ad + c.damageProfile.ad,
    ap: acc.ap + c.damageProfile.ap,
    true: acc.true + c.damageProfile.true,
  }), { ad: 0, ap: 0, true: 0 });

  const damageProfile: DamageProfile = {
    ad: totalDamage.ad / count,
    ap: totalDamage.ap / count,
    true: totalDamage.true / count,
  };

  // 2. Composition Analysis
  const compCounts = {
    frontline: teamChampions.filter(c => c.durabilityScore >= 7).length,
    engage: teamChampions.filter(c => c.engageScore >= 6).length,
    peel: teamChampions.filter(c => c.peelScore >= 5).length,
    waveclear: teamChampions.filter(c => c.waveclearScore >= 5).length,
    cc: teamChampions.filter(c => c.ccScore >= 4).length,
    scaling: teamChampions.filter(c => c.scalingScore >= 7).length,
  };

  const gaps: string[] = [];
  if (compCounts.frontline < 1 && count >= 3) gaps.push("No Frontline");
  if (compCounts.engage < 1 && count >= 3) gaps.push("No Engage");
  if (damageProfile.ad < 0.2 && count >= 3) gaps.push("Too much AP");
  if (damageProfile.ap < 0.2 && count >= 3) gaps.push("Too much AD");

  // 3. Threat Profile
  const threatProfile: ThreatProfile = {
    [ThreatCategory.Burst]: teamChampions.reduce((acc, c) => acc + (c.tags.includes("burst" as any) ? 1 : 0), 0) / 5 * 100,
    [ThreatCategory.Poke]: teamChampions.reduce((acc, c) => acc + (c.tags.includes("poke" as any) ? 1 : 0), 0) / 5 * 100,
    [ThreatCategory.Dive]: teamChampions.reduce((acc, c) => acc + (c.tags.includes("dive" as any) ? 1 : 0), 0) / 5 * 100,
    [ThreatCategory.Sustain]: teamChampions.reduce((acc, c) => acc + (c.tags.includes("sustain" as any) ? 1 : 0), 0) / 5 * 100,
    [ThreatCategory.Splitpush]: teamChampions.reduce((acc, c) => acc + (c.tags.includes("splitpush" as any) ? 1 : 0), 0) / 5 * 100,
  };

  // 4. Overall Power (Weighted average of winrate and tiers)
  const avgWinrate = teamChampions.reduce((acc, c) => acc + c.winrate, 0) / count;
  const powerBase = (avgWinrate - 45) * 5; // Normalize 45-55 WR to 0-50 range
  const compBonus = (Object.keys(compCounts).filter(k => compCounts[k as keyof typeof compCounts] > 0).length / 6) * 50;
  
  const overallPower = Math.min(100, Math.max(0, powerBase + compBonus));

  return {
    damageProfile,
    composition: {
      counts: compCounts,
      gaps,
    },
    threatProfile,
    overallPower,
  };
}
