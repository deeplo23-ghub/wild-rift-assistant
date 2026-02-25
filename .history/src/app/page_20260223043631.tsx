"use client";

import { useDraftStore } from "@/store/draftStore";
import ChampionPool from "@/components/draft/ChampionPool";
import TeamPanel from "@/components/draft/TeamPanel";
import { TeamSide, DraftPhase } from "@/types/draft";
import { Swords } from "lucide-react";

export default function DraftPage() {
  const phase = useDraftStore((state) => state.phase);
  const setPhase = useDraftStore((state) => state.setPhase);

  return (
    <main className="flex h-screen w-screen flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-900 bg-zinc-950/80 px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20">
            <Swords className="h-4 w-4" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">Wild Rift Draft Assistant</h1>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="text-zinc-400 font-medium">Phase:</span>
          <div className="flex rounded-md bg-zinc-900 ring-1 ring-zinc-800 p-1">
            <button
              onClick={() => setPhase(DraftPhase.Ban)}
              className={`rounded-sm px-3 py-1 font-medium transition-colors ${
                phase === DraftPhase.Ban
                  ? "bg-red-500/10 text-red-500"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              BAN
            </button>
            <button
              onClick={() => setPhase(DraftPhase.Pick)}
              className={`rounded-sm px-3 py-1 font-medium transition-colors ${
                phase === DraftPhase.Pick
                  ? "bg-blue-500/10 text-blue-500"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              PICK
            </button>
          </div>
        </div>
      </header>

      {/* Draft Grid Area */}
      <section className="flex flex-1 overflow-hidden p-6 gap-6 min-h-0 bg-zinc-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.05),rgba(255,255,255,0))]">
        {/* Left Column: Ally Team */}
        <div className="w-[320px] shrink-0 flex flex-col h-full gap-4 relative">
          <TeamPanel side={TeamSide.Ally} title="Ally Team" />
        </div>

        {/* Center Column: Champion Pool */}
        <div className="flex-1 flex flex-col h-full min-w-0">
          <ChampionPool />
        </div>

        {/* Right Column: Enemy Team */}
        <div className="w-[320px] shrink-0 flex flex-col h-full gap-4 relative">
          <TeamPanel side={TeamSide.Enemy} title="Enemy Team" />
        </div>
      </section>
    </main>
  );
}
