"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Rotating Ring */}
        <circle
          cx="50"
          cy="50"
          r="45"
          className="stroke-blue-500/20"
          strokeWidth="1"
          strokeDasharray="10 20"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 50 50"
            to="360 50 50"
            dur="10s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Inner Pulsing Core */}
        <path
          d="M50 20L75 45L50 80L25 45L50 20Z"
          className="fill-blue-600/40 stroke-blue-400"
          strokeWidth="2"
          strokeLinejoin="round"
        >
          <animate
            attributeName="fill-opacity"
            values="0.2;0.6;0.2"
            dur="3s"
            repeatCount="indefinite"
          />
        </path>

        {/* Shimmer Effect */}
        <path
          d="M50 22L73 45L50 78L27 45L50 22Z"
          className="stroke-white/30"
          strokeWidth="0.5"
          fill="url(#shimmerGradient)"
        >
          <animate
            attributeName="stroke-opacity"
            values="0;0.8;0"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </path>

        {/* Corner Accents */}
        <g className="stroke-blue-400" strokeWidth="2" strokeLinecap="round">
          <path d="M45 15L55 15">
             <animate attributeName="d" values="M45 15L55 15;M42 12L58 12;M45 15L55 15" dur="4s" repeatCount="indefinite" />
          </path>
          <path d="M45 85L55 85">
             <animate attributeName="d" values="M45 85L55 85;M42 88L58 88;M45 85L55 85" dur="4s" repeatCount="indefinite" />
          </path>
        </g>

        <defs>
          <linearGradient id="shimmerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="50%" stopColor="white" stopOpacity="0.5" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
            <animate
              attributeName="x1"
              values="-100%;100%"
              dur="2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="x2"
              values="0%;200%"
              dur="2s"
              repeatCount="indefinite"
            />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Absolute Glow Background */}
      <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full -z-10 animate-pulse" />
    </div>
  );
}
