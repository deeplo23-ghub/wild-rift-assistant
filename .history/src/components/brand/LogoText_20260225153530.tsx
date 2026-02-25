
import React from 'react';

export const LogoText: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-baseline gap-2 cursor-default select-none">
        <span className="text-2xl md:text-3xl font-bold text-white tracking-tighter">
          DRAFT
        </span>
        <span className="text-2xl md:text-3xl font-light text-slate-400 tracking-tighter">
          PICK
        </span>
        <span className="text-2xl md:text-3xl font-bold tracking-tighter bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
          ASSISTANT
        </span>
      </div>
      <div className="flex items-center gap-4 mt-[-4px]">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-sky-400/30 to-indigo-400/30" />
        <span className="text-[10px] font-medium text-slate-500 tracking-[0.3em] uppercase whitespace-nowrap">
          Strategic Combat Intelligence
        </span>
      </div>
    </div>
  );
};
