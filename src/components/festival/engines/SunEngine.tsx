'use client';

import React, { useEffect, useRef } from 'react';

interface Props {
  preset?: string;
  customMaxCount?: number;
  customSpeed?: number;
  customColors?: string[];
}

interface SolarParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  colorCore: string;
  colorEdge: string;
  twinkle: number;
  isSparkle: boolean;
}

export default function SunEngine({
  preset,
  customMaxCount,
  customSpeed,
  customColors,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<SolarParticle[]>([]);
  const rafId = useRef<number>(0);

  const presetKey = (preset || '').toUpperCase().trim();
  const isChhathOrPongal =
    presetKey.includes('CHHATH') ||
    presetKey.includes('CHATH') ||
    presetKey.includes('SUN') ||
    presetKey.includes('PONGAL') ||
    presetKey === 'DEFAULT';

  useEffect(() => {
    if (!isChhathOrPongal) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 🏆 HIGH-CONTRAST DUAL-TONE GOLD DUST PAIRS (Visually pops on White & Dark UI)
    const goldPairs = [
      { core: '#FFFDF0', edge: '#D97706' }, // White-Gold + Amber Edge
      { core: '#FFD700', edge: '#B8860B' }, // Pure Gold + Bronze Edge
      { core: '#FFC72C', edge: '#92400E' }, // Bright Amber + Deep Gold Edge
      { core: '#FF9900', edge: '#7C2D12' }, // Solar Orange + Deep Bronze Edge
    ];

    const maxCount = customMaxCount || 200; // 🚀 BOOSTED QUANTITY (200 Particles)
    const speed = customSpeed || 1.4;

    const rn = (min: number, max: number) => min + Math.random() * (max - min);

    const setSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setSize();
    window.addEventListener('resize', setSize);

    // ✨ DUAL-TONE HIGH-CONTRAST SOLAR DUST DRAWING
    const drawDualToneSolarDust = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      alpha: number,
      colorCore: string,
      colorEdge: string,
      isSparkle: boolean
    ) => {
      c.save();
      c.translate(x, y);
      c.globalAlpha = alpha;
      c.globalCompositeOperation = 'source-over'; // 100% Reliable contrast on White UI

      // 1. Dark Amber Outer Edge (Gives High-Contrast 3D Outline on White Cards)
      c.fillStyle = colorEdge;
      c.beginPath();
      c.arc(0, 0, size * 1.4, 0, Math.PI * 2);
      c.fill();

      // 2. Pure Bright Gold Core
      c.fillStyle = colorCore;
      c.beginPath();
      c.arc(0, 0, size * 0.8, 0, Math.PI * 2);
      c.fill();

      // 3. 4-Point Star Sparkle
      if (isSparkle) {
        c.globalAlpha = alpha * 0.85;
        c.strokeStyle = '#FFFDF0';
        c.lineWidth = 0.8;
        c.beginPath();
        c.moveTo(-size * 2, 0); c.lineTo(size * 2, 0);
        c.moveTo(0, -size * 2); c.lineTo(0, size * 2);
        c.stroke();
      }

      c.restore();
    };

    // PRE-FILL PARTICLES ACROSS ENTIRE SCREEN HEIGHT (Top to Bottom)
    const wInit = canvas.getBoundingClientRect().width;
    const hInit = canvas.getBoundingClientRect().height;

    for (let i = 0; i < maxCount * 0.75; i++) {
      const pair = goldPairs[Math.floor(Math.random() * goldPairs.length)];
      particles.current.push({
        x: rn(0, wInit),
        y: rn(0, hInit), // Pre-fills entire screen height
        vx: rn(-0.4, 0.4),
        vy: rn(1.6, 3.2) * (speed / 1.2), // 🚀 FASTER DOWNWARD SPEED TO REACH BOTTOM
        size: rn(1.4, 3.2), // 🚀 LARGER SIZE FOR HIGH VISIBILITY ON WHITE UI
        alpha: rn(0.5, 0.95), // 🚀 HIGH OPACITY
        life: rn(0, 250),
        maxLife: rn(450, 750), // 🚀 LONGER LIFE TO TRAVEL FULL SCREEN HEIGHT
        colorCore: pair.core,
        colorEdge: pair.edge,
        twinkle: rn(0, Math.PI * 2),
        isSparkle: Math.random() < 0.28,
      });
    }

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      // Continuous Spawning from top
      if (particles.current.length < maxCount && Math.random() < 0.6) {
        const pair = goldPairs[Math.floor(Math.random() * goldPairs.length)];
        particles.current.push({
          x: rn(-10, w + 10),
          y: -15, // Spawns from top
          vx: rn(-0.5, 0.5),
          vy: rn(1.6, 3.4) * (speed / 1.2), // 🚀 FASTER DOWNWARD SPEED TO REACH BOTTOM
          size: rn(1.4, 3.2), // 🚀 VISIBLE SIZE
          alpha: rn(0.55, 0.95), // 🚀 HIGH OPACITY
          life: 0,
          maxLife: rn(450, 800), // 🚀 LONGER LIFE TO REACH BOTTOM FOOTER
          colorCore: pair.core,
          colorEdge: pair.edge,
          twinkle: rn(0, Math.PI * 2),
          isSparkle: Math.random() < 0.28,
        });
      }

      particles.current = particles.current.filter((p) => {
        p.life += 1;
        p.twinkle += 0.05;
        p.x += p.vx + Math.sin(p.twinkle) * 0.2;
        p.y += p.vy; // Moves down all the way to bottom

        const lt = p.life / p.maxLife;
        const currentAlpha =
          (0.6 + Math.sin(p.twinkle) * 0.4) *
          (lt < 0.85 ? p.alpha : p.alpha * ((1 - lt) / 0.15));

        if (p.life < p.maxLife && p.y < h + 30 && currentAlpha > 0.01) {
          drawDualToneSolarDust(
            ctx,
            p.x,
            p.y,
            p.size,
            currentAlpha,
            p.colorCore,
            p.colorEdge,
            p.isSparkle
          );
          return true;
        }
        return false;
      });

      rafId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId.current);
      window.removeEventListener('resize', setSize);
    };
  }, [presetKey, customMaxCount, customSpeed, customColors]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[5]"
    />
  );
}
