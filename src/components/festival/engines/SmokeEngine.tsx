'use client';

import { useEffect, useRef } from 'react';

interface SmokeParticle {
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
  type: 'sparkle' | 'petal';
}

interface PresetConfig {
  spawnRate: number;
  riseSpeed: number;
  colors: string[];
  maxCount: number;
  wind: number;
  minSize: number;
  maxSize: number;
}

const DEFAULT_COLORS = ['#ffd700', '#ff9900', '#38bdf8'];

const PRESET_COLORS: Record<string, string[]> = {
  DURGA_PUJA: ['#ffd700', '#ff9900', '#dc2626', '#ff4500', '#fff3c4'], // Gold, Marigold, Crimson, Amber
  MAHASHIVRATRI: ['#38bdf8', '#818cf8', '#16a34a', '#e0f7ff', '#ffffff'], // Ice Blue, Indigo, Bel Patra Green, White
};

const MASTER_PRESET_CONFIGS: Record<string, PresetConfig> = {
  DURGA_PUJA: {
    spawnRate: 0.35,
    riseSpeed: -2.2, // 🚀 FAST UPWARD RISE: Reaches the top of screen!
    colors: PRESET_COLORS.DURGA_PUJA,
    maxCount: 90,
    wind: 0.15,
    minSize: 2,
    maxSize: 6,
  },
  MAHASHIVRATRI: {
    spawnRate: 0.3,
    riseSpeed: -1.8,
    colors: PRESET_COLORS.MAHASHIVRATRI,
    maxCount: 80,
    wind: -0.1,
    minSize: 2,
    maxSize: 6,
  },
  DEFAULT: {
    spawnRate: 0.25,
    riseSpeed: -1.8,
    colors: DEFAULT_COLORS,
    maxCount: 70,
    wind: 0.1,
    minSize: 2,
    maxSize: 6,
  },
};

export default function SmokeEngine({
  preset,
  customRiseSpeed,
  customColors,
  customMaxCount,
}: {
  preset?: string;
  customRiseSpeed?: number;
  customColors?: string[];
  customMaxCount?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafId = useRef<number>(0);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Normalize Preset Matching
    const normalizedPreset = (preset || '').toUpperCase().trim();
    const isShiv = normalizedPreset.includes('SHIV') || normalizedPreset.includes('SHIVA');
    const activePresetKey = isShiv ? 'MAHASHIVRATRI' : 'DURGA_PUJA';

    const presetConfig = MASTER_PRESET_CONFIGS[activePresetKey] || MASTER_PRESET_CONFIGS.DEFAULT;
    const colors = customColors || PRESET_COLORS[activePresetKey] || presetConfig.colors;
    const maxParticles = customMaxCount ?? presetConfig.maxCount;
    const riseSpeed = customRiseSpeed ?? presetConfig.riseSpeed;

    const particles: SmokeParticle[] = [];
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

    // 1. Crisp Glowing Sparkle / Dust Particle Drawing
    const drawSparkle = (
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

      // Outer Glow Aura
      c.globalAlpha = alpha * 0.4;
      c.beginPath();
      c.arc(0, 0, size * 2.2, 0, Math.PI * 2);
      c.fill();
      c.restore();
    };

    // 2. Floating Marigold / Flower Petal Drawing
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

    // 🚀 PRE-FILL PARTICLES ACROSS FULL SCREEN AT PAGE LOAD!
    const wInitial = canvas.getBoundingClientRect().width;
    const hInitial = canvas.getBoundingClientRect().height;

    for (let i = 0; i < maxParticles * 0.6; i++) {
      const isPetal = Math.random() < 0.35;
      particles.push({
        x: rn(0, wInitial),
        y: rn(0, hInitial), // Spawns everywhere on screen instantly
        vx: rn(-0.5, 0.5),
        vy: riseSpeed * rn(0.8, 1.2),
        size: isPetal ? rn(4, 7) : rn(1.5, 4),
        alpha: rn(0.3, 0.8),
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: rn(0, Math.PI * 2),
        rotSpeed: rn(-0.02, 0.02),
        life: rn(0, 200),
        maxLife: rn(300, 500),
        type: isPetal ? 'petal' : 'sparkle',
      });
    }

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);
      timeRef.current += 0.015;

      // Continuous Spawning from bottom
      if (particles.length < maxParticles && Math.random() < presetConfig.spawnRate) {
        const isPetal = Math.random() < 0.35;
        particles.push({
          x: rn(-20, w + 20),
          y: h + 15,
          vx: rn(-0.6, 0.6),
          vy: riseSpeed * rn(0.8, 1.3),
          size: isPetal ? rn(4, 7) : rn(1.5, 4),
          alpha: rn(0.4, 0.85),
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: rn(0, Math.PI * 2),
          rotSpeed: rn(-0.02, 0.02),
          life: 0,
          maxLife: rn(320, 550), // 🚀 Long life so it reaches top of screen!
          type: isPetal ? 'petal' : 'sparkle',
        });
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx + Math.sin(timeRef.current + p.y * 0.01) * 0.3;
        p.y += p.vy; // Rises up to top
        p.rotation += p.rotSpeed;

        const lt = p.life / p.maxLife;
        const currentAlpha = lt < 0.8 ? p.alpha : p.alpha * ((1 - lt) / 0.2);

        if (p.life >= p.maxLife || p.y < -30) {
          particles.splice(i, 1);
          continue;
        }

        if (p.type === 'petal') {
          drawPetal(ctx, p.x, p.y, p.size, currentAlpha, p.rotation, p.color);
        } else {
          drawSparkle(ctx, p.x, p.y, p.size, currentAlpha, p.color);
        }
      }

      rafId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId.current);
      window.removeEventListener('resize', setSize);
    };
  }, [preset, customRiseSpeed, customColors, customMaxCount]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 5 }}
    />
  );
}
