import { AllyPanel } from "@/components/draft/AllyPanel";
import { EnemyPanel } from "@/components/draft/EnemyPanel";
import { ChampionPool } from "@/components/draft/ChampionPool";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw, Cpu, ShieldAlert } from "lucide-react";

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
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Initializing Engine</p>
        </div>
      </div>
    );
  }

  if (!champions || !matrix) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-red-500">
        <p className="text-xs font-bold uppercase tracking-widest">Fatal Error: Data unreachable</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 selection:bg-blue-500/30 overflow-hidden">
      {/* Information Header */}
      <header className="h-11 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-blue-600/10 border border-blue-500/20">
              <Cpu className="w-3 h-3 text-blue-500" />
            </div>
            <h1 className="text-[11px] font-black uppercase tracking-widest text-zinc-300">
              WildRift <span className="text-blue-500">Draft.AI</span>
            </h1>
          </div>
          <div className="h-3 w-[1px] bg-zinc-800" />
          <span className="text-[9px] font-medium text-zinc-600 tracking-tighter uppercase">Analytical Oversight v1.2</span>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetDraft}
            className="h-7 text-[9px] text-zinc-500 hover:bg-zinc-900 font-black uppercase gap-1.5 px-2"
          >
            <RotateCcw className="w-3 h-3" />
            Clear Session
          </Button>
        </div>
      </header>

      {/* Main Responsive Grid */}
      <main className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr_280px] xl:grid-cols-[320px_1fr_320px] 2xl:grid-cols-[360px_1fr_360px]">
        {/* Left Aspect: Ally Team */}
        <section className="hidden lg:flex flex-col border-r border-zinc-900 p-2 overflow-hidden">
          <AllyPanel />
        </section>

        {/* Center Aspect: Champion Intelligence */}
        <section className="flex flex-col min-w-0 min-h-0 bg-zinc-950">
          <ChampionPool champions={champions} />
        </section>

        {/* Right Aspect: Enemy Team (Show on MD+) */}
        <section className="hidden md:flex flex-col border-l border-zinc-900 p-2 overflow-hidden">
          <EnemyPanel />
        </section>
      </main>

      {/* Mobile/Tablet Fallback Footer (Simplified stats) */}
      <div className="lg:hidden h-12 bg-zinc-900 border-t border-zinc-800 flex items-center justify-around px-4">
          {/* We can add a drawer or sheet here for team panels on mobile later */}
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Team Panels Hidden on Small Screens</span>
      </div>

      <BanPhase champions={champions} />
    </div>
  );
}
