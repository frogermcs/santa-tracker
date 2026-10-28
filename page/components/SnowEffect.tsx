"use client";

import React, { useEffect, useRef } from "react";

interface Flake {
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
  alpha: number;
  phase: number;
}

export const SnowEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Generate ~50 gentle snowflakes of varying depth
    const FLAKE_COUNT = 55;
    const flakes: Flake[] = Array.from({ length: FLAKE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.6, // radius: 0.6px to 2.1px
      vy: Math.random() * 0.45 + 0.25, // gentle fall speed
      vx: (Math.random() - 0.5) * 0.2,
      alpha: Math.random() * 0.5 + 0.25, // soft opacity
      phase: Math.random() * Math.PI * 2,
    }));

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // Draw each snowflake with a soft winter frost glow
      for (const f of flakes) {
        if (!prefersReducedMotion) {
          f.y += f.vy * (dt * 60);
          f.x += (f.vx + Math.sin(f.phase + time * 0.001) * 0.25) * (dt * 60);

          // Wrap around edges seamlessly
          if (f.y > height + 5) {
            f.y = -5;
            f.x = Math.random() * width;
          }
          if (f.x > width + 5) f.x = -5;
          if (f.x < -5) f.x = width + 5;
        }

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(235, 245, 255, ${f.alpha})`;
        ctx.shadowColor = "rgba(186, 230, 253, 0.4)";
        ctx.shadowBlur = f.r > 1.2 ? 3 : 0;
        ctx.fill();
      }

      // Reset shadow for next frame
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 opacity-70"
    />
  );
};
