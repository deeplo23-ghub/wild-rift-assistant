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
  const count = teamChampions.length || 1;
  
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
  if (compCounts.frontline < 1) gaps.push("Missing Frontline");
  if (compCounts.engage < 1) gaps.push("Missing Engage");
  if (compCounts.waveclear < 1) gaps.push("Low Waveclear");
  if (compCounts.cc < 1) gaps.push("Low CC");

  // 3. Threat Profile
  const threatProfile: ThreatProfile = {
    [ThreatCategory.Burst]: teamChampions.reduce((acc, c) => acc + (c.tags.includes("burst" as any) ? 2 : 0), 0) / count * 10,
    [ThreatCategory.Poke]: teamChampions.reduce((acc, c) => acc + (c.tags.includes("poke" as any) ? 2 : 0), 0) / count * 10,
    [ThreatCategory.Dive]: teamChampions.reduce((acc, c) => acc + (c.tags.includes("dive" as any) ? 2 : 0), 0) / count * 10,
    [ThreatCategory.Sustain]: teamChampions.reduce((acc, c) => acc + (c.tags.includes("sustain" as any) ? 2 : 0), 0) / count * 10,
    [ThreatCategory.Splitpush]: teamChampions.reduce((acc, c) => acc + (c.tags.includes("splitpush" as any) ? 2 : 0), 0) / count * 10,
  };

  // 4. Overall Power
  const avgWinrate = teamChampions.reduce((acc, c) => acc + c.winrate, 0) / count;
  const overallPower = avgWinrate; // Placeholder for more complex aggregation if needed

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
