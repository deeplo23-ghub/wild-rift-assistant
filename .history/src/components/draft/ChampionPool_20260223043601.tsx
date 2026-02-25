"use client";

import { useDraftStore } from "@/store/draftStore";
import { trpc } from "@/lib/trpc/client";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Champion } from "@/types/champion";

export default function ChampionPool() {
  const { data: champions, isLoading, error } = trpc.champion.getAll.useQuery();
  const [search, setSearch] = useState("");

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 border rounded-lg border-zinc-800 bg-zinc-900/50">
        <span className="text-zinc-500 animate-pulse">Loading pool...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 border border-red-900/50 bg-red-950/20 rounded-lg text-red-500">
        Error loading champions: {error.message}
      </div>
    );
  }

  const filtered = (champions || []).filter((c: Champion) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col flex-1 h-full gap-4 p-4 border rounded-lg border-zinc-800 bg-zinc-900/30">
      <div className="flex flex-col gap-2 shrink-0">
        <h2 className="text-lg font-bold tracking-tight text-zinc-100">Champion Pool</h2>
        <Input
          placeholder="Search champions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-zinc-950/50 border-zinc-800"
        />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 min-w-0 pr-2 pb-4">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 content-start">
          {filtered.map((champ: Champion) => (
            <div
              key={champ.id}
              className="flex flex-col items-center gap-2 p-2 rounded-md border border-zinc-800 bg-zinc-950/50 hover:bg-zinc-800 transition-colors cursor-pointer group"
            >
              <div className="w-12 h-12 rounded overflow-hidden bg-zinc-800 relative ring-1 ring-zinc-700 group-hover:ring-blue-500 transition-all">
                {champ.iconUrl ? (
                  <img
                    src={champ.iconUrl}
                    alt={champ.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-zinc-600">
                    ?
                  </div>
                )}
              </div>
              <span className="text-xs font-medium text-zinc-300 truncate w-full text-center">
                {champ.name}
              </span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-8 text-center text-sm text-zinc-500">
              No champions found matching "{search}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
