import { useDraftStore } from "@/store/draftStore";
import { TeamSide, RoleSlot } from "@/types/draft";
import { Role } from "@/types/champion";
import { useMemo } from "react";

export function useTeamLogic(side: TeamSide) {
  const store = useDraftStore();
  const team = store[side];
  
  const slots = useMemo(() => {
    return [Role.Baron, Role.Jungle, Role.Mid, Role.Dragon, Role.Support].map(role => ({
      ...team[role]
    }));
  }, [team]);

  const picks = useMemo(() => {
    return slots
      .map(slot => store.allChampions.find(c => c.id === slot.championId))
      .filter(Boolean);
  }, [slots, store.allChampions]);

  // Team-level calculations
  const metrics = useMemo(() => {
    if (picks.length === 0) return null;

    const avgWinrate = picks.reduce((acc, c) => acc + (c?.winrate || 0), 0) / picks.length;
    const totalEngage = picks.reduce((acc, c) => acc + (c?.engageScore || 0), 0);
    const totalDurability = picks.reduce((acc, c) => acc + (c?.durabilityScore || 0), 0);
    const totalCC = picks.reduce((acc, c) => acc + (c?.ccScore || 0), 0);
    
    // Simple composition classification
    let composition = "Balanced";
    if (totalEngage > 35) composition = "Hard Engage";
    else if (totalDurability > 35) composition = "Frontline Heavy";
    else if (picks.every(c => c?.damageProfile.ap && c.damageProfile.ap > 0.7)) composition = "Full AP";
    else if (picks.every(c => c?.damageProfile.ad && c.damageProfile.ad > 0.7)) composition = "Full AD";

    return {
      avgWinrate,
      composition,
      totals: {
        engage: totalEngage,
        durability: totalDurability,
        cc: totalCC
      }
    };
  }, [picks]);

  return {
    slots,
    picks,
    metrics,
    focusedRole: store.focusedSide === side ? store.focusedRole : null
  };
}
