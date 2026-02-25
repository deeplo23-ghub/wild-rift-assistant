"use client";

import React from "react";
import { useDraftStore } from "@/store/draftStore";
import { Sparkles, Info, Shield, Sword, Zap, Brain, Activity, HelpCircle } from "lucide-react";

export const ScoreBreakdown: React.FC = () => {
  const inspectingId = useDraftStore((state) => state.inspectingChampionId);
  const scoredChampions = useDraftStore((state) => state.scoredChampions);
  const allChampions = useDraftStore((state) => state.allChampions);

  const champion = allChampions.find((c) => c.id === inspectingId);
  const scoreData = scoredChampions.find((s) => s.championId === inspectingId);
  
  const pickChampion = useDraftStore((state) => state.pickChampion);
  const addBan = useDraftStore((state) => state.addBan);
  const activeSide = useDraftStore((state) => state.activeSide);
  const activeRole = useDraftStore((state) => state.activeRole);
  const isBan = useDraftStore((state) => state.isBan);
  const setInspecting = useDraftStore((state) => state.setInspecting);

  if (!champion || !scoreData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-900/30 backdrop-blur-md rounded-3xl border border-dashed border-white/10 text-slate-500 min-h-[400px]">
        <Info className="w-8 h-8 mb-4 opacity-20" />
        <p className="text-sm font-medium italic opacity-40">Select a champion to view detailed analysis</p>
      </div>
    );
  }

  const components = [
    { label: "Base Stats", value: scoreData.breakdown.base, icon: Activity, color: "text-blue-400" },
    { label: "Synergy", value: scoreData.breakdown.synergy, icon: Brain, color: "text-purple-400" },
    { label: "Counter", value: scoreData.breakdown.counter, icon: Sword, color: "text-red-400" },
    { label: "Composition", value: scoreData.breakdown.composition, icon: Shield, color: "text-emerald-400" },
    { label: "Threat", value: scoreData.breakdown.threat, icon: Zap, color: "text-amber-400" },
    { label: "Flexibility", value: scoreData.breakdown.flexibility, icon: HelpCircle, color: "text-cyan-400" },
  ];

  const handleConfirm = () => {
    if (isBan) {
      addBan(activeSide, champion.id);
    } else if (activeRole) {
      pickChampion(activeSide, activeRole, champion.id);
    }
    setInspecting(null);
  };

  return (
    <div className="flex flex-col gap-6 p-8 bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden relative group">
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[100px] rounded-full" />
      
      <div className="flex items-center gap-6 relative z-10">
        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-blue-500/30 shadow-lg shadow-blue-500/10 transition-transform group-hover:scale-105 duration-500">
          <img src={champion.iconUrl} alt={champion.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-black text-white tracking-tight leading-none">{champion.name}</h2>
            <span className="px-2 py-0.5 rounded-lg bg-blue-500/20 border border-blue-500/30 text-[10px] font-black text-blue-400 uppercase tracking-widest">
              {champion.tier} Tier
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-3xl font-black text-blue-400 leading-none">{Math.round(scoreData.finalScore)}</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 ml-1">Draft Priority</span>
          </div>
        </div>
        
        <button 
          onClick={handleConfirm}
          className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-xl ${
            isBan 
              ? "bg-red-500 hover:bg-red-400 text-white shadow-red-500/20" 
              : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
          }`}
        >
          {isBan ? "Ban Champion" : `Lock for ${activeRole}`}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {components.map((comp) => (
          <div key={comp.label} className="flex flex-col gap-2 p-4 bg-slate-800/40 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between">
              <comp.icon className={`w-4 h-4 ${comp.color}`} />
              <span className={`text-lg font-black ${comp.color}`}>{Math.round(comp.value)}</span>
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{comp.label}</span>
            <div className="w-full h-1 bg-slate-700/50 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-current ${comp.color} transition-all duration-1000`} 
                style={{ width: `${comp.value}%` }} 
              />
            </div>
          </div>
        ))}
        <div className="flex flex-col gap-2 p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
          <div className="flex items-center justify-between">
            <Activity className="w-4 h-4 text-red-400" />
            <span className="text-lg font-black text-red-400">-{Math.round(scoreData.breakdown.risk)}</span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Risk Penalty</span>
          <div className="w-full h-1 bg-slate-700/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-400 transition-all duration-1000" 
              style={{ width: `${scoreData.breakdown.risk}%` }} 
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Strategic Insights</h3>
        <div className="flex flex-col gap-2">
          {scoreData.explanations.map((exp, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-slate-800/20 rounded-xl border border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 mt-1.5 shrink-0" />
                <p className="text-sm text-slate-400 leading-relaxed italic">{exp}</p>
              </div>
          ))}
        </div>
      </div>
    </div>
  );
};
