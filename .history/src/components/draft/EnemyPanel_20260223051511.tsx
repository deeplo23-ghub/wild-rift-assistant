"use client";

import React from "react";
import { useDraftStore } from "@/store/draftStore";
import { Role } from "@/types/champion";
import { TeamSide } from "@/types/draft";
import { Crosshair } from "lucide-react";

const ROLE_LABELS = {
  [Role.Baron]: "Baron Lane",
  [Role.Jungle]: "Jungle",
  [Role.Mid]: "Mid Lane",
  [Role.Dragon]: "Dragon Lane",
  [Role.Support]: "Support",
};

export const EnemyPanel: React.FC = () => {
  const enemy = useDraftStore((state) => state.enemy);
  const activeSide = useDraftStore((state) => state.activeSide);
  const activeRole = useDraftStore((state) => state.activeRole);
  const isBan = useDraftStore((state) => state.isBan);
  const setActiveSlot = useDraftStore((state) => state.setActiveSlot);

  return (
    <div className="flex flex-col gap-4 p-6 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-red-500/20 shadow-xl shadow-red-500/5">
      <div className="flex items-center justify-between mb-2">
        <div className="px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-[10px] font-black text-red-400 uppercase tracking-tighter">
          RED SIDE
        </div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-white tracking-tight text-right">Enemy Team</h2>
          <Crosshair className="w-5 h-5 text-red-400" />
        </div>
      </div>
      
      <div className="flex flex-col gap-3">
        {(Object.keys(ROLE_LABELS) as Role[]).map((role) => {
          const slot = enemy[role];
          const isActive = activeSide === TeamSide.Enemy && activeRole === role && !isBan;

          return (
            <div 
              key={role}
              onClick={() => setActiveSlot(TeamSide.Enemy, role, false)}
              className={`group relative flex flex-row-reverse items-center gap-4 p-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                isActive 
                  ? "bg-red-500/10 border-red-500/50 shadow-lg shadow-red-500/10 ring-1 ring-red-500/30" 
                  : "bg-slate-800/40 border-white/5 hover:border-red-500/30"
              }`}
            >
              <div className="w-12 h-12 rounded-lg bg-slate-700/50 border border-white/10 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
                {slot.championId ? (
                  <img 
                    src={`/champions/${slot.championId}.png`} 
                    alt={slot.championId}
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.src = "/placeholder-champion.png")}
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-600/30 border border-white/10" />
                )}
              </div>
              
              <div className="flex flex-col items-end">
                <span className={`text-xs font-semibold uppercase tracking-widest leading-none mb-1 text-right ${isActive ? "text-red-300" : "text-red-400"}`}>
                  {ROLE_LABELS[role]}
                </span>
                <span className={`text-sm font-medium text-right ${slot.championId ? "text-slate-100" : "text-slate-500 italic"}`}>
                  {slot.championId ? slot.championId.replace(/-/g, ' ') : "Selecting..."}
                </span>
              </div>

              {isActive && (
                <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
