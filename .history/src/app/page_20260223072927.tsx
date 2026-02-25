"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useDraftStore } from "@/store/draftStore";
import { AllyPanel } from "@/components/draft/AllyPanel";
import { EnemyPanel } from "@/components/draft/EnemyPanel";
import { ChampionPool } from "@/components/draft/ChampionPool";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw, Info, Settings2, BarChart3 } from "lucide-react";

export default function DraftPage() {
  const { data: champions, isLoading: loadingChamps, error: errorChamps } = trpc.getChampions.useQuery();
  const { data: matrix, isLoading: loadingMatrix, error: errorMatrix } = trpc.getCounterMatrix.useQuery();
  
  const setStaticData = useDraftStore((state) => state.setStaticData);
  const resetDraft = useDraftStore((state) => state.resetDraft);

  useEffect(() => {
    if (champions && matrix) {
      setStaticData(champions, matrix);
    }
  }, [champions, matrix, setStaticData]);

  if (loadingChamps || loadingMatrix) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-white font-sans">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center animate-pulse">
             <BarChart3 className="h-8 w-8 text-blue-500" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 ml-1">Calibrating Engine...</p>
        </div>
      </div>
    );
  }

  if (errorChamps || errorMatrix || !champions || !matrix) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-red-500 font-sans p-10 text-center">
        <div className="max-w-md space-y-4">
            <h2 className="text-xl font-black uppercase tracking-tight">System Link Failure</h2>
            <p className="text-sm text-zinc-500 leading-relaxed font-bold">Could not establish connection to the data layer. Ensure the local SQLite database is populated and the tRPC server is active.</p>
            <Button variant="outline" onClick={() => window.location.reload()} className="border-red-500/20 text-red-500 hover:bg-red-500/10">Retry Connection</Button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-300 font-sans selection:bg-blue-500/30 overflow-hidden flex flex-col">
      {/* Dense Mini Header */}
      <header className="h-12 border-b border-white/5 flex items-center justify-between px-6 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-blue-600 rounded-sm rotate-45" />
            <h1 className="text-xs font-black uppercase tracking-widest text-white">
              Draft <span className="text-blue-500">Intelligence</span> v1.4
            </h1>
          </div>
          <div className="h-4 w-px bg-white/5 mx-2" />
          <div className="flex items-center gap-4 text-[9px] font-black uppercase text-zinc-500 italic">
            <span>Deterministic Engine Active</span>
            <span className="text-green-500 flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                Linked
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
            <Button 
                variant="ghost" 
                size="icon"
                className="w-8 h-8 text-zinc-500 hover:text-white"
            >
                <Settings2 className="w-4 h-4" />
            </Button>
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetDraft}
                className="h-7 text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:bg-zinc-800 hover:text-white px-3 gap-2"
            >
                <RotateCcw className="w-3 h-3" />
                Flush State
            </Button>
        </div>
      </header>

      {/* Main 3-Column Studio Layout */}
      <div className="flex-1 overflow-hidden p-6 grid grid-cols-[340px_1fr_340px] gap-6 max-w-[1920px] mx-auto w-full">
        {/* Left Col: Ally Intelligence */}
        <aside className="min-h-0 flex flex-col h-full">
            <AllyPanel />
        </aside>

        {/* Center Col: Core Decision Pool */}
        <section className="min-h-0 h-full flex flex-col">
            <ChampionPool champions={champions} />
        </section>

        {/* Right Col: Enemy Intelligence */}
        <aside className="min-h-0 flex flex-col h-full">
            <EnemyPanel />
        </aside>
      </div>

      {/* Micro Status Bar */}
      <footer className="h-6 border-t border-white/5 bg-black/40 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[8px] font-black text-zinc-600 uppercase tracking-widest">
              <span>Next.js 16 + trpc</span>
              <span>PostgreSQL / SQLite Native Link</span>
          </div>
          <div className="flex items-center gap-2 text-[8px] font-black text-zinc-600 uppercase flex-row-reverse">
              <span>Developed for Competitive Analysis</span>
              <Info className="w-2.5 h-2.5" />
          </div>
      </footer>
    </main>
  );
}
