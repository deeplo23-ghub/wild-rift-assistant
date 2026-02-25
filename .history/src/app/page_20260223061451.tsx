"use client";

import { useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { useDraftStore } from "@/store/draftStore";
import { AllyPanel } from "@/components/draft/AllyPanel";
import { EnemyPanel } from "@/components/draft/EnemyPanel";
import { ChampionPool } from "@/components/draft/ChampionPool";
import { BanPhase } from "@/components/draft/BanPhase";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw } from "lucide-react";
import { AnimatePresence } from "framer-motion";

export default function DraftPage() {
  const { data: champions, isLoading: loadingChamps } = trpc.getChampions.useQuery();
  const { data: matrix, isLoading: loadingMatrix } = trpc.getCounterMatrix.useQuery();
  
  const setStaticData = useDraftStore((state) => state.setStaticData);
  const resetDraft = useDraftStore((state) => state.resetDraft);

  useEffect(() => {
    if (champions && matrix) {
      setStaticData(champions, matrix);
    }
  }, [champions, matrix, setStaticData]);

  if (loadingChamps || loadingMatrix) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">Initializing Draft Engine...</p>
        </div>
      </div>
    );
  }

  if (!champions || !matrix) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-red-500">
        <p>Failed to load draft data. Check backend connection.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-slate-200 selection:bg-blue-500/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-[1800px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20" />
            <h1 className="text-lg font-black uppercase tracking-tighter text-white">
              Wild <span className="text-blue-500">Rift</span> Assistant
            </h1>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetDraft}
            className="text-zinc-500 hover:text-white hover:bg-white/5 gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Session
          </Button>
        </div>
      </header>

      {/* 3-Column Layout */}
      <div className="mx-auto grid max-w-[1800px] grid-cols-1 gap-6 px-6 pt-24 pb-6 md:grid-cols-[380px_1fr_380px]">
        {/* Left: Ally Panel */}
        <aside className="space-y-6">
          <AllyPanel />
        </aside>

        {/* Center: Champion Pool */}
        <section className="min-w-0 h-[calc(100vh-120px)]">
          <ChampionPool champions={champions} />
        </section>

        {/* Right: Enemy Panel */}
        <aside className="space-y-6">
          <EnemyPanel />
        </aside>
      </div>
    </main>
  );
}
