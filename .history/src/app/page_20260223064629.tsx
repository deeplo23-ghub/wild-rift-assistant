"use client";

import { useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { useDraftStore } from "@/store/draftStore";
import { AllyPanel } from "@/components/draft/AllyPanel";
import { EnemyPanel } from "@/components/draft/EnemyPanel";
import { ChampionPool } from "@/components/draft/ChampionPool";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw, Cpu, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DraftPage() {
  const { data: champions, isLoading: loadingChamps } = trpc.getChampions.useQuery();
  const { data: matrix, isLoading: loadingMatrix } = trpc.getCounterMatrix.useQuery();
  
  const setStaticData = useDraftStore((state) => state.setStaticData);
  const resetDraft = useDraftStore((state) => state.resetDraft);
  const { banModeActive, toggleBanMode } = useDraftStore();

  useEffect(() => {
    if (champions && matrix) {
      setStaticData(champions, matrix);
    }
  }, [champions, matrix, setStaticData]);

  if (loadingChamps || loadingMatrix) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Initializing Strategic Engine</p>
        </div>
      </div>
    );
  }

  if (!champions || !matrix) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-900 text-red-500">
        <p className="text-sm font-bold uppercase tracking-widest">Protocol Failure: Data Link Broken</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-zinc-100 selection:bg-blue-500/30 overflow-hidden font-sans">
      {/* Information Header */}
      <header className="h-14 border-b border-gray-700/30 bg-gray-800/20 flex items-center justify-between px-6 shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-md bg-blue-600/10 border border-blue-500/20 shadow-sm">
              <Cpu className="w-4 h-4 text-blue-500" />
            </div>
            <h1 className="text-lg font-semibold tracking-wide text-zinc-300">
              WildRift <span className="text-blue-500">Draft.AI</span>
            </h1>
          </div>
          <div className="h-4 w-[1px] bg-gray-700/50" />
          <span className="text-xs font-medium text-zinc-500 tracking-wide uppercase">Tactical Oversight Bureau</span>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant={banModeActive ? "destructive" : "outline"}
            size="sm"
            onClick={toggleBanMode}
            className={cn(
              "h-9 text-xs font-semibold uppercase tracking-wide gap-2 px-4 transition-all rounded-md shadow-sm",
              banModeActive 
                ? "bg-red-600 hover:bg-red-700 text-white border-transparent" 
                : "bg-gray-800/40 border-gray-700/50 text-zinc-400 hover:text-white"
            )}
          >
            <ShieldAlert className="w-4 h-4" />
            {banModeActive ? "Ban Mode ACTIVE" : "Toggle Ban Phase"}
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetDraft}
            className="h-9 text-xs text-zinc-500 hover:bg-gray-800/60 font-semibold uppercase gap-2 px-3 rounded-md"
          >
            <RotateCcw className="w-4 h-4" />
            Reset State
          </Button>
        </div>
      </header>

      {/* Main Responsive Grid */}
      <main className="flex-1 overflow-hidden p-4 gap-4 grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[320px_1fr_320px] 2xl:grid-cols-[360px_1fr_360px]">
        {/* Left Aspect: Ally Team */}
        <section className="hidden lg:flex flex-col min-h-0 overflow-hidden">
          <AllyPanel />
        </section>

        {/* Center Aspect: Champion Intelligence */}
        <section className="flex flex-col min-w-0 min-h-0">
          <ChampionPool champions={champions} />
        </section>

        {/* Right Aspect: Enemy Team (Show on MD+) */}
        <section className="hidden md:flex flex-col min-h-0 overflow-hidden">
          <EnemyPanel />
        </section>
      </main>

      {/* Mobile/Tablet Fallback Footer */}
      <div className="lg:hidden h-12 bg-gray-800/40 border-t border-gray-700/30 flex items-center justify-around px-4 backdrop-blur-md">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Standard UI Optimizing for Desktop Deployment</span>
      </div>
    </div>
  );
}
