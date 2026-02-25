"use client";

import React from "react";
import { useDraftStore } from "@/store/draftStore";
import { Role } from "@/types/champion";
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

  return (
    <div className="flex flex-col gap-4 p-6 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-red-500/20 shadow-xl shadow-red-500/5">
      <div className="flex items-center gap-2 mb-2">
        <Crosshair className="w-5 h-5 text-red-400" />
        <h2 className="text-xl font-bold text-white tracking-tight text-right">Enemy Team</h2>
      </div>
      
      <div className="flex flex-col gap-3">
        {(Object.keys(ROLE_LABELS) as Role[]).map((role) => {
          const slot = enemy[role];
          return (
            <div 
              key={role}
              className="group relative flex flex-row-reverse items-center gap-4 p-3 bg-slate-800/40 rounded-xl border border-white/5 hover:border-red-500/30 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-lg bg-slate-700/50 border border-white/10 flex items-center justify-center overflow-hidden">
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
                <span className="text-xs font-semibold text-red-400 uppercase tracking-widest leading-none mb-1 text-right">
                  {ROLE_LABELS[role]}
                </span>
                <span className="text-sm font-medium text-slate-300 text-right">
                  {slot.championId ? slot.championId.replace(/-/g, ' ') : "Selecting..."}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
