"use client";

import React from "react";
import { useDraftStore } from "@/store/draftStore";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { 
  RotateCcw, 
  Settings as SettingsIcon, 
  Ban, 
  Search,
  LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";

export const DraftHeader: React.FC = () => {
  const store = useDraftStore();

  return (
    <header className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-zinc-950/50 backdrop-blur-md">
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
          <h1 className="text-3xl font-black text-white tracking-tighter leading-none italic">
            Wild Rift <span className="text-blue-500">Draft</span>
          </h1>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
            Studio Professional Assistant
          </span>
        </div>

        <div className="h-10 w-px bg-white/5" />

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-zinc-900 px-4 py-2.5 rounded-xl border border-white/5">
             <Ban className={cn("w-4 h-4 transition-colors", store.isBanMode ? "text-red-500" : "text-zinc-600")} />
             <span className="text-xs font-bold text-zinc-400 capitalize whitespace-nowrap">Ban Phase</span>
             <Switch 
               checked={store.isBanMode} 
               onCheckedChange={(v) => store.toggleBanMode(v)}
               className="data-[state=checked]:bg-red-500"
             />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => store.resetDraft()}
          className="bg-zinc-900 border-white/5 hover:bg-white/5 text-zinc-300 font-bold rounded-xl"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-2" />
          Reset Draft
        </Button>

        <Button 
          variant="outline" 
          size="icon" 
          className="bg-zinc-900 border-white/5 hover:bg-white/5 text-zinc-500 rounded-xl"
        >
          <SettingsIcon className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};
