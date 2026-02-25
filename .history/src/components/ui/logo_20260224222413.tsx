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
  const circleRef = useRef<SVGCircleElement>(null);
  const triangleRef = useRef<SVGPathElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });

    // Initial state: hide strokes
    gsap.set([circleRef.current, triangleRef.current], {
      strokeDasharray: 300,
      strokeDashoffset: 300,
      opacity: 0,
    });

    tl.to([circleRef.current, triangleRef.current], {
      opacity: 1,
      duration: 0.1,
    })
    .to(circleRef.current, {
      strokeDashoffset: 0,
      duration: 1.5,
      ease: "power2.inOut",
    })
    .to(triangleRef.current, {
      strokeDashoffset: 0,
      duration: 1.2,
      ease: "power2.out",
    }, "-=0.5")
    .to([circleRef.current, triangleRef.current], {
      opacity: 0,
      duration: 0.8,
      ease: "power2.in",
      delay: 2
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className={cn("relative flex items-center justify-center", className)}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Circle Path */}
        <circle
          ref={circleRef}
          cx="50"
          cy="50"
          r="40"
          className="stroke-blue-500"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Triangle Path */}
        <path
          ref={triangleRef}
          d="M50 25L75 65H25L50 25Z"
          className="stroke-blue-400"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      
      {/* Subtle Glow */}
      <div className="absolute inset-0 bg-blue-500/5 blur-xl rounded-full -z-10" />
    </div>
  );
}
