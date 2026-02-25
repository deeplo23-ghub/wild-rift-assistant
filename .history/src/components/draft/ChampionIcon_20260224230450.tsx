"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface ChampionIconProps {
  name: string;
  url: string;
  className?: string;
  grayscale?: boolean;
}

export const ChampionIcon: React.FC<ChampionIconProps> = ({ 
  name, 
  url, 
  className,
  grayscale = false
}) => {
  const [error, setError] = useState(false);

  if (error) {
    // High-quality fallback: Styled initial or generic icon with premium look
    return (
      <div className={cn(
        "flex items-center justify-center bg-zinc-800 border border-white/10 text-white font-black overflow-hidden",
        className
      )}>
        <span className="text-xs uppercase tracking-tighter opacity-50">
          {name.slice(0, 2)}
        </span>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={name}
      onError={() => setError(true)}
      className={cn(
        "object-cover transition-all duration-300",
        grayscale && "grayscale",
        !grayscale && "group-hover:scale-110",
        className
      )}
    />
  );
};
