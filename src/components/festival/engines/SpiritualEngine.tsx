'use client';

import React, { useEffect, useRef } from 'react';
import DiwaliScene from './presets/DiwaliScene';

interface Props {
  preset?: string;
  engine_preset?: string;
  festival_key?: string;
  phase?: string;
  customMaxCount?: number;
  customSpeed?: number;
  customColors?: string[];
}

interface GoldParticle {
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

export default function SpiritualEngine({
  preset,
  engine_preset,
  festival_key,
  phase,
  customMaxCount,
  customSpeed,
  customColors,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<GoldParticle[]>([]);
  const rafId = useRef<number>(0);

  const rawKey = preset || engine_preset || festival_key || 'DIWALI';
  const presetKey = rawKey.toUpperCase().trim();

  const isDiwaliOrDev =
    presetKey.includes('DIWALI') ||
    presetKey.includes('DEEPAWALI') ||
    presetKey === 'DEFAULT';

  useEffect(() => {
    if (!isDiwaliOrDev) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const maxCount = customMaxCount || 140;
    const speed = customSpeed || 1.2;

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

    // ✨ 2027 DUAL-TONE GOLD DUST (Works on BOTH White Light & Dark Themes!)
    const drawDualToneGoldDust = (
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
      c.globalCompositeOperation = 'source-over'; // 100% Reliable for Light & Dark UI

      // 1. Deep Amber Outer Ring (Gives High-Contrast on White Cards)
      c.fillStyle = colorEdge;
      c.beginPath();
      c.arc(0, 0, size * 1.3, 0, Math.PI * 2);
      c.fill();

      // 2. Pure Bright Gold Core (Glows Luminous on Dark Mode)
      c.fillStyle = colorCore;
      c.beginPath();
      c.arc(0, 0, size * 0.75, 0, Math.PI * 2);
      c.fill();

      // 3. Crisp 4-Point Star Sparkle
      if (isSparkle) {
        c.globalAlpha = alpha * 0.85;
        c.strokeStyle = '#FFFDF0';
        c.lineWidth = 0.7;
        c.beginPath();
        c.moveTo(-size * 2, 0); c.lineTo(size * 2, 0);
        c.moveTo(0, -size * 2); c.lineTo(0, size * 2);
        c.stroke();
      }

      c.restore();
    };

    // Dual-Tone Color Pairings (Shining Core + Deep Amber Edge)
    const goldPairs = [
      { core: '#FFFDF0', edge: '#D97706' }, // White-Gold Core + Amber Edge
      { core: '#FFD700', edge: '#B8860B' }, // Pure Gold Core + Bronze Edge
      { core: '#FFC72C', edge: '#92400E' }, // Bright Gold Core + Deep Gold Edge
      { core: '#FFE885', edge: '#B45309' }, // Light Gold Core + Warm Amber Edge
    ];

    // Pre-fill particles across screen
    const wInit = canvas.getBoundingClientRect().width;
    const hInit = canvas.getBoundingClientRect().height;

    for (let i = 0; i < maxCount * 0.7; i++) {
      const pair = goldPairs[Math.floor(Math.random() * goldPairs.length)];
      particles.current.push({
        x: rn(0, wInit),
        y: rn(0, hInit),
        vx: rn(-0.4, 0.4),
        vy: rn(0.8, 2.2) * (speed / 1.2), // Downward Gold Rain
        size: rn(1.0, 2.6),
        alpha: rn(0.4, 0.9),
        life: rn(0, 200),
        maxLife: rn(300, 500),
        colorCore: pair.core,
        colorEdge: pair.edge,
        twinkle: rn(0, Math.PI * 2),
        isSparkle: Math.random() < 0.25,
      });
    }

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      // Continuous Spawning from top
      if (particles.current.length < maxCount && Math.random() < 0.5) {
        const pair = goldPairs[Math.floor(Math.random() * goldPairs.length)];
        particles.current.push({
          x: rn(-10, w + 10),
          y: -10,
          vx: rn(-0.5, 0.5),
          vy: rn(0.8, 2.2) * (speed / 1.2),
          size: rn(1.0, 2.6),
          alpha: rn(0.45, 0.92),
          life: 0,
          maxLife: rn(320, 550),
          colorCore: pair.core,
          colorEdge: pair.edge,
          twinkle: rn(0, Math.PI * 2),
          isSparkle: Math.random() < 0.25,
        });
      }

      particles.current = particles.current.filter((p) => {
        p.life += 1;
        p.twinkle += 0.05;
        p.x += p.vx + Math.sin(p.twinkle) * 0.2;
        p.y += p.vy;

        const lt = p.life / p.maxLife;
        const currentAlpha =
          (0.5 + Math.sin(p.twinkle) * 0.5) *
          (lt < 0.85 ? p.alpha : p.alpha * ((1 - lt) / 0.15));

        if (p.life < p.maxLife && p.y < h + 20 && currentAlpha > 0.01) {
          drawDualToneGoldDust(
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

  if (!isDiwaliOrDev) return null;

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-[3]">
      {/* 1. DIWALI / DEV DEEPAWALI BACKGROUND SCENE */}
      <DiwaliScene phase={phase} />

      {/* 2. DUAL-TONE GOLD DUST (Works on Light & Dark Theme) */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none z-[5]"
      />
    </div>
  );
}
