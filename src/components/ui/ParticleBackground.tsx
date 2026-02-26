"use client";

import React, { useEffect, useRef } from "react";

/**
 * A beautiful, lightweight particle background for the Wild Rift Draft Assistant.
 * Creates an atmospheric "energy" effect with moving dots and faint connections.
 */
interface ParticleBackgroundProps {
  splitBias?: number; // 0.1 to 0.9, defaults to 0.5
}

class Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  opacity: number;
  isLeft: boolean;

  constructor(w: number, h: number, bias: number) {
    const rand = Math.random();
    if (rand < 0.5) {
      this.color = "59, 130, 246"; // Blue
      this.x = Math.random() * (w * bias);
      this.isLeft = true;
    } else {
      this.color = "220, 38, 38"; // Red
      this.x = (w * bias) + Math.random() * (w * (1 - bias));
      this.isLeft = false;
    }
    
    this.y = Math.random() * h;
    this.size = Math.random() * 1.5 + 0.5;
    this.speedX = Math.random() * 0.3 - 0.15;
    this.speedY = Math.random() * 0.4 - 0.2;
    this.opacity = Math.random() * 0.5 + 0.1;
  }

  update(w: number, h: number, bias: number) {
    this.x += this.speedX;
    this.y += this.speedY;

    const splitX = w * bias;

    // Boundary logic per side
    if (this.isLeft) {
      if (this.x > splitX) { this.x = splitX; this.speedX *= -1; }
      else if (this.x < 0) { this.x = 0; this.speedX *= -1; }
    } else {
      if (this.x < splitX) { this.x = splitX; this.speedX *= -1; }
      else if (this.x > w) { this.x = w; this.speedX *= -1; }
    }

    if (this.y > h) this.y = 0;
    else if (this.y < 0) this.y = h;
  }

  draw(c: CanvasRenderingContext2D) {
    c.beginPath();
    c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    c.fillStyle = `rgba(${this.color}, ${this.opacity})`;
    c.fill();
  }
}

export function ParticleBackground({ splitBias = 0.5 }: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const biasRef = useRef(splitBias);

  useEffect(() => {
    biasRef.current = splitBias;
  }, [splitBias]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Particle[] = [];
    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const init = () => {
      particles = [];
      const w = canvas.width;
      const h = canvas.height;
      const numberOfParticles = Math.floor((w * h) / 12000);
      for (let i = 0; i < numberOfParticles; i++) {
        particles.push(new Particle(w, h, biasRef.current));
      }
    };

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const w = canvas.width;
      const h = canvas.height;

      // Update and draw particles in one pass
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.update(w, h, biasRef.current);
        p.draw(ctx);
      }

      // Optimized connection lines (spatial limiting)
      // We only check a subset of particles for connections to drastically reduce O(N^2)
      ctx.lineWidth = 0.5;
      const maxDistance = 100;
      const squaredMaxDist = maxDistance * maxDistance;

      for (let i = 0; i < particles.length; i += 2) { // Skip some for perf
        const p1 = particles[i];
        // Only check subsequent particles, and limit inner loop
        const limit = Math.min(i + 15, particles.length); 
        for (let j = i + 1; j < limit; j++) {
          const p2 = particles[j];
          if (p1.isLeft !== p2.isLeft) continue;

          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          // Use squared distance to avoid Math.sqrt
          const distSq = dx * dx + dy * dy;

          if (distSq < squaredMaxDist) {
            const dist = Math.sqrt(distSq);
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${p1.color}, ${0.1 * (1 - dist / maxDistance)})`;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    init();
    animate();

    window.addEventListener("resize", () => {
      resizeCanvas();
      init();
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none -z-5 transition-opacity duration-[2000ms]"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};
