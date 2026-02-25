"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useDraftStore } from "@/store/draftStore";
import { Role } from "@/types/champion";

export function Background() {
  const containerRef = useRef<HTMLDivElement>(null);
  const allyOrbRef = useRef<HTMLDivElement>(null);
  const enemyOrbRef = useRef<HTMLDivElement>(null);
  const centerOrbRef = useRef<HTMLDivElement>(null);
  
  const allyPicks = useDraftStore(state => Object.values(state.ally).filter(v => v.championId).length);
  const enemyPicks = useDraftStore(state => Object.values(state.enemy).filter(v => v.championId).length);
  const allyBans = useDraftStore(state => state.bans.ally.length);
  const enemyBans = useDraftStore(state => state.bans.enemy.length);

  const [lastAllyPicks, setLastAllyPicks] = useState(0);
  const [lastEnemyPicks, setLastEnemyPicks] = useState(0);
  const [lastAllyBans, setLastAllyBans] = useState(0);
  const [lastEnemyBans, setLastEnemyBans] = useState(0);

  // Initial Particle Setup
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const particles: HTMLDivElement[] = [];
    const numParticles = 40;

    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement("div");
        
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const size = Math.random() * 4 + 2;

        let colorClass = "bg-white/20";
        if (x < 40) colorClass = "bg-blue-400/40";
        else if (x > 60) colorClass = "bg-red-400/40";
        else if (Math.random() > 0.5) colorClass = "bg-yellow-400/40"; 
        
        particle.className = `absolute rounded-full pointer-events-none blur-[1px] ${colorClass} gsap-particle`;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${x}vw`;
        particle.style.top = `${y}vh`;

        container.appendChild(particle);
        particles.push(particle);
    }

    particles.forEach((particle) => {
        const randomX = (Math.random() - 0.5) * 20;
        const randomY = (Math.random() - 0.5) * 20;
        const randomDuration = Math.random() * 10 + 10;
        const randomDelay = Math.random() * -20;
        
        gsap.to(particle, {
            x: `${randomX}vw`,
            y: `${randomY}vh`,
            duration: randomDuration,
            delay: randomDelay,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
        });
        
        gsap.to(particle, {
            opacity: Math.random() * 0.5 + 0.1,
            duration: Math.random() * 2 + 1,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });
    });

    return () => {
       particles.forEach(p => {
         gsap.killTweensOf(p);
         if (container.contains(p)) container.removeChild(p);
       });
    };
  }, []);

  // GSAP Interaction Hooks
  const flashOrb = (orbElement: HTMLDivElement | null, targetScale: number, colorShift: string = "") => {
    if (!orbElement) return;
    
    gsap.killTweensOf(orbElement);
    
    // Animate to impact
    gsap.to(orbElement, {
      scale: targetScale,
      opacity: 0.4,
      duration: 0.15,
      ease: "power2.out",
      backgroundColor: colorShift ? colorShift : undefined
    });

    // Settle back to ambient
    gsap.to(orbElement, {
      scale: 1,
      opacity: 0.1,
      duration: 1.5,
      delay: 0.15,
      ease: "power3.out",
    });
  };

  const burstParticles = (side: "left" | "right", color: string) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement("div");
        const size = Math.random() * 6 + 3;
        
        particle.className = `absolute rounded-full pointer-events-none blur-[2px] ${color}`;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = side === "left" ? "20vw" : "80vw";
        particle.style.top = "50vh";

        container.appendChild(particle);

        const targetX = side === "left" 
            ? `+=${Math.random() * 30 - 15}vw`
            : `+=${Math.random() * 30 - 15}vw`;
        const targetY = `+=${Math.random() * 60 - 30}vh`;

        gsap.to(particle, {
            x: targetX,
            y: targetY,
            opacity: 0,
            scale: 0,
            duration: Math.random() * 1.5 + 0.5,
            ease: "power4.out",
            onComplete: () => {
                if (container.contains(particle)) container.removeChild(particle);
            }
        });
    }
  };

  useEffect(() => {
    if (allyPicks > lastAllyPicks) {
      flashOrb(allyOrbRef.current, 1.3, "rgba(59, 130, 246, 0.4)");
      burstParticles("left", "bg-blue-400/80");
    }
    setLastAllyPicks(allyPicks);
  }, [allyPicks, lastAllyPicks]);

  useEffect(() => {
    if (enemyPicks > lastEnemyPicks) {
      flashOrb(enemyOrbRef.current, 1.3, "rgba(239, 68, 68, 0.4)");
      burstParticles("right", "bg-red-400/80");
    }
    setLastEnemyPicks(enemyPicks);
  }, [enemyPicks, lastEnemyPicks]);

  useEffect(() => {
    if (allyBans > lastAllyBans) {
      flashOrb(allyOrbRef.current, 0.8, "rgba(239, 68, 68, 0.3)");
      flashOrb(centerOrbRef.current, 1.2, "rgba(239, 68, 68, 0.15)");
    }
    setLastAllyBans(allyBans);
  }, [allyBans, lastAllyBans]);

  useEffect(() => {
    if (enemyBans > lastEnemyBans) {
      flashOrb(enemyOrbRef.current, 0.8, "rgba(239, 68, 68, 0.3)");
      flashOrb(centerOrbRef.current, 1.2, "rgba(239, 68, 68, 0.15)");
    }
    setLastEnemyBans(enemyBans);
  }, [enemyBans, lastEnemyBans]);

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-zinc-950 pointer-events-none">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 via-zinc-900/20 to-red-900/10"></div>
      
      {/* Glow Orbs */}
      <div ref={allyOrbRef} className="absolute top-1/4 left-0 w-[50vw] h-[50vw] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none transform -translate-x-1/3 -translate-y-1/3 opacity-10"></div>
      <div ref={enemyOrbRef} className="absolute bottom-1/4 right-0 w-[50vw] h-[50vw] bg-red-600/10 rounded-full blur-[120px] pointer-events-none transform translate-x-1/3 translate-y-1/3 opacity-10"></div>
      <div ref={centerOrbRef} className="absolute top-1/2 left-1/2 w-[30vw] h-[30vw] bg-white/5 rounded-full blur-[100px] pointer-events-none transform -translate-x-1/2 -translate-y-1/2 opacity-10"></div>
      
      {/* Particles Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none"></div>
    </div>
  );
}
