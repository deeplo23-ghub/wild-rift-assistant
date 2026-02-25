"use client";

import { useDraftStore } from "@/store/draftStore";
import { TeamSide, ALL_ROLES } from "@/types/draft";
import { Role } from "@/types/champion";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";

interface TeamPanelProps {
  side: TeamSide;
  title: string;
}

export default function TeamPanel({ side, title }: TeamPanelProps) {
  const teamState = useDraftStore((state) => state[side]);
  const removePick = useDraftStore((state) => state.removePick);
  
  // We'll load the full champion list to map IDs to visuals quickly
  const { data: champions } = trpc.champion.getAll.useQuery();

  const getChamp = (id: string | null) => {
    if (!id || !champions) return null;
    return champions.find((c: any) => c.id === id);
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full border rounded-lg border-zinc-800 bg-zinc-900/30 p-4">
      <h2 className="text-lg font-bold tracking-tight text-zinc-100">{title}</h2>
      
      <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-2">
        {ALL_ROLES.map((role) => {
          const slot = teamState[role];
          const champ = getChamp(slot.championId);

          return (
            <div
              key={role}
              className="flex items-center gap-4 p-3 rounded-lg border border-zinc-800 bg-zinc-950/50 group hover:border-zinc-700 transition-colors"
            >
              <div className="w-12 h-12 rounded bg-zinc-900 overflow-hidden ring-1 ring-zinc-800 shrink-0">
                {champ ? (
                  <img
                    src={champ.iconUrl}
                    alt={champ.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[10px] text-zinc-600 font-semibold uppercase">
                    {role.slice(0, 3)}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <span className="text-sm font-semibold text-zinc-200 truncate leading-none">
                  {champ ? champ.name : "Selecting..."}
                </span>
                <span className="text-xs text-zinc-500 capitalize leading-none">
                  {role}
                </span>
              </div>

              {champ && (
                <button
                  onClick={() => removePick(side, role)}
                  className="p-1 px-2 text-xs font-semibold rounded text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-400/10 transition-all shrink-0"
                  aria-label="Remove pick"
                >
                  X
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
