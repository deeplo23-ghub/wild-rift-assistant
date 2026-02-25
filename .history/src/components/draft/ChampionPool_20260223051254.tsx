"use client";

import React, { useState } from "react";
import { useDraftStore } from "@/store/draftStore";
import { Role, Champion } from "@/types/champion";
import { Search, Filter, Sparkles } from "lucide-react";

interface ChampionPoolProps {
  champions: Champion[];
}

export const ChampionPool: React.FC<ChampionPoolProps> = ({ champions }) => {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  
  const pickChampion = useDraftStore((state) => state.pickChampion);
  const phase = useDraftStore((state) => state.phase);
  const side = phase.toLowerCase().includes("ally") ? "ally" : "enemy";

  const scoredChampions = useDraftStore((state) => state.scoredChampions);
  const scoredMap = new Map(scoredChampions.map(s => [s.championId, s]));

  const filteredChampions = champions.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || c.roles.includes(roleFilter);
    return matchesSearch && matchesRole;
  });

  // Sort filtered by score if available
  const sortedChampions = [...filteredChampions].sort((a, b) => {
    const scoreA = scoredMap.get(a.id)?.finalScore ?? 0;
    const scoreB = scoredMap.get(b.id)?.finalScore ?? 0;
    return scoreB - scoreA;
  });

  return (
    <div className="flex flex-col gap-6 p-8 bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative group flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
          <input
            type="text"
            placeholder="Search champions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {(["all", ...Object.values(Role)] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all ${
                roleFilter === r
                  ? "bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/20"
                  : "bg-slate-800/50 border-white/5 text-slate-400 hover:border-white/20"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {sortedChampions.map((champion) => {
          const scoreData = scoredMap.get(champion.id);
          const isUnavailable = !scoreData && (
            useDraftStore.getState().bans.ally.includes(champion.id) ||
            useDraftStore.getState().bans.enemy.includes(champion.id) ||
            Object.values(useDraftStore.getState().ally).some(s => s.championId === champion.id) ||
            Object.values(useDraftStore.getState().enemy).some(s => s.championId === champion.id)
          );

          return (
            <button
              key={champion.id}
              disabled={!!isUnavailable}
              onClick={() => pickChampion(side as any, Role.Baron, champion.id)} // Placeholder role logic
              className={`group relative flex flex-col items-center gap-2 p-2 rounded-2xl transition-all duration-300 active:scale-95 ${
                isUnavailable ? "opacity-20 grayscale cursor-not-allowed" : "hover:bg-white/5"
              }`}
            >
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden border-2 border-transparent group-hover:border-blue-500/50 transition-colors">
                <img
                  src={champion.iconUrl}
                  alt={champion.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-x-0 bottom-0 p-1 bg-gradient-to-t from-black/80 to-transparent flex justify-center">
                  <span className="text-[10px] font-bold text-white uppercase">{champion.tier}</span>
                </div>
                
                {/* Scoring Overlay */}
                {scoreData && (
                  <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-blue-500/90 rounded-lg flex items-center gap-0.5 text-[10px] font-black text-white shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <Sparkles className="w-2.5 h-2.5" />
                    {Math.round(scoreData.finalScore)}
                  </div>
                )}
              </div>
              <span className="text-[11px] font-bold text-slate-300 truncate w-full group-hover:text-white">
                {champion.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
