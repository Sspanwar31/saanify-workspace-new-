'use client';

import { useEffect, useRef } from 'react';

interface NeonConfig {
  ringCount: number;
  radius: number;
  speed: number;
  colors: string[];
  glowIntensity: number;
  trailLength: number; // 0.1 to 1.0
  spiral: boolean;
}

const DEFAULT_NEON: NeonConfig = {
  ringCount: 2,
  radius: 120,
  speed: 0.03,
  colors: ['#00f5d4', '#8338ec'],
  glowIntensity: 15,
  trailLength: 0.4,
  spiral: false,
};

const NEON_PRESETS: Record<string, { default: Partial<NeonConfig> }> = {
  GANESH_CHATURTHI: {
    default: { ringCount: 3, radius: 110, speed: 0.02, colors: ['#f97316', '#fbbf24', '#ffffff'], glowIntensity: 20, spiral: true }
  },
  HANUMAN_JAYANTI: {
    default: { ringCount: 2, radius: 130, speed: 0.04, colors: ['#dc2626', '#f97316'], glowIntensity: 25, spiral: false }
  },
  NAVRATRI: {
    default: { ringCount: 4, radius: 100, speed: -0.025, colors: ['#ff006e', '#ffbe0b', '#00f5d4'], glowIntensity: 15, spiral: true }
  },
  REPUBLIC_DAY: {
    default: { ringCount: 3, radius: 140, speed: 0.015, colors: ['#ff9933', '#ffffff', '#128807'], glowIntensity: 12, spiral: false }
  },
  INDEPENDENCE_DAY: {
    default: { ringCount: 3, radius: 140, speed: 0.015, colors: ['#ff9933', '#ffffff', '#128807'], glowIntensity: 12, spiral: false }
  }
};

export default function NeonEngine({
  preset,
  customRadius,
  customSpeed,
  customColors,
  customGlow,
}: {
  preset?: string;
  customRadius?: number;
  customSpeed?: number;
  customColors?: string[];
  customGlow?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafId = useRef<number>(0);
  const angleRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const activePreset = NEON_PRESETS[preset || ''] || { default: DEFAULT_NEON };
    const config: NeonConfig = {
      ...DEFAULT_NEON,
      ...activePreset.default,
      ...(customRadius !== undefined && { radius: customRadius }),
      ...(customSpeed !== undefined && { speed: customSpeed }),
      ...(customColors && { colors: customColors }),
      ...(customGlow !== undefined && { glowIntensity: customGlow }),
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
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);
      angleRef.current += config.speed;

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.shadowBlur = config.glowIntensity;

      for (let i = 0; i < config.ringCount; i++) {
        const ringAngle = angleRef.current * (1 + i * 0.1) + (i * Math.PI) / 3;
        const color = config.colors[i % config.colors.length];
        const rad = config.radius * (1 + (config.spiral ? i * 0.15 : 0));

        ctx.shadowColor = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;

        ctx.beginPath();
        // घुमावदार नियॉन ट्रेल बनाना
        ctx.arc(cx, cy, rad, ringAngle, ringAngle + Math.PI * 2 * config.trailLength);
        ctx.stroke();

        // ट्रेल के आगे चमकदार गोल बिंदु (Neon Head)
        const headX = cx + Math.cos(ringAngle + Math.PI * 2 * config.trailLength) * rad;
        const headY = cy + Math.sin(ringAngle + Math.PI * 2 * config.trailLength) * rad;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(headX, headY, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      rafId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId.current);
      window.removeEventListener('resize', setSize);
    };
  }, [preset, customRadius, customSpeed, customColors, customGlow]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 4 }} />;
}
