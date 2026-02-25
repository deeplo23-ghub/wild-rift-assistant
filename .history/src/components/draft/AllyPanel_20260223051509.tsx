"use client";

import React from "react";
import { useDraftStore } from "@/store/draftStore";
import { Role } from "@/types/champion";
import { TeamSide } from "@/types/draft";
import { Users } from "lucide-react";

const ROLE_LABELS = {
  [Role.Baron]: "Baron Lane",
  [Role.Jungle]: "Jungle",
  [Role.Mid]: "Mid Lane",
  [Role.Dragon]: "Dragon Lane",
  [Role.Support]: "Support",
};

export const AllyPanel: React.FC = () => {
  const ally = useDraftStore((state) => state.ally);
  const activeSide = useDraftStore((state) => state.activeSide);
  const activeRole = useDraftStore((state) => state.activeRole);
  const isBan = useDraftStore((state) => state.isBan);
  const setActiveSlot = useDraftStore((state) => state.setActiveSlot);

  return (
    <div className="flex flex-col gap-4 p-6 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-blue-500/20 shadow-xl shadow-blue-500/5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">Ally Team</h2>
        </div>
        <div className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 uppercase tracking-tighter">
          BLUE SIDE
        </div>
      </div>
      
      <div className="flex flex-col gap-3">
        {(Object.keys(ROLE_LABELS) as Role[]).map((role) => {
          const slot = ally[role];
          const isActive = activeSide === "ally" && activeRole === role && !isBan;

          return (
            <div 
              key={role}
              onClick={() => setActiveSlot(TeamSide.Ally, role, false)}
              className={`group relative flex items-center gap-4 p-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                isActive 
                  ? "bg-blue-500/10 border-blue-500/50 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/30" 
                  : "bg-slate-800/40 border-white/5 hover:border-blue-500/30"
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
              
              <div className="flex flex-col">
                <span className={`text-xs font-semibold uppercase tracking-widest leading-none mb-1 ${isActive ? "text-blue-300" : "text-blue-400"}`}>
                  {ROLE_LABELS[role]}
                </span>
                <span className={`text-sm font-medium ${slot.championId ? "text-slate-100" : "text-slate-500 italic"}`}>
                  {slot.championId ? slot.championId.replace(/-/g, ' ') : "Selecting..."}
                </span>
              </div>

              {slot.championId && (
                <div className="ml-auto text-right">
                  <div className="text-lg font-black text-blue-400">84.5</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Draft Power</div>
                </div>
              )}

              {isActive && (
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-full animate-pulse" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
