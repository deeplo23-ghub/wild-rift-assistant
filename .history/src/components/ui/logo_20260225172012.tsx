"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  delay?: number;
  color?: "original" | "white";
  active?: boolean;
  loop?: boolean;
}

export function Logo({ className, delay = 0, color = "original", active: forceActive, loop = false }: LogoProps) {
  const [internalActive, setInternalActive] = useState(false);

  useEffect(() => {
    if (forceActive !== undefined) return;
    
    let timer: NodeJS.Timeout;
    let loopTimer: NodeJS.Timeout;

    timer = setTimeout(() => {
      setInternalActive(true);
      
      if (loop) {
        // Animation takes approx 3.1s (delay 2.76s + 0.5s duration)
        // Similar 10s cycle
        loopTimer = setInterval(() => {
          setInternalActive(false);
          setTimeout(() => setInternalActive(true), 3500); // Wait 3.5s to un-draw
        }, 10000); // 10s total cycle
      }
    }, (delay * 1000) + 100);

    return () => {
      clearTimeout(timer);
      if (loopTimer) clearInterval(loopTimer);
    };
  }, [delay, forceActive, loop]);

  const active = forceActive !== undefined ? forceActive : internalActive;

  const gold = color === "white" ? "rgb(255, 255, 255)" : "rgb(200, 155, 60)";
  const blue = color === "white" ? "rgb(255, 255, 255)" : "rgb(50, 200, 255)";
  const goldStroke = color === "white" ? "#FFFFFF" : "#C89B3C";
  const blueStroke = color === "white" ? "#FFFFFF" : "#32C8FF";

  return (
    <div className={cn("relative flex items-center justify-center overflow-visible", className)}>
      <style dangerouslySetInnerHTML={{ __html: `
        .logo-svg .svg-elem-1 {
          stroke-dashoffset: 405.6766357421875px;
          stroke-dasharray: 405.6766357421875px;
          fill: transparent;
          transition: stroke-dashoffset 0.8s cubic-bezier(0.47, 0, 0.745, 0.715) 0s,
                      fill 0.5s cubic-bezier(0.47, 0, 0.745, 0.715) 0.8s;
        }

        .logo-svg.active .svg-elem-1 {
          stroke-dashoffset: 0;
          fill: ${gold};
        }

        .logo-svg .svg-elem-2 {
          stroke-dashoffset: 151.45208740234375px;
          stroke-dasharray: 151.45208740234375px;
          fill: transparent;
          transition: stroke-dashoffset 0.8s cubic-bezier(0.47, 0, 0.745, 0.715) 0.12s,
                      fill 0.5s cubic-bezier(0.47, 0, 0.745, 0.715) 0.9s;
        }

        .logo-svg.active .svg-elem-2 {
          stroke-dashoffset: 0;
          fill: ${gold};
        }

        .logo-svg .svg-elem-3 {
          stroke-dashoffset: 199.83859252929688px;
          stroke-dasharray: 199.83859252929688px;
          fill: transparent;
          transition: stroke-dashoffset 0.8s cubic-bezier(0.47, 0, 0.745, 0.715) 0.24s,
                      fill 0.5s cubic-bezier(0.47, 0, 0.745, 0.715) 1s;
        }

        .logo-svg.active .svg-elem-3 {
          stroke-dashoffset: 0;
          fill: ${gold};
        }

        .logo-svg .svg-elem-4 {
          stroke-dashoffset: 514.69775390625px;
          stroke-dasharray: 514.69775390625px;
          fill: transparent;
          transition: stroke-dashoffset 0.8s cubic-bezier(0.47, 0, 0.745, 0.715) 0.36s,
                      fill 0.5s cubic-bezier(0.47, 0, 0.745, 0.715) 1.1s;
        }

        .logo-svg.active .svg-elem-4 {
          stroke-dashoffset: 0;
          fill: ${gold};
        }

        .logo-svg .svg-elem-5 {
          stroke-dashoffset: 442.6000061035156px;
          stroke-dasharray: 442.6000061035156px;
          fill: transparent;
          transition: stroke-dashoffset 0.8s cubic-bezier(0.47, 0, 0.745, 0.715) 0.48s,
                      fill 0.5s cubic-bezier(0.47, 0, 0.745, 0.715) 1.2s;
        }

        .logo-svg.active .svg-elem-5 {
          stroke-dashoffset: 0;
          fill: ${gold};
        }

        .logo-svg .svg-elem-6 {
          stroke-dashoffset: 402.8298034667969px;
          stroke-dasharray: 402.8298034667969px;
          fill: transparent;
          transition: stroke-dashoffset 0.8s cubic-bezier(0.47, 0, 0.745, 0.715) 0.6s,
                      fill 0.5s cubic-bezier(0.47, 0, 0.745, 0.715) 1.3s;
        }

        .logo-svg.active .svg-elem-6 {
          stroke-dashoffset: 0;
          fill: ${gold};
        }

        .logo-svg .svg-elem-7 {
          stroke-dashoffset: 403.2298278808594px;
          stroke-dasharray: 403.2298278808594px;
          fill: transparent;
          transition: stroke-dashoffset 0.8s cubic-bezier(0.47, 0, 0.745, 0.715) 0.72s,
                      fill 0.5s cubic-bezier(0.47, 0, 0.745, 0.715) 1.4s;
        }

        .logo-svg.active .svg-elem-7 {
          stroke-dashoffset: 0;
          fill: ${gold};
        }

        .logo-svg .svg-elem-8 {
          stroke-dashoffset: 426.0904846191406px;
          stroke-dasharray: 426.0904846191406px;
          fill: transparent;
          transition: stroke-dashoffset 0.8s cubic-bezier(0.47, 0, 0.745, 0.715) 0.84s,
                      fill 0.5s cubic-bezier(0.47, 0, 0.745, 0.715) 1.5s;
        }

        .logo-svg.active .svg-elem-8 {
          stroke-dashoffset: 0;
          fill: ${gold};
        }

        .logo-svg .svg-elem-9 {
          stroke-dashoffset: 523.96728515625px;
          stroke-dasharray: 523.96728515625px;
          fill: transparent;
          transition: stroke-dashoffset 0.8s cubic-bezier(0.47, 0, 0.745, 0.715) 0.96s,
                      fill 0.5s cubic-bezier(0.47, 0, 0.745, 0.715) 1.6s;
        }

        .logo-svg.active .svg-elem-9 {
          stroke-dashoffset: 0;
          fill: ${gold};
        }

        .logo-svg .svg-elem-10 {
          stroke-dashoffset: 291.40985107421875px;
          stroke-dasharray: 291.40985107421875px;
          fill: transparent;
          transition: stroke-dashoffset 0.8s cubic-bezier(0.47, 0, 0.745, 0.715) 1.08s,
                      fill 0.5s cubic-bezier(0.47, 0, 0.745, 0.715) 1.7s;
        }

        .logo-svg.active .svg-elem-10 {
          stroke-dashoffset: 0;
          fill: ${gold};
        }

        .logo-svg .svg-elem-11 {
          stroke-dashoffset: 291.5867919921875px;
          stroke-dasharray: 291.5867919921875px;
          fill: transparent;
          transition: stroke-dashoffset 0.8s cubic-bezier(0.47, 0, 0.745, 0.715) 1.2s,
                      fill 0.5s cubic-bezier(0.47, 0, 0.745, 0.715) 1.8s;
        }

        .logo-svg.active .svg-elem-11 {
          stroke-dashoffset: 0;
          fill: ${gold};
        }

        .logo-svg .svg-elem-12 {
          stroke-dashoffset: 403.03350830078125px;
          stroke-dasharray: 403.03350830078125px;
          fill: transparent;
          transition: stroke-dashoffset 0.8s cubic-bezier(0.47, 0, 0.745, 0.715) 1.32s,
                      fill 0.5s cubic-bezier(0.47, 0, 0.745, 0.715) 1.9s;
        }

        .logo-svg.active .svg-elem-12 {
          stroke-dashoffset: 0;
          fill: ${gold};
        }

        .logo-svg .svg-elem-13 {
          stroke-dashoffset: 403.43341064453125px;
          stroke-dasharray: 403.43341064453125px;
          fill: transparent;
          transition: stroke-dashoffset 0.8s cubic-bezier(0.47, 0, 0.745, 0.715) 1.44s,
                      fill 0.5s cubic-bezier(0.47, 0, 0.745, 0.715) 2s;
        }

        .logo-svg.active .svg-elem-13 {
          stroke-dashoffset: 0;
          fill: ${gold};
        }

        .logo-svg .svg-elem-14 {
          stroke-dashoffset: 414.3417663574219px;
          stroke-dasharray: 414.3417663574219px;
          fill: transparent;
          transition: stroke-dashoffset 0.8s cubic-bezier(0.47, 0, 0.745, 0.715) 1.56s,
                      fill 0.5s cubic-bezier(0.47, 0, 0.745, 0.715) 2.1s;
        }

        .logo-svg.active .svg-elem-14 {
          stroke-dashoffset: 0;
          fill: ${gold};
        }

        .logo-svg .svg-elem-15 {
          stroke-dashoffset: 313.8477783203125px;
          stroke-dasharray: 313.8477783203125px;
          fill: transparent;
          transition: stroke-dashoffset 0.8s cubic-bezier(0.47, 0, 0.745, 0.715) 1.68s,
                      fill 0.5s cubic-bezier(0.47, 0, 0.745, 0.715) 2.2s;
        }

        .logo-svg.active .svg-elem-15 {
          stroke-dashoffset: 0;
          fill: ${gold};
        }

        .logo-svg .svg-elem-16 {
          stroke-dashoffset: 237.51876831054688px;
          stroke-dasharray: 237.51876831054688px;
          fill: transparent;
          transition: stroke-dashoffset 0.8s cubic-bezier(0.47, 0, 0.745, 0.715) 1.8s,
                      fill 0.5s cubic-bezier(0.47, 0, 0.745, 0.715) 2.3s;
        }

        .logo-svg.active .svg-elem-16 {
          stroke-dashoffset: 0;
          fill: ${gold};
        }

        .logo-svg .svg-elem-17 {
          stroke-dashoffset: 761.3834228515625px;
          stroke-dasharray: 761.3834228515625px;
          fill: transparent;
          transition: stroke-dashoffset 0.8s cubic-bezier(0.47, 0, 0.745, 0.715) 1.92s,
                      fill 0.5s cubic-bezier(0.47, 0, 0.745, 0.715) 2.4s;
        }

        .logo-svg.active .svg-elem-17 {
          stroke-dashoffset: 0;
          fill: ${blue};
        }

        .logo-svg .svg-elem-18 {
          stroke-dashoffset: 373.9516906738281px;
          stroke-dasharray: 373.9516906738281px;
          fill: transparent;
          transition: stroke-dashoffset 0.8s cubic-bezier(0.47, 0, 0.745, 0.715) 2.04s,
                      fill 0.5s cubic-bezier(0.47, 0, 0.745, 0.715) 2.5s;
        }

        .logo-svg.active .svg-elem-18 {
          stroke-dashoffset: 0;
          fill: ${blue};
        }

        .logo-svg .svg-elem-19 {
          stroke-dashoffset: 784.8159790039062px;
          stroke-dasharray: 784.8159790039062px;
          fill: transparent;
          transition: stroke-dashoffset 0.8s cubic-bezier(0.47, 0, 0.745, 0.715) 2.16s,
                      fill 0.5s cubic-bezier(0.47, 0, 0.745, 0.715) 2.6s;
        }

        .logo-svg.active .svg-elem-19 {
          stroke-dashoffset: 0;
          fill: ${blue};
        }

        .logo-svg .svg-elem-20 {
          stroke-dashoffset: 519.3404541015625px;
          stroke-dasharray: 519.3404541015625px;
          fill: transparent;
          transition: stroke-dashoffset 0.8s cubic-bezier(0.47, 0, 0.745, 0.715) 2.28s,
                      fill 0.5s cubic-bezier(0.47, 0, 0.745, 0.715) 2.7s;
        }

        .logo-svg.active .svg-elem-20 {
          stroke-dashoffset: 0;
          fill: ${blue};
        }

        .logo-svg .svg-elem-21 {
          stroke-dashoffset: 118.90483856201172px;
          stroke-dasharray: 118.90483856201172px;
          fill: transparent;
          transition: stroke-dashoffset 0.8s cubic-bezier(0.47, 0, 0.745, 0.715) 2.4s,
                      fill 0.5s cubic-bezier(0.47, 0, 0.745, 0.715) 2.8s;
        }

        .logo-svg.active .svg-elem-21 {
          stroke-dashoffset: 0;
          fill: ${blue};
        }

        .logo-svg .svg-elem-22 {
          stroke-dashoffset: 190.2958984375px;
          stroke-dasharray: 190.2958984375px;
          fill: transparent;
          transition: stroke-dashoffset 0.8s cubic-bezier(0.47, 0, 0.745, 0.715) 2.52s,
                      fill 0.5s cubic-bezier(0.47, 0, 0.745, 0.715) 2.9s;
        }

        .logo-svg.active .svg-elem-22 {
          stroke-dashoffset: 0;
          fill: ${blue};
        }

        .logo-svg .svg-elem-23 {
          stroke-dashoffset: 107.33175659179688px;
          stroke-dasharray: 107.33175659179688px;
          fill: transparent;
          transition: stroke-dashoffset 0.8s cubic-bezier(0.47, 0, 0.745, 0.715) 2.64s,
                      fill 0.5s cubic-bezier(0.47, 0, 0.745, 0.715) 3s;
        }

        .logo-svg.active .svg-elem-23 {
          stroke-dashoffset: 0;
          fill: ${blue};
        }

        .logo-svg .svg-elem-24 {
          stroke-dashoffset: 57.5146598815918px;
          stroke-dasharray: 57.5146598815918px;
          fill: transparent;
          transition: stroke-dashoffset 0.8s cubic-bezier(0.47, 0, 0.745, 0.715) 2.76s,
                      fill 0.5s cubic-bezier(0.47, 0, 0.745, 0.715) 3.1s;
        }

        .logo-svg.active .svg-elem-24 {
          stroke-dashoffset: 0;
          fill: ${blue};
        }
      ` }} />
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 540 360"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("logo-svg transition-all", active && "active")}
      >
        <g transform="translate(-126,-121)">
          <path className="svg-elem-1" stroke={goldStroke} strokeWidth="1" d="m620.6 280.2c-8.6-2.2-16.1-4-16.1-11.1 0-5.6 4.2-9 11-9s11.5 3.7 13.1 10.1l16.9-8.1c-4.4-11.3-15.4-18-29.5-18-18.1 0-30.8 11.1-30.8 26.9 0 19.4 14.1 23 26.5 26.2 8.7 2.2 16.2 4.2 16.2 11.5 0 6-4.8 9.9-12.3 9.9s-13.6-4.1-15.3-10.1l-16.9 8.1c4.7 11.1 16.7 17.9 31.4 17.9 19.7 0 32.4-11 32.4-28 0.2-19.6-14.7-23.3-26.6-26.3z" />
          <polygon className="svg-elem-2" stroke={goldStroke} strokeWidth="1" points="624.6 205.1 634.4 205.1 634.4 191.8 644.4 191.8 646.9 183.1 634.4 183.1 634.4 174.7 648.6 174.7 648.6 165.8 624.6 165.8" />
          <path className="svg-elem-3" stroke={goldStroke} strokeWidth="1" d="m599.9 206.3c11.3 0 20.6-9.2 20.6-20.4 0-11.3-9.2-20.4-20.6-20.4-11.3 0-20.6 9.2-20.6 20.4 0.1 11.2 9.3 20.4 20.6 20.4zm0-31.4c6.1 0 11 4.9 11 11 0 6-4.9 11-11 11s-11-4.9-11-11 5-11 11-11z" />
          <polygon className="svg-elem-4" stroke={goldStroke} strokeWidth="1" points="416.2 244.6 420.4 253.3 420.4 332 438.7 332 438.7 274.5 479.8 332 498.9 332 498.9 244.6 480.6 244.6 480.6 302.9 439.8 244.6" />
          <path className="svg-elem-5" stroke={goldStroke} strokeWidth="1" d="m554.5 248.2c-5.4-2.2-13.2-3.6-17.3-3.6h-29.8v87.4h29.7c6.1 0 11.9-1.1 17.3-3.3s10.2-5.3 14.3-9.2 7.3-8.5 9.6-13.8 3.5-11 3.5-17.2c0-6.1-1.2-11.9-3.5-17.2s-5.5-9.9-9.6-13.8c-4-3.9-8.7-7-14.2-9.3zm6 50.5c-1.3 3.2-3.2 5.9-5.5 8.2s-5 4.2-8.2 5.5c-3.2 1.4-6.6 2-10.2 2h-10.4v-52.1h10.5c3.6 0 7 0.7 10.2 2.1s5.9 3.2 8.2 5.5 4.1 5.1 5.5 8.3c1.3 3.2 2 6.6 2 10.2 0 3.7-0.7 7.1-2.1 10.3z" />
          <polygon className="svg-elem-6" stroke={goldStroke} strokeWidth="1" points="207.9 244.6 207.9 332 259.9 332 259.9 315.1 226.9 314.9 226.9 295.8 252.4 295.8 257 279.3 226.9 279.3 226.9 261.6 259.9 261.6 259.9 244.6" />
          <polygon className="svg-elem-7" stroke={goldStroke} strokeWidth="1" points="409 279.3 378.8 279.3 378.8 261.6 411.9 261.6 411.9 244.6 359.9 244.6 359.9 332 411.9 332 411.9 315.1 378.8 314.9 378.8 295.8 404.4 295.8" />
          <path className="svg-elem-8" stroke={goldStroke} strokeWidth="1" d="m451.7 222c3 3.2 6.7 5.6 11 7.3s9.3 2.6 14.8 2.6 10.5-0.8 14.8-2.5c4.4-1.7 8.1-4.1 11.1-7.2s5.4-6.9 7-11.4c1.7-4.5 2.5-9.5 2.5-14.9l0.3-54.3h-19.1l-0.3 53.2c0 5.9-1.4 10.5-4.2 13.9s-6.8 5.1-12.1 5c-5.3 0-9.3-1.7-12-5.2-2.7-3.4-4.1-8.1-4.1-14l0.3-53.1h-19.1l-0.3 54c0 5.5 0.8 10.5 2.4 15 1.7 4.6 4 8.4 7 11.6z" />
          <path className="svg-elem-9" stroke={goldStroke} strokeWidth="1" d="m359.9 218.1c4.1 4.1 8.9 7.4 14.4 9.8 5.6 2.4 11.5 3.6 18 3.6 6.3 0 12.1-1 17.4-3.2s9.9-5.2 13.8-9 6.9-8.4 9.1-13.7c1.6-3.8 2.6-7.8 3.1-12 0.2-1.6 0.4-8.9 0.2-12.2h-43.4l-7.7 15.8h30.9c-1.2 5-3.9 9.1-8.1 12.2s-9.2 4.6-15.1 4.6c-3.8 0-7.3-0.8-10.5-2.2-3.3-1.5-6.1-3.5-8.5-6s-4.3-5.4-5.7-8.8-2-7-2-10.8 0.7-7.4 2.1-10.8 3.3-6.3 5.8-8.8c2.4-2.5 5.3-4.4 8.5-5.8s6.7-2.1 10.5-2.1c5.1 0 9.6 1.2 13.5 3.4 3.9 2.3 7 5.5 9.1 9.8l17.1-8.1c-3.6-7.1-8.8-12.6-15.8-16.6s-14.9-6.1-23.8-6.1c-6.3 0-12.2 1.1-17.8 3.5-5.6 2.3-10.5 5.6-14.7 9.6-4.2 4.1-7.5 8.9-9.9 14.3-2.5 5.5-3.7 11.3-3.7 17.5s1.1 12.1 3.5 17.6c2.4 5.6 5.6 10.4 9.7 14.5z" />
          <polygon className="svg-elem-10" stroke={goldStroke} strokeWidth="1" points="143.4 141.6 147.7 150.6 147.7 220.3 143.4 229.3 196.7 229.3 201.5 212.2 166.6 212.2 166.6 141.6" />
          <polygon className="svg-elem-11" stroke={goldStroke} strokeWidth="1" points="143.4 244.3 147.7 253.4 147.7 323 143.4 332.1 196.7 332.1 201.5 314.9 166.6 314.9 166.6 244.3" />
          <polygon className="svg-elem-12" stroke={goldStroke} strokeWidth="1" points="207.9 141.8 207.9 229.3 259.9 229.3 259.9 212.4 226.9 212.2 226.9 193 252.4 193 257 176.6 226.9 176.6 226.9 158.9 259.9 158.9 259.9 141.8" />
          <polygon className="svg-elem-13" stroke={goldStroke} strokeWidth="1" points="521.5 141.8 521.5 229.3 573.5 229.3 573.5 212.4 540.4 212.2 540.4 193 566 193 570.6 176.6 540.4 176.6 540.4 158.9 573.5 158.9 573.5 141.8" />
          <path className="svg-elem-14" stroke={goldStroke} strokeWidth="1" d="m285.3 229.3 6.6-17.1h35l6.8 17.1h19.7l-35.1-87.7h-26.9l5.6 11.4-31 76.3zm24.4-63.2 10.9 29.4h-22.3z" />
          <path className="svg-elem-15" stroke={goldStroke} strokeWidth="1" d="m299.3 315c-0.2-0.1-0.5-0.2-0.7-0.3-3.3-1.5-6.1-3.5-8.5-6s-4.3-5.4-5.7-8.8-2-7-2-10.8 0.7-7.4 2.1-10.8 3.3-6.3 5.8-8.8c2.4-2.5 5.3-4.4 8.5-5.8s6.7-2.1 10.5-2.1c5.1 0 9.6 1.2 13.5 3.4 3.9 2.3 7 5.5 9.1 9.8l17.1-8.1c-3.6-7.1-8.8-12.6-15.8-16.6s-14.9-6.1-23.8-6.1c-6.3 0-12.2 1.1-17.8 3.5-5.6 2.3-10.5 5.6-14.7 9.6-4.2 4.1-7.5 8.9-9.9 14.3-2.5 5.5-3.7 11.3-3.7 17.5s1.1 12.1 3.5 17.6 5.6 10.3 9.7 14.4c3.9 3.9 8.5 7.1 13.7 9.4z" />
          <path className="svg-elem-16" stroke={goldStroke} strokeWidth="1" d="m352.5 284.4h-43.5l-7.7 15.8h30.9c-1.2 5-3.9 9.1-8.1 12.2s-9.2 4.6-15.1 4.6c-2.6 0-5.1-0.4-7.5-1.1l-4.2 17.2c3.7 0.9 7.5 1.4 11.5 1.4 6.3 0 12.1-1 17.4-3.2s9.9-5.2 13.8-9 6.9-8.4 9.1-13.7c1.6-3.8 2.6-7.8 3.1-12 0.2-1.6 0.5-8.9 0.3-12.2z" />
          
          <path className="svg-elem-17" stroke={blueStroke} strokeWidth="1" d="m267.9 381.7c9.4-21.2 34.2-71.4 35.1-73.1 0.8-1.5 0.8-2.3-0.4-0.6-6 8.7-15.9 23-24.8 35.9-4.4 6.3-7.8 9-9.6 10.1-0.9 0.6-1.6 1.4-2 2.3-2.5 5.9-25.1 57.1-29.5 68.9-1.9-9.5-4.2-24.1-4.3-30 0-1.4 0.3-3-0.7-1-0.5 1.1-1.9 3.7-1.9 3.7l-2 0.4c-5.6 6.2-14 17.5-28.3 34.9 0 0 12.8-36.8 14.5-41.2 4-9.7-1.5-1.5 3.3-13.8 0.8-1.9 6.9-20.1 8.6-25.2 0.6-1.8 0.4-1.4-1.3 0.9-2.6 3.7-8.6 12.1-10.1 13.8-1.3 1.3-8.4 20.1-8.9 21.5-0.6 1.7-1 1.7-0.7 0 0.7-3.2 3.6-16 4-17.6 0.3-1.2-1.4 0.6-2.5 4-0.8 2.5-3.8 11.6-6.3 20.3-2.2 7.5-21 73.1-21.5 75 2.9-2.5 8.1-10.7 10.8-11.5 2-0.6 2.1-3 4.9-6.4 7-8.8 11.6-15.3 31.3-37.8 3 15.9 6.9 42.5 6.9 42.5s2.9-3.7 4.4-7.8c1.4-4 2.7-2.8 3.2-4.4 4.1-13.5 18.4-42.6 27.8-63.8z" />
          <path className="svg-elem-18" stroke={blueStroke} strokeWidth="1" d="m361.7 402.2c2.5-3.3 7-11 7-17.7 0-7.2-5.9-12.9-19.4-12.9-8.4 0-17 2.9-28.9 7.2-3.1 1.1-2.7 1.3 0.1 0.9 2.9-0.4 8.3-1.4 10.1-1.7 1.9-0.4 1.5 1.9 5.2 1-1.4 2.5-5.4 10.5-9.9 20.6-6.1 13.7-8.9 21.9-9.4 23.5-0.5 2.2 5.5 1.7 2.3 3.5-4.1 2.3-9.7 5.4-15.8 8.4-3.3 1.6-6.8 3.2 3 0.1 28-8.9 43.6-17.1 55.7-32.9zm-28.3-0.6c4.7-11.3 8.1-17.5 9.3-20.6 0.4-1.2-0.7-1.3-2.9-2.6 1.7-0.2 5.1-0.6 6.9-0.6 6.9 0 13 1.8 13 7.8 0 11.1-17.1 30.4-34.9 37.8-0.1 0 2.6-7.4 8.6-21.8z" />
          <path className="svg-elem-19" stroke={blueStroke} strokeWidth="1" d="m421.3 416.4-0.8-1.9s-9.4-7.2-14.6-11.7c15.8-7.2 61.1-27.6 58.5-47.9-1.5-11.3-19.1-14.7-30.9-14.7-30.3 0-74 11.2-85.3 15.3-0.3 0.1-0.3 0.2 0.1 0.2 25.5-4.4 98.4-12.8 99.5 2.6 0.8 11.8-38.4 34-49.2 39.3l-0.9-0.8c4.2-11.6 9.1-23.1 9.8-24.9 0.2-0.5 0-0.7-0.4-1-0.5-0.3-2-1.2-2.5-1.6-0.5-0.3-0.5-0.5-0.2-1.1 1-1.6 2.5-3.6 3.2-4.5 0.6-0.8 0.3-0.7-0.4-0.6-3.9 0.7-13.8 2.8-27.8 8.5-1 0.4-0.9 0.6 0.2 0.3 4.2-1 18.4-4.9 16.2 0.9-0.7 1.9-3.6 9.2-7.9 20.6-3 0-3.1 1.4-4.6 1.9-1.1 0.4-6.4-0.7-4.2 1.2 1.6 1.4 2.5 2.2 5.7 5.1-4.8 12.7-12.2 33-12.2 33-0.6 1.7 1.6 1.8 3.3 4.4 2 2.9 3.2 8.3 4.5 4.8 1.6-4.3 9.8-28.5 12.8-35.5 0 0 12.3 9.8 16.1 12.7 7.9 6 14.6 11.4 21 15.5 4.4 2.9 5.6 3-0.8-2.2-10.7-8.7-9.3-8.7 5.7 1.3 2 1.4 4 2.6 5.9 2.6 1.4 0.1 2.2 0.2 6.6 3 3.3 2.1 5.6 3.6 11.3 7.5 7.4 5.1 8.8 4.8 1.7-0.8s-39.4-31.5-39.4-31.5z" />
          <path className="svg-elem-20" stroke={blueStroke} strokeWidth="1" d="m602.1 348.9c-29.2-1.8-94.9 3.2-118.9 9.1-0.9 0.2-0.9 0.7-0.7 1.3 0.2 0.8 3 2.1 3.2 3.2 0.4 2.4 3.8 1.8 3 3.8s-6.5 16.3-6.5 16.3c-2.6 1-6.8 2.8-6.9 3.1-0.3 0.7 3.4 2.3 3.5 5-2.8 6.9-6.8 18.9-7.4 20.5-0.5 1.5 1.8 2 2.5 3.5 0.7 1.6 1.8 4.5 2.2 5.1 0.8 1.2 1.1 0.3 1.6-0.8 0.6-1.6 2.5-7 3.4-9.6 1.8-5.1 6.9-20.2 6.9-20.2 7.6-3 11.5-3.3 11.6-4 0-1.1 2.2-2.3 2.2-2.3s1.2-0.8 1.2-1.3 2-0.9 3-1.5 0.6-1-0.2-1.2c-5.2-0.1-10.1 0.5-14.4 1.5 1.5-4.1 5-13.5 6.5-16.5 7.7-2 16.1-3.5 26.9-5.1-3.2 8.5-10.4 28.6-11.3 31-1.1 2.9-2.2 3.9-1.9 5s-2.5 7.9-4.2 13.2c-0.6 2-0.5 2.2 0.1 2.8 0.3 0.3 0.5 0.4 1.2-0.8 2.2-4.4 3.2-2.9 1 3.3-0.1 0.3-0.1 0.4 0.1 0.6 1 1.8 3.7 4.8 4.4 2.6 4.5-14.1 10.7-34.3 19.7-58.9 12.8-1.6 16.4-1.9 21.3-2.4 2.1-0.2 2.8-2.4 6-2.7 13.9-1.2 29.8-2.4 40.9-3.2 0.8-0.2 1.2-0.4 0-0.4z" />
          <path className="svg-elem-21" stroke={blueStroke} strokeWidth="1" d="m276.5 396.1c-2.2 0.8-1.6 1.5-3.5 3.4-0.7 0.8-2.3 0.4-2.7 1.3-3.4 8-11.4 26-13.6 33.8-0.3 1 0.3 1.9 0.9 2.2 0 0 1.2-3.6 1.8-3.1 1 0.8 0 5.2 0.8 5.7 1.4 0.8 2.6 1.4 3.4-0.4 1-2.2 4.4-11.9 8.6-21.7 3.4-8.1 8-17.3 10.9-21.5 2.1-3-4.4-0.4-6.6 0.3" />
          <path className="svg-elem-22" stroke={blueStroke} strokeWidth="1" d="m299.3 404.9c3.8-7.4 8.2-15.3 10-18.5 1-1.8-6.7 1.2-7.9 1.8-1.3 0.6-3 1.2-4.4 3.9-1.5 2.8-7 13.9-11.1 23.8-1.6 4-5.8 11.8-6.3 13.1 0 0.5 0.1 1.7 0.7 3 0.2 0.4 2.5-0.4 2.8 0.1 0.2 0.4-6.3 3.9-7.9 5-0.8 0.6-0.7 0.6 0 0.3 3.2-1.1 18.2-5.6 26.5-8.4 0.5-0.6 1.7-2.3 3-4.6-1.1 0.2-3.8 0.7-4.7 0.9-0.4 0.1-0.7-0.3 0-0.7 1.3-0.7 13-6.6 8.2-5.2s-11.9 3.4-19.2 6.4c-0.1 0.1 5.4-11.3 10.3-20.9z" />
          <path className="svg-elem-23" stroke={blueStroke} strokeWidth="1" d="m464.6 378c-1.2 1.2-2.3 4.3-3.9 5.5-0.9 0.6-3.8 1.7-4.2 2.6-2.7 7.1-9.9 27.1-10.2 29.7-0.1 1.1 0.4 1.4 1.2 1.7 1.8 0.8 2.7-1.2 4.2-0.5 0.8 0.4-0.1 2.5 0.3 3.2 0.6 1.1 1.2 0.3 1.9-1.9 1.8-5.9 6.7-20.6 9.1-26.6 2.3-5.7 4.2-10.3 5.8-14.2 0.5-1.3-3-0.7-4.2 0.5z" />
          <path className="svg-elem-24" stroke={blueStroke} strokeWidth="1" d="m616.6 349h-1.8v-1h4.8v1h-1.8v4.2h-1.1v-4.2zm4.2-1.1h1.2l1.8 2.8 1.8-2.8h1.2v5.2h-1.1v-3.5l-1.8 2.8h-0.1l-1.8-2.8v3.5h-1.1v-5.2" />
        </g>
      </svg>
    </div>
  );
}
