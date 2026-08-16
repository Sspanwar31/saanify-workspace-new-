'use client';

import React, { useEffect, useRef } from 'react';

interface Props {
  preset?: string;
  heroConfig?: any;
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
  heroConfig,
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

    // 🏆 1. BACKEND SUPABASE CONTROLLED VALUES
    const colors =
      customColors ||
      heroConfig?.customColors ||
      ['#FFFDF0', '#FFD700', '#FFC72C', '#FF9900', '#FFE885'];

    const maxCount = customMaxCount ?? heroConfig?.customMaxCount ?? 130;
    
    // 🚀 2. NORMAL SMOOTH SPEED CALCULATION (0.5px to 1.2px per frame)
    const speedFactor =
      customSpeed ??
      heroConfig?.customSpeed ??
      (heroConfig?.speed ? heroConfig.speed / 3.5 : 1.0);

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
      c.globalCompositeOperation = 'source-over';

      // 1. Dark Amber Outer Edge (High Contrast on White UI)
      c.fillStyle = colorEdge;
      c.beginPath();
      c.arc(0, 0, size * 1.35, 0, Math.PI * 2);
      c.fill();

      // 2. Pure Bright Gold Core
      c.fillStyle = colorCore;
      c.beginPath();
      c.arc(0, 0, size * 0.78, 0, Math.PI * 2);
      c.fill();

      // 3. 4-Point Star Sparkle
      if (isSparkle) {
        c.globalAlpha = alpha * 0.85;
        c.strokeStyle = '#FFFDF0';
        c.lineWidth = 0.6;
        c.beginPath();
        c.moveTo(-size * 1.8, 0); c.lineTo(size * 1.8, 0);
        c.moveTo(0, -size * 1.8); c.lineTo(0, size * 1.8);
        c.stroke();
      }

      c.restore();
    };

    const goldPairs = [
      { core: '#FFFDF0', edge: '#D97706' },
      { core: '#FFD700', edge: '#B8860B' },
      { core: '#FFC72C', edge: '#92400E' },
      { core: '#FF9900', edge: '#7C2D12' },
    ];

    // PRE-FILL PARTICLES ACROSS ENTIRE SCREEN
    const wInit = canvas.getBoundingClientRect().width;
    const hInit = canvas.getBoundingClientRect().height;

    for (let i = 0; i < maxCount * 0.75; i++) {
      const pair = goldPairs[Math.floor(Math.random() * goldPairs.length)];
      particles.current.push({
        x: rn(0, wInit),
        y: rn(0, hInit),
        vx: rn(-0.3, 0.3),
        vy: rn(0.5, 1.2) * speedFactor, // 🚀 NORMAL CALM FLOAT SPEED
        size: rn(1.2, 2.8),
        alpha: rn(0.4, 0.9),
        life: rn(0, 300),
        maxLife: rn(500, 900), // 🚀 LONGER LIFE FOR SMOOTH FLOW TO BOTTOM
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
      if (particles.current.length < maxCount && Math.random() < 0.45) {
        const pair = goldPairs[Math.floor(Math.random() * goldPairs.length)];
        particles.current.push({
          x: rn(-10, w + 10),
          y: -15,
          vx: rn(-0.4, 0.4),
          vy: rn(0.5, 1.2) * speedFactor, // 🚀 NORMAL CALM FLOAT SPEED
          size: rn(1.2, 2.8),
          alpha: rn(0.45, 0.9),
          life: 0,
          maxLife: rn(550, 950), // 🚀 REACHES BOTTOM SMOOTHLY
          colorCore: pair.core,
          colorEdge: pair.edge,
          twinkle: rn(0, Math.PI * 2),
          isSparkle: Math.random() < 0.25,
        });
      }

      particles.current = particles.current.filter((p) => {
        p.life += 1;
        p.twinkle += 0.04;
        p.x += p.vx + Math.sin(p.twinkle) * 0.2;
        p.y += p.vy;

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
  }, [presetKey, customMaxCount, customSpeed, customColors, heroConfig]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[5]"
    />
  );
}
