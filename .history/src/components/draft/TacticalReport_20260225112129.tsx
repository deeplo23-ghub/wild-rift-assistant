"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface Insight {
  type: "strength" | "risk" | "win";
  text: string;
}

interface TacticalReportProps {
  insights: Insight[];
  emptyText?: string;
  className?: string;
}

export function TacticalReport({ insights, emptyText, className }: TacticalReportProps) {
  if (insights.length === 0) {
    return (
      <div className={cn("text-[10px] text-zinc-600 italic px-2", className)}>
        {emptyText || "Calculations in progress..."}
      </div>
    );
  }

  return (
    <ul className={cn("flex flex-col gap-2.5", className)}>
      {insights.map((insight, i) => {
        const configMap = {
          win: { dot: "bg-cyan-500", marker: "border-cyan-500/30" },
          risk: { dot: "bg-red-500", marker: "border-red-500/30" },
          strength: { dot: "bg-emerald-500", marker: "border-emerald-500/20" },
        };
        const config = configMap[insight.type];

        return (
          <li key={i} className="flex gap-3 group">
            <div className={cn("mt-1.5 w-1 h-1 rounded-full shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.5)]", config.dot)} />
            <div className={cn("flex flex-col border-l pl-3", config.marker)}>
              <span className="text-[10px] text-zinc-300 leading-relaxed font-medium">
                {insight.text}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
