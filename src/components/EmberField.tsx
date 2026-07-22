"use client";

import { useEffect, useRef } from "react";

type Ember = {
  x: number;
  y: number;
  r: number;
  speed: number;
  swayAmp: number;
  swayFreq: number;
  phase: number;
  life: number;
  ttl: number;
  hue: [number, number, number];
};

// Warm palette drawn from the temple's own colors — gold-forward with the
// occasional amber/crimson spark, so it reads as diya/aarti embers rather
// than generic particles.
const PALETTE: [number, number, number][] = [
  [255, 222, 95], // gold
  [255, 200, 120], // amber
  [231, 37, 87], // crimson (rare)
];

/**
 * A quiet field of embers drifting upward — evoking the sparks off temple
 * oil lamps. Canvas-based (one draw loop, ~28 particles) for smoothness,
 * DPR-aware for crispness, paused when scrolled out of view, and left
 * blank (no animation) when the viewer prefers reduced motion. Purely
 * ambient: sits behind the hero text, never interactive.
 *
 * The canvas element itself always renders (identical on server and
 * client) so there's no hydration mismatch — the reduced-motion decision
 * lives entirely inside the effect, which runs only on the client.
 */
export default function EmberField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    const embers: Ember[] = [];
    const COUNT = 28;

    const spawn = (initial: boolean): Ember => {
      const ttl = 340 + Math.random() * 360;
      return {
        x: Math.random() * width,
        y: initial ? Math.random() * height : height + 20,
        r: 0.8 + Math.random() * 1.8,
        speed: 0.15 + Math.random() * 0.5,
        swayAmp: 6 + Math.random() * 18,
        swayFreq: 0.004 + Math.random() * 0.006,
        phase: Math.random() * Math.PI * 2,
        life: initial ? Math.random() * ttl : 0,
        ttl,
        hue: PALETTE[Math.random() < 0.15 ? 2 : Math.random() < 0.5 ? 1 : 0],
      };
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < COUNT; i++) embers.push(spawn(true));

    let running = true;
    let raf = 0;

    const io = new IntersectionObserver(
      ([entry]) => {
        running = entry.isIntersecting;
        if (running) raf = requestAnimationFrame(frame);
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    const frame = () => {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);
      for (const e of embers) {
        e.life += 1;
        e.y -= e.speed;
        const drift = Math.sin(e.life * e.swayFreq + e.phase) * e.swayAmp;
        const x = e.x + drift;

        // Fade in over the first fifth of life, out over the last third.
        const inT = Math.min(1, e.life / (e.ttl * 0.2));
        const outT = Math.min(1, (e.ttl - e.life) / (e.ttl * 0.35));
        const alpha = Math.max(0, Math.min(inT, outT)) * 0.85;

        const [r, g, b] = e.hue;
        ctx.beginPath();
        ctx.shadowBlur = 8;
        ctx.shadowColor = `rgba(${r},${g},${b},${alpha})`;
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.arc(x, e.y, e.r, 0, Math.PI * 2);
        ctx.fill();

        if (e.life >= e.ttl || e.y < -20) {
          Object.assign(e, spawn(false));
        }
      }
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
