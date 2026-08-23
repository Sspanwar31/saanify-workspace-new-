'use client';

import { useEffect, useRef } from 'react';

interface WaveParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  rotation: number;
  rotSpeed: number;
  life: number;
  maxLife: number;
  type: 'petal' | 'stardust';
}

interface PresetConfig {
  colors: string[];
  waveColor: string;
  particleType: 'petal' | 'stardust';
}

// ━━━ EXCLUSIVE PRESETS: KARWA CHAUTH & GURU NANAK JAYANTI ONLY ━━━
const WAVE_PRESETS: Record<string, PresetConfig> = {
  KARWA_CHAUTH: {
    colors: ['#f43f5e', '#fbcfe8', '#e2e8f0', '#ffffff'],
    waveColor: 'rgba(226, 232, 240, 0.18)', // Silver Moonlight Waves
    particleType: 'petal',
  },
  GURU_NANAK_JAYANTI: {
    colors: ['#FFFDF0', '#FFD700', '#FFC72C', '#FEF08A'],
    waveColor: 'rgba(255, 215, 0, 0.22)', // Golden Amrit Sarovar Waves
    particleType: 'stardust',
  },
  DEFAULT: {
    colors: ['#FFFDF0', '#FFD700', '#FFC72C', '#e2e8f0'],
    waveColor: 'rgba(255, 215, 0, 0.18)',
    particleType: 'stardust',
  },
};

export default function WaveEngine({ preset }: { preset?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafId = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const particles = useRef<WaveParticle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Case-Insensitive Matching
    const presetKey = (preset || '').toUpperCase().trim();
    const isGuruNanak =
      presetKey.includes('GURU') ||
      presetKey.includes('NANAK') ||
      presetKey.includes('JAYANTI');

    const activeKey = isGuruNanak ? 'GURU_NANAK_JAYANTI' : 'KARWA_CHAUTH';
    const config = WAVE_PRESETS[activeKey] || WAVE_PRESETS.DEFAULT;

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

    // Drawing Functions
    const drawPetal = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      alpha: number,
      rot: number,
      color: string
    ) => {
      c.save();
      c.translate(x, y);
      c.rotate(rot);
      c.globalAlpha = alpha;
      c.fillStyle = color;
      c.beginPath();
      c.ellipse(0, 0, size, size * 0.45, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    };

    const drawStardust = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      alpha: number,
      color: string
    ) => {
      c.save();
      c.translate(x, y);
      c.globalAlpha = alpha;
      c.fillStyle = color;
      c.beginPath();
      c.arc(0, 0, size, 0, Math.PI * 2);
      c.fill();

      c.globalAlpha = alpha * 0.35;
      c.beginPath();
      c.arc(0, 0, size * 2, 0, Math.PI * 2);
      c.fill();
      c.restore();
    };

    // Pre-fill particles
    const wInit = canvas.getBoundingClientRect().width;
    const hInit = canvas.getBoundingClientRect().height;

    for (let i = 0; i < 55; i++) {
      const isPetal = config.particleType === 'petal' && Math.random() < 0.4;
      particles.current.push({
        x: rn(0, wInit),
        y: rn(0, hInit),
        vx: rn(-0.4, 0.4),
        vy: rn(0.8, 1.8),
        size: isPetal ? rn(4, 7) : rn(1.0, 2.5),
        alpha: rn(0.3, 0.8),
        color: isPetal
          ? Math.random() < 0.6
            ? '#f43f5e'
            : '#fbcfe8'
          : config.colors[Math.floor(Math.random() * config.colors.length)],
        rotation: rn(0, Math.PI * 2),
        rotSpeed: rn(-0.02, 0.02),
        life: rn(0, 200),
        maxLife: rn(300, 500),
        type: isPetal ? 'petal' : 'stardust',
      });
    }

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);
      timeRef.current += 0.018;

      // 1. DELICATE MOONLIGHT / SAROVAR WATER WAVES
      const baseHeight = h * 0.84;
      ctx.save();
      ctx.strokeStyle = config.waveColor;
      ctx.lineWidth = 1.0;

      for (let i = 0; i < 5; i++) {
        const y = baseHeight + i * 12;
        const currentOffset = timeRef.current * (1 + i * 0.2);
        const currentAmp = 5 * (1 - i * 0.15);

        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= w; x += 15) {
          const waveY =
            y + Math.sin(x * 0.01 + currentOffset) * currentAmp;
          ctx.lineTo(x, waveY);
        }
        ctx.stroke();
      }
      ctx.restore();

      // 2. FESTIVAL PARTICLES
      if (particles.current.length < 75 && Math.random() < 0.4) {
        const isPetal = config.particleType === 'petal' && Math.random() < 0.4;
        particles.current.push({
          x: rn(-10, w + 10),
          y: -10,
          vx: rn(-0.5, 0.5),
          vy: rn(0.8, 2.0),
          size: isPetal ? rn(4, 7) : rn(1.0, 2.5),
          alpha: rn(0.4, 0.85),
          color: isPetal
            ? Math.random() < 0.6
              ? '#f43f5e'
              : '#fbcfe8'
            : config.colors[Math.floor(Math.random() * config.colors.length)],
          rotation: rn(0, Math.PI * 2),
          rotSpeed: rn(-0.02, 0.02),
          life: 0,
          maxLife: rn(300, 500),
          type: isPetal ? 'petal' : 'stardust',
        });
      }

      particles.current = particles.current.filter((p) => {
        p.life++;
        p.x += p.vx + Math.sin(timeRef.current + p.y * 0.01) * 0.2;
        p.y += p.vy;
        p.rotation += p.rotSpeed;

        const lt = p.life / p.maxLife;
        const currentAlpha = lt < 0.8 ? p.alpha : p.alpha * ((1 - lt) / 0.2);

        if (p.life < p.maxLife && p.y < h + 20 && currentAlpha > 0.01) {
          if (p.type === 'petal') {
            drawPetal(ctx, p.x, p.y, p.size, currentAlpha, p.rotation, p.color);
          } else {
            drawStardust(ctx, p.x, p.y, p.size, currentAlpha, p.color);
          }
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
  }, [preset]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[4]"
    />
  );
}
