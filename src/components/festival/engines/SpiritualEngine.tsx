'use client';

import React, { useEffect, useRef } from 'react';
import DiwaliScene from './presets/DiwaliScene';

interface Props {
  preset?: string;
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
  color: string;
}

export default function SpiritualEngine({
  preset,
  phase,
  customMaxCount,
  customSpeed,
  customColors,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<GoldParticle[]>([]);
  const rafId = useRef<number>(0);

  // Match both DIWALI & DEV_DEEPAWALI from Supabase
  const presetKey = (preset || '').toUpperCase().trim();
  const isDiwaliOrDev =
    presetKey === 'DIWALI' ||
    presetKey === 'DEV_DEEPAWALI' ||
    presetKey === 'DEV_DIWALI';

  useEffect(() => {
    if (!isDiwaliOrDev) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Supabase DB Controlled Values (or Default Royal Gold Palette)
    const colors = customColors && customColors.length > 0
      ? customColors
      : ['#ffd700', '#ffcc00', '#ff9900', '#ffffff', '#fff3c4'];
    const maxCount = customMaxCount || 85;
    const speed = customSpeed || 1.2;

    const setSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setSize();
    window.addEventListener('resize', setSize);

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      // 🌟 CONTINUOUS GOLD PARTICLES SPAWN FROM TOP
      if (particles.current.length < maxCount && Math.random() < 0.35) {
        particles.current.push({
          x: Math.random() * w,
          y: -10, // Floats down gracefully
          vx: (Math.random() - 0.5) * 0.8,
          vy: (0.8 + Math.random() * 1.4) * (speed / 2),
          size: 1.5 + Math.random() * 3.5,
          alpha: 0.3 + Math.random() * 0.6,
          life: 0,
          maxLife: 220 + Math.random() * 160,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }

      particles.current = particles.current.filter((p) => {
        p.life += 1;
        p.x += p.vx + Math.sin(p.y * 0.01) * 0.3;
        p.y += p.vy;

        const lifeRatio = p.life / p.maxLife;
        const currentAlpha =
          p.life < p.maxLife * 0.8 ? p.alpha : p.alpha * (1 - lifeRatio) * 5;

        if (p.life < p.maxLife && p.y < h + 20 && currentAlpha > 0.01) {
          ctx.save();
          ctx.globalAlpha = currentAlpha;
          ctx.globalCompositeOperation = 'lighter';

          // Sparkle Center
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          // Gold Glow Aura
          ctx.globalAlpha = currentAlpha * 0.45;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
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
    <div className="relative w-full h-full pointer-events-none">
      {/* 1. DIWALI / DEV DEEPAWALI SCENE */}
      <DiwaliScene phase={phase} />

      {/* 2. CONTINUOUS FLOATING GOLD PARTICLES (SUPABASE CONTROLLED) */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none z-[5]"
      />
    </div>
  );
}
