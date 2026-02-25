"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function Background() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const particles: HTMLDivElement[] = [];
    const numParticles = 40;

    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement("div");
        
        // Randomize initial position
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const size = Math.random() * 4 + 2;

        let colorClass = "bg-white/20";
        if (x < 40) colorClass = "bg-blue-400/40";
        else if (x > 60) colorClass = "bg-red-400/40";
        else if (Math.random() > 0.5) colorClass = "bg-yellow-400/40"; 
        
        particle.className = `absolute rounded-full pointer-events-none blur-[1px] ${colorClass}`;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${x}vw`;
        particle.style.top = `${y}vh`;

        container.appendChild(particle);
        particles.push(particle);
    }

    // Animate each particle
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
        
        // Twinkle effect
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

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-zinc-950 pointer-events-none">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 via-zinc-900/20 to-red-900/10"></div>
      
      {/* Glow Orbs */}
      <div className="absolute top-1/4 left-0 w-[50vw] h-[50vw] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none transform -translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-1/4 right-0 w-[50vw] h-[50vw] bg-red-600/10 rounded-full blur-[120px] pointer-events-none transform translate-x-1/3 translate-y-1/3"></div>
      <div className="absolute top-1/2 left-1/2 w-[30vw] h-[30vw] bg-white/5 rounded-full blur-[100px] pointer-events-none transform -translate-x-1/2 -translate-y-1/2"></div>
      
      {/* Particles Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none"></div>
    </div>
  );
}
