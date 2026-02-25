"use client";

import React from "react";
import { useDraftStore } from "@/store/draftStore";
import { Role, Champion } from "@/types/champion";
import { TeamSide } from "@/types/draft";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const ROLE_LABELS = {
  [Role.Baron]: "Baron Lane",
  [Role.Jungle]: "Jungle",
  [Role.Mid]: "Mid Lane",
  [Role.Dragon]: "Dragon Lane",
  [Role.Support]: "Support",
};

export const EnemyPanel: React.FC = () => {
  const { enemy, allChampions, focusedSide, focusedRole, setFocusedSlot, removePick } = useDraftStore();

  const teamChampions = Object.values(enemy)
    .map(s => allChampions.find(c => c.id === s.championId))
    .filter((c): c is Champion => !!c);

  const totalDamage = teamChampions.reduce((acc, c) => ({
    ad: acc.ad + c.damageProfile.ad,
    ap: acc.ap + c.damageProfile.ap,
    true: acc.true + c.damageProfile.true,
  }), { ad: 0, ap: 0, true: 0 });

  const count = teamChampions.length || 1;
  const adPerc = Math.round((totalDamage.ad / count) * 100);
  const apPerc = Math.round((totalDamage.ap / count) * 100);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Panel Header */}
      <div className="flex flex-row-reverse items-center justify-between px-2">
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-red-500/80">Enemy Threat</h2>
        <div className="flex flex-row-reverse -space-x-2 space-x-reverse">
          {teamChampions.map((c, i) => (
            <div key={i} className="h-6 w-6 rounded-full border-2 border-[#050505] overflow-hidden bg-zinc-800">
              <img src={c.iconUrl} className="h-full w-full object-cover" alt="" />
            </div>
          ))}
          {teamChampions.length < 5 && (
            <div className="h-6 w-6 rounded-full border-2 border-[#050505] bg-white/5 flex items-center justify-center">
              <span className="text-[8px] font-bold text-zinc-600">{5 - teamChampions.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Slots */}
      <div className="flex flex-col gap-1.5 overflow-y-auto pr-2 custom-scrollbar">
        {(Object.keys(ROLE_LABELS) as Role[]).map((role) => {
          const slot = enemy[role];
          const champion = allChampions.find(c => c.id === slot.championId);
          const isFocused = focusedSide === TeamSide.Enemy && focusedRole === role;

          return (
            <button 
              key={role}
              onClick={() => {
                if (champion) removePick(TeamSide.Enemy, role);
                setFocusedSlot(TeamSide.Enemy, role);
              }}
              className={cn(
                "group relative flex flex-row-reverse items-center w-full gap-3 p-2 rounded-xl border transition-all duration-300",
                isFocused 
                  ? "border-red-500/50 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.1)]" 
                  : "border-white/[0.03] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
              )}
            >
              <div className="relative w-10 min-w-[40px] h-10 rounded-lg bg-zinc-900 border border-white/5 overflow-hidden">
                {champion ? (
                  <img 
                    src={champion.iconUrl} 
                    alt=""
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    onError={(e) => (e.currentTarget.src = "https://wr-meta.com/uploads/posts/2023-01/1675024764_1656622041_aatrox_10-min.jpg")}
                  />
                ) : (
                  <div className={cn(
                    "absolute inset-0 flex items-center justify-center opacity-20",
                    isFocused && "opacity-100"
                  )}>
                    <div className={cn(
                      "w-3 h-3 rounded-full border-2",
                      isFocused ? "border-red-400 bg-red-400/20 animate-pulse" : "border-zinc-700"
                    )} />
                  </div>
                )}
              </div>
              
              <div className="flex flex-col min-w-0 flex-1 items-end">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1 text-right">
                  {ROLE_LABELS[role]}
                </span>
                <span className={cn(
                  "text-[13px] font-bold truncate text-right",
                  champion ? "text-white" : "text-zinc-600"
                )}>
                  {champion ? champion.name : isFocused ? "Selecting..." : "Waiting..."}
                </span>
              </div>

              {champion && (
                <div className="flex flex-col items-start shrink-0 pl-1">
                  <span className="text-[11px] font-black text-red-500 leading-none">
                    {Math.round(champion.winrate)}%
                  </span>
                  <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-tighter mt-1">WR</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Composition Footer */}
      <div className="mt-auto pt-4 border-t border-white/[0.03]">
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.03] space-y-4 text-right">
          <div className="flex flex-row-reverse items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Damage Profile</span>
            <div className="flex flex-row-reverse gap-2 text-[9px] font-bold uppercase">
              <span className="text-blue-400">AD {adPerc}%</span>
              <span className="text-indigo-400">AP {apPerc}%</span>
            </div>
          </div>
          
          <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden flex flex-row-reverse">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${adPerc}%` }}
              className="h-full bg-blue-500" 
            />
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${apPerc}%` }}
              className="h-full bg-indigo-500" 
            />
          </div>
        </div>
      </div>
    </div>
  );
};
