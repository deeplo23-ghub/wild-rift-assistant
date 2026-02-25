"use client";

import React, { useEffect } from "react";
import { AllyPanel } from "@/components/draft/AllyPanel";
import { EnemyPanel } from "@/components/draft/EnemyPanel";
import { ChampionPool } from "@/components/draft/ChampionPool";
import { ScoreBreakdown } from "@/components/draft/ScoreBreakdown";
import { useDraftStore } from "@/store/draftStore";
import { trpc } from "@/lib/trpc/client";
import { Swords, RotateCcw, Ban } from "lucide-react";

export default function Home() {
  const { data: champions, isLoading: loadingChamps } = trpc.getChampions.useQuery();
  const { data: matrix, isLoading: loadingMatrix } = trpc.getCounterMatrix.useQuery();
  
  const setStaticData = useDraftStore((state) => state.setStaticData);
  const resetDraft = useDraftStore((state) => state.resetDraft);
  const isBan = useDraftStore((state) => state.isBan);
  const setActiveSlot = useDraftStore((state) => state.setActiveSlot);
  const activeSide = useDraftStore((state) => state.activeSide);
  const activeRole = useDraftStore((state) => state.activeRole);

  useEffect(() => {
    if (champions && matrix) {
      setStaticData(champions, matrix);
    }
  }, [champions, matrix, setStaticData]);

  if (loadingChamps || loadingMatrix) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-blue-400 font-bold tracking-widest uppercase text-xs">Loading Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-zinc-950 text-slate-200 p-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
            <Swords className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              WILD RIFT <span className="text-blue-400">DRAFT ASSISTANT</span>
            </h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Phase 4: Deterministic Scoring Engine Active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveSlot(activeSide, activeRole, !isBan)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${
              isBan 
                ? "bg-red-500/10 border-red-500/50 text-red-500 shadow-lg shadow-red-500/5" 
                : "bg-slate-900 border-white/5 text-slate-400 hover:text-white hover:border-white/20"
            }`}
          >
            <Ban className="w-4 h-4" />
            Ban Mode: {isBan ? "ON" : "OFF"}
          </button>

          <button 
            onClick={() => resetDraft()}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 border border-white/5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:border-white/20 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Draft
          </button>
        </div>
      </header>

      {/* Draft Layout */}
      <div className="grid grid-cols-12 gap-8 max-w-7xl mx-auto w-full">
        {/* Left Side: Ally Team */}
        <div className="col-span-12 lg:col-span-3">
          <AllyPanel />
        </div>

        {/* Center: Champion Pool & Analysis */}
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-8">
          <ChampionPool champions={champions || []} />
          <ScoreBreakdown />
        </div>

        {/* Right Side: Enemy Team */}
        <div className="col-span-12 lg:col-span-3">
          <EnemyPanel />
        </div>
      </div>
      
      {/* Footer Info */}
      <footer className="mt-12 text-center">
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">
          Data refined from WR-META • Powered by Antigravity Scoring
        </p>
      </footer>
    </main>
  );
}
