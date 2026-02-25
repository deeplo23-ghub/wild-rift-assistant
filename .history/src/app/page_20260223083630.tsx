import { DraftHeader } from "@/components/draft/DraftHeader";
import { AllyPanel } from "@/components/draft/AllyPanel";
import { EnemyPanel } from "@/components/draft/EnemyPanel";
import { ChampionPool } from "@/components/draft/ChampionPool";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw, Info, Settings2, BarChart3, Database } from "lucide-react";

export default function DraftPage() {
  const { data: champions, isLoading: loadingChamps, error: errorChamps } = trpc.getChampions.useQuery();
  const { data: matrix, isLoading: loadingMatrix, error: errorMatrix } = trpc.getCounterMatrix.useQuery();
  
  const setStaticData = useDraftStore((state) => state.setStaticData);

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
             <Database className="h-8 w-8 text-blue-500" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-600">Syncing Engine Data...</p>
        </div>
      </div>
    );
  }

  if (errorChamps || errorMatrix || !champions || !matrix) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-red-500 font-sans p-10 text-center">
        <div className="max-w-md space-y-4">
            <h2 className="text-xl font-bold tracking-tight">System Link Failure</h2>
            <p className="text-sm text-zinc-500 leading-relaxed font-bold">Could not establish connection to the data layer. Ensure the local system is active.</p>
            <Button variant="outline" onClick={() => window.location.reload()} className="border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-xl">Retry Connection</Button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-300 font-sans selection:bg-blue-500/30 overflow-hidden flex flex-col">
      <DraftHeader />

      {/* Main 3-Column Studio Layout */}
      <div className="flex-1 overflow-hidden p-8 grid grid-cols-[360px_1fr_360px] gap-8 max-w-[2000px] mx-auto w-full">
        {/* Left Column: Ally Team */}
        <aside className="min-h-0 flex flex-col h-full overflow-hidden">
            <AllyPanel />
        </aside>

        {/* Center Column: Champion Pool */}
        <section className="min-h-0 h-full flex flex-col overflow-hidden">
            <ChampionPool champions={champions} />
        </section>

        {/* Right Column: Enemy Team */}
        <aside className="min-h-0 flex flex-col h-full overflow-hidden">
            <EnemyPanel />
        </aside>
      </div>

      {/* Status Bar */}
      <footer className="h-8 border-t border-white/5 bg-black/40 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
              <span>Next.js Engine</span>
              <span>Deterministic Matrix Active</span>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-600 flex-row-reverse tracking-widest uppercase">
              <span>Competitive Grade Analysis</span>
              <Info className="w-3 h-3" />
          </div>
      </footer>
    </main>
  );
}
