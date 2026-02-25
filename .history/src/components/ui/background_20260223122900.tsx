"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function Background() {
  const containerRef = useRef<HTMLDivElement>(null);
  const glowBlueRef = useRef<HTMLDivElement>(null);
  const glowRedRef = useRef<HTMLDivElement>(null);
  const glowWhiteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const particles: { el: HTMLDivElement; }[] = [];
    const numParticles = 60;

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
        particles.push({ el: particle });
    }

    // Baseline animations
    particles.forEach((p) => {
        const randomX = (Math.random() - 0.5) * 15;
        const randomY = (Math.random() - 0.5) * 15;
        const randomDuration = Math.random() * 8 + 8;
        const randomDelay = Math.random() * -20;
        
        gsap.to(p.el, {
            x: `${randomX}vw`,
            y: `${randomY}vh`,
            duration: randomDuration,
            delay: randomDelay,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
        });
        
        // Twinkle effect
        gsap.to(p.el, {
            opacity: Math.random() * 0.5 + 0.1,
            duration: Math.random() * 2 + 1,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });
    });

    const handleMouseMove = (e: MouseEvent) => {
       const xCenter = window.innerWidth / 2;
       const yCenter = window.innerHeight / 2;
       const xOffset = (e.clientX - xCenter) / xCenter; // -1 to 1
       const yOffset = (e.clientY - yCenter) / yCenter; // -1 to 1

       // Move glow orbs slightly opposite to mouse
       if (glowBlueRef.current) {
          gsap.to(glowBlueRef.current, {
             x: -xOffset * 50,
             y: -yOffset * 50,
             duration: 1,
             ease: "power2.out"
          });
       }
       if (glowRedRef.current) {
          gsap.to(glowRedRef.current, {
             x: -xOffset * 50,
             y: -yOffset * 50,
             duration: 1.2,
             ease: "power2.out"
          });
       }
       if (glowWhiteRef.current) {
          gsap.to(glowWhiteRef.current, {
             x: -xOffset * 20,
             y: -yOffset * 20,
             duration: 0.8,
             ease: "power2.out"
          });
       }

       // Move particles slightly to create parallax
       particles.forEach((p, idx) => {
          const depth = (idx % 5) + 1; 
          gsap.to(p.el, {
             x: `+=${xOffset * depth * -3}`,
             y: `+=${yOffset * depth * -3}`,
             duration: 1,
             ease: "power2.out"
          });
       });
    };

    const handleClick = (e: MouseEvent) => {
       // On click, make nearby particles scatter away from click point
       particles.forEach(p => {
          const rect = p.el.getBoundingClientRect();
          const pX = rect.left + rect.width / 2;
          const pY = rect.top + rect.height / 2;
          
          const dx = pX - e.clientX;
          const dy = pY - e.clientY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 300) {
             const angle = Math.atan2(dy, dx);
             const push = (300 - dist) * 0.5;
             gsap.to(p.el, {
                x: `+=${Math.cos(angle) * push}`,
                y: `+=${Math.sin(angle) * push}`,
                duration: 1.5,
                ease: "expo.out"
             });
          }
       });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);

    return () => {
       window.removeEventListener("mousemove", handleMouseMove);
       window.removeEventListener("click", handleClick);
       particles.forEach(p => {
         gsap.killTweensOf(p.el);
         if (container.contains(p.el)) container.removeChild(p.el);
       });
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-zinc-950 pointer-events-none">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 via-zinc-900/20 to-red-900/10 opacity-70"></div>
      
      {/* Glow Orbs */}
      <div ref={glowBlueRef} className="absolute top-1/4 left-0 w-[50vw] h-[50vw] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none transform -translate-x-1/3 -translate-y-1/3"></div>
      <div ref={glowRedRef} className="absolute bottom-1/4 right-0 w-[50vw] h-[50vw] bg-red-600/15 rounded-full blur-[120px] pointer-events-none transform translate-x-1/3 translate-y-1/3"></div>
      <div ref={glowWhiteRef} className="absolute top-1/2 left-1/2 w-[30vw] h-[30vw] bg-white/10 rounded-full blur-[100px] pointer-events-none transform -translate-x-1/2 -translate-y-1/2"></div>
      
      {/* Particles Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none"></div>
    </div>
  );
}
