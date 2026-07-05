'use client';

import { useEffect, useRef } from 'react';

interface SmokeParticle {
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

interface SmokeConfig {
  spawnRate: number;
  riseSpeed: number;
  colors: string[];
  maxCount: number;
  wind: number;
  expandRate: number;
}

const DEFAULT_SMOKE: SmokeConfig = {
  spawnRate: 0.15,
  riseSpeed: -0.8,
  colors: ['#e2e8f0', '#cbd5e1', '#94a3b8'],
  maxCount: 60,
  wind: 0.1,
  expandRate: 0.4,
};

const SMOKE_PRESETS: Record<string, { default: Partial<SmokeConfig> }> = {
  DURGA_PUJA: {
    default: { spawnRate: 0.25, riseSpeed: -1.2, colors: ['#f1f5f9', '#e2e8f0', '#ffe0b2'], maxCount: 80, wind: 0.2, expandRate: 0.5 }
  },
  MAHASHIVRATRI: {
    default: { spawnRate: 0.1, riseSpeed: -0.3, colors: ['#1e1b4b', '#4c1d95', '#86198f', '#0284c7'], maxCount: 40, wind: -0.05, expandRate: 0.25 }
  }
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
  const particles = useRef<SmokeParticle[]>([]);
  const rafId = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const activePreset = SMOKE_PRESETS[preset || ''] || { default: DEFAULT_SMOKE };
    const config: SmokeConfig = {
      ...DEFAULT_SMOKE,
      ...activePreset.default,
      ...(customRiseSpeed !== undefined && { riseSpeed: customRiseSpeed }),
      ...(customColors && { colors: customColors }),
      ...(customMaxCount !== undefined && { maxCount: customMaxCount }),
    };

    const setSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setSize();
    window.addEventListener('resize', setSize);

    const animate = () => {
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;
      ctx.clearRect(0, 0, w, h);

      // धुआं नीचे से ऊपर उठेगा
      const spawnX = w / 2;
      const spawnY = h + 20;

      if (particles.current.length < config.maxCount && Math.random() < config.spawnRate) {
        particles.current.push({
          x: spawnX + (Math.random() - 0.5) * 40,
          y: spawnY,
          vx: (Math.random() - 0.5) * 0.4,
          vy: config.riseSpeed * (0.8 + Math.random() * 0.4),
          size: 25 + Math.random() * 20,
          alpha: 0.1 + Math.random() * 0.25,
          life: 0,
          maxLife: 150 + Math.random() * 100,
          color: config.colors[Math.floor(Math.random() * config.colors.length)],
        });
      }

      particles.current = particles.current.filter(p => {
        p.life += 1;
        p.vy *= 0.99;
        p.vx += config.wind * 0.05 + (Math.random() - 0.5) * 0.02;
        p.x += p.vx;
        p.y += p.vy;
        p.size += config.expandRate;

        const lifeRatio = p.life / p.maxLife;
        const currentAlpha = p.alpha * (1 - lifeRatio);

        if (p.life < p.maxLife && p.y > -p.size && currentAlpha > 0.005) {
          ctx.save();
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          grad.addColorStop(0, p.color + Math.floor(currentAlpha * 255).toString(16).padStart(2, '0'));
          grad.addColorStop(0.5, p.color + Math.floor(currentAlpha * 128).toString(16).padStart(2, '0'));
          grad.addColorStop(1, p.color + '00');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
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
  }, [preset, customRiseSpeed, customColors, customMaxCount]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 3 }} />;
}
