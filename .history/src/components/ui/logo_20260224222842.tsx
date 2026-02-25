"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const dashedRingRef = useRef<SVGCircleElement>(null);
  const triangleRef = useRef<SVGPathElement>(null);
  const coreRef = useRef<SVGPathElement>(null);
  const accentsRef = useRef<SVGGElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.5 });

    // Initial states
    gsap.set([ringRef.current, triangleRef.current, coreRef.current], {
      strokeDasharray: 400,
      strokeDashoffset: 400,
      opacity: 0,
    });
    gsap.set(accentsRef.current, { scale: 0, opacity: 0 });

    // Permanent rotation for dashed ring
    gsap.to(dashedRingRef.current, {
      rotation: 360,
      duration: 20,
      repeat: -1,
      ease: "none",
      transformOrigin: "center center"
    });

    tl.to([ringRef.current, triangleRef.current, coreRef.current], {
      opacity: 1,
      duration: 0.1,
    })
    // 1. Draw Outer Ring
    .to(ringRef.current, {
      strokeDashoffset: 0,
      duration: 1.2,
      ease: "power2.inOut",
    })
    // 2. Draw Triangle
    .to(triangleRef.current, {
      strokeDashoffset: 0,
      duration: 1.0,
      ease: "power2.out",
    }, "-=0.4")
    // 3. Draw Core Diamond
    .to(coreRef.current, {
      strokeDashoffset: 0,
      duration: 0.8,
      ease: "back.out(1.7)",
    }, "-=0.2")
    // 4. Pop Accents
    .to(accentsRef.current, {
      scale: 1,
      opacity: 1,
      duration: 0.5,
      ease: "elastic.out(1, 0.5)",
      transformOrigin: "center center"
    }, "-=0.3")
    // 5. Bright Flash / Pulse
    .to(containerRef.current, {
      filter: "brightness(1.5) saturate(1.2)",
      duration: 0.3,
      yoyo: true,
      repeat: 1
    })
    // 6. Hold then Reset
    .to([ringRef.current, triangleRef.current, coreRef.current, accentsRef.current], {
      opacity: 0,
      duration: 1,
      ease: "power2.in",
      delay: 3
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className={cn("relative flex items-center justify-center", className)}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>

        {/* Rotating Dashed Perimeter */}
        <circle
          ref={dashedRingRef}
          cx="50"
          cy="50"
          r="46"
          className="stroke-blue-500/10"
          strokeWidth="1"
          strokeDasharray="4 8"
        />

        {/* Main Outer Ring */}
        <circle
          ref={ringRef}
          cx="50"
          cy="50"
          r="40"
          stroke="url(#logoGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Tactical Triangle */}
        <path
          ref={triangleRef}
          d="M50 22L78 68H22L50 22Z"
          className="stroke-blue-400"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Inner Core Diamond */}
        <path
          ref={coreRef}
          d="M50 40L62 50L50 60L38 50L50 40Z"
          className="stroke-white/80"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Corner Micro-accents */}
        <g ref={accentsRef} className="stroke-blue-400/40" strokeWidth="1" strokeLinecap="round">
          <path d="M50 10V18" />
          <path d="M50 82V90" />
          <path d="M10 50H18" />
          <path d="M82 50H90" />
        </g>
      </svg>
      
      {/* Dynamic Glow Layer */}
      <div className="absolute inset-0 bg-blue-600/10 blur-[24px] rounded-full -z-10 animate-pulse" />
    </div>
  );
}
