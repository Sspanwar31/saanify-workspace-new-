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
  color: string;
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

    // ☀️ SOLAR GOLD STARDUST COLOR PALETTE
    const colors = customColors && customColors.length > 0
      ? customColors
      : ['#FFFDF0', '#FFD700', '#FFC72C', '#FF9900', '#FFE885'];
    const maxCount = customMaxCount || 150;
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

    // ✨ CRISP SOLAR GOLD DUST DRAWING
    const drawSolarGoldDust = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      alpha: number,
      color: string,
      isSparkle: boolean
    ) => {
      c.save();
      c.translate(x, y);
      c.globalAlpha = alpha;
      c.globalCompositeOperation = 'source-over';

      // Center Gold Point
      c.fillStyle = color;
      c.beginPath();
      c.arc(0, 0, size, 0, Math.PI * 2);
      c.fill();

      // Outer Glow
      c.globalAlpha = alpha * 0.35;
      c.beginPath();
      c.arc(0, 0, size * 1.8, 0, Math.PI * 2);
      c.fill();

      // 4-Point Star Sparkle
      if (isSparkle) {
        c.globalAlpha = alpha * 0.75;
        c.strokeStyle = '#FFFDF0';
        c.lineWidth = 0.6;
        c.beginPath();
        c.moveTo(-size * 2, 0); c.lineTo(size * 2, 0);
        c.moveTo(0, -size * 2); c.lineTo(0, size * 2);
        c.stroke();
      }

      c.restore();
    };

    // 🚀 PRE-FILL PARTICLES ACROSS SCREEN AT PAGE LOAD (Top to Bottom Flow)
    const wInit = canvas.getBoundingClientRect().width;
    const hInit = canvas.getBoundingClientRect().height;

    for (let i = 0; i < maxCount * 0.7; i++) {
      particles.current.push({
        x: rn(0, wInit),
        y: rn(0, hInit),
        vx: rn(-0.4, 0.4),
        vy: rn(0.8, 2.2) * (speed / 1.2), // Downward Gold Rain
        size: rn(0.8, 2.5),
        alpha: rn(0.25, 0.85),
        life: rn(0, 200),
        maxLife: rn(300, 500),
        color: colors[Math.floor(Math.random() * colors.length)],
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
        particles.current.push({
          x: rn(-10, w + 10),
          y: -10, // Only from Top
          vx: rn(-0.5, 0.5),
          vy: rn(0.8, 2.2) * (speed / 1.2),
          size: rn(0.8, 2.5),
          alpha: rn(0.3, 0.9),
          life: 0,
          maxLife: rn(320, 550),
          color: colors[Math.floor(Math.random() * colors.length)],
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
          drawSolarGoldDust(
            ctx,
            p.x,
            p.y,
            p.size,
            currentAlpha,
            p.color,
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
