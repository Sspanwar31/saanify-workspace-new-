'use client';

import { useEffect, useRef } from 'react';

/* ═══════════════════════════════════════════════════════════════
   TYPES & CONSTANTS
   ═══════════════════════════════════════════════════════════════ */
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
  type: 'smoke' | 'ember';
}

interface PresetConfig {
  spawnRate: number;
  riseSpeed: number;
  colors: string[];
  maxCount: number;
  wind: number;
  expandRate: number;
}

const DEFAULT_COLORS = ['#e2e8f0', '#cbd5e1', '#94a3b8'];

const PRESET_COLORS: Record<string, string[]> = {
  DURGA_PUJA: ['#dc2626', '#ffd700', '#ff9900', '#ff4500', '#ffe0b2'],
  MAHASHIVRATRI: ['#4f46e5', '#4c1d95', '#38bdf8', '#e0f7ff', '#ffffff'],
};

const MASTER_PRESET_CONFIGS: Record<string, PresetConfig> = {
  DURGA_PUJA: {
    spawnRate: 0.35,
    riseSpeed: -1.2,
    colors: PRESET_COLORS.DURGA_PUJA,
    maxCount: 85,
    wind: 0.15,
    expandRate: 0.3,
  },
  MAHASHIVRATRI: {
    spawnRate: 0.3,
    riseSpeed: -0.8,
    colors: PRESET_COLORS.MAHASHIVRATRI,
    maxCount: 75,
    wind: -0.05,
    expandRate: 0.25,
  },
  DEFAULT: {
    spawnRate: 0.2,
    riseSpeed: -0.8,
    colors: DEFAULT_COLORS,
    maxCount: 60,
    wind: 0.1,
    expandRate: 0.3,
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

    // 1. Preset Normalization (Same as NeonEngine)
    const normalizedPreset = (preset || '').toUpperCase().trim();
    const presetConfig =
      MASTER_PRESET_CONFIGS[normalizedPreset] || MASTER_PRESET_CONFIGS.DEFAULT;

    const colors =
      customColors || PRESET_COLORS[normalizedPreset] || presetConfig.colors;
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

    // Sindoori / Gold Glowing Ember Drawing (Same high quality as NeonEngine)
    const drawEmber = (
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
      c.globalCompositeOperation = 'lighter';
      const grad = c.createRadialGradient(0, 0, 0, 0, 0, size * 1.5);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = grad;
      c.beginPath();
      c.arc(0, 0, size * 1.5, 0, Math.PI * 2);
      c.fill();
      c.restore();
    };

    // Smoke Cloud Drawing (Clean globalAlpha)
    const drawSmokeCloud = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      alpha: number,
      color: string
    ) => {
      c.save();
      c.globalAlpha = alpha;
      c.globalCompositeOperation = 'screen';
      const grad = c.createRadialGradient(x, y, 0, x, y, size);
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = grad;
      c.beginPath();
      c.arc(x, y, size, 0, Math.PI * 2);
      c.fill();
      c.restore();
    };

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);
      timeRef.current += 0.015;

      // 2. Full-Screen Spawning (Fixed single-center bug!)
      if (particles.length < maxParticles && Math.random() < presetConfig.spawnRate) {
        const isEmber = Math.random() < 0.4;
        particles.push({
          x: rn(-20, w + 20), // Spawns across full screen width!
          y: h + 25,
          vx: rn(-0.6, 0.6),
          vy: riseSpeed * rn(0.8, 1.3),
          size: isEmber ? rn(2, 5) : rn(22, 45),
          alpha: rn(0.3, 0.6),
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: rn(0, Math.PI * 2),
          rotSpeed: rn(-0.02, 0.02),
          life: 0,
          maxLife: rn(120, 220),
          type: isEmber ? 'ember' : 'smoke',
        });
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx + presetConfig.wind;
        p.y += p.vy;

        if (p.type === 'smoke') {
          p.size += presetConfig.expandRate;
        }

        const lt = p.life / p.maxLife;
        const currentAlpha = p.alpha * (1 - lt);

        if (p.life >= p.maxLife || p.y < -p.size * 2 || currentAlpha <= 0.005) {
          particles.splice(i, 1);
          continue;
        }

        if (p.type === 'ember') {
          drawEmber(ctx, p.x, p.y, p.size, currentAlpha, p.color);
        } else {
          drawSmokeCloud(ctx, p.x, p.y, p.size, currentAlpha, p.color);
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
      style={{ zIndex: 4 }}
    />
  );
}
