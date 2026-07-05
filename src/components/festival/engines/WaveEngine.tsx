'use client';

import { useEffect, useRef } from 'react';

interface WaveConfig {
  waveCount: number;
  amplitude: number;
  frequency: number;
  speed: number;
  colors: string[]; // [Water Color, Glow Color, Reflection Color]
  showReflection: boolean;
  reflectionWidth: number;
}

const DEFAULT_WAVE: WaveConfig = {
  waveCount: 3,
  amplitude: 15,
  frequency: 0.01,
  speed: 0.03,
  colors: ['#1e3a8a', '#3b82f6', '#60a5fa'],
  showReflection: true,
  reflectionWidth: 80,
};

const WAVE_PRESETS: Record<string, { default: Partial<WaveConfig> }> = {
  KARWA_CHAUTH: {
    default: {
      waveCount: 2,
      amplitude: 10,
      frequency: 0.008,
      speed: 0.02,
      colors: ['#0f172a', '#1e293b', '#cbd5e1'], // Moonlight silver ripples
      showReflection: true,
      reflectionWidth: 60,
    }
  },
  CHHATH_PUJA: {
    default: {
      waveCount: 4,
      amplitude: 18,
      frequency: 0.012,
      speed: 0.04,
      colors: ['#7c2d12', '#ea580c', '#fbbf24'], // Saffron/Orange sunset waves
      showReflection: true,
      reflectionWidth: 100,
    }
  },
  DEV_DEEPAWALI: {
    default: {
      waveCount: 3,
      amplitude: 14,
      frequency: 0.01,
      speed: 0.03,
      colors: ['#451a03', '#b45309', '#fef08a'], // Shimmering golden ghat reflections
      showReflection: true,
      reflectionWidth: 120,
    }
  },
  GURU_NANAK_JAYANTI: {
    default: {
      waveCount: 3,
      amplitude: 12,
      frequency: 0.009,
      speed: 0.025,
      colors: ['#1c1917', '#78350f', '#fef08a'],
      showReflection: true,
      reflectionWidth: 90,
    }
  }
};

export default function WaveEngine({
  preset,
  customAmplitude,
  customSpeed,
  customColors,
  customShowReflection,
}: {
  preset?: string;
  customAmplitude?: number;
  customSpeed?: number;
  customColors?: string[];
  customShowReflection?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafId = useRef<number>(0);
  const offsetRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const activePreset = WAVE_PRESETS[preset || ''] || { default: DEFAULT_WAVE };
    const config: WaveConfig = {
      ...DEFAULT_WAVE,
      ...activePreset.default,
      ...(customAmplitude !== undefined && { amplitude: customAmplitude }),
      ...(customSpeed !== undefined && { speed: customSpeed }),
      ...(customColors && { colors: customColors }),
      ...(customShowReflection !== undefined && { showReflection: customShowReflection }),
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

      offsetRef.current += config.speed;

      // लहरें नीचे 30% हिस्से में रेंडर होंगी
      const baseHeight = h * 0.75;

      // 1. पानी का बैकग्राउंड रिफ्लेक्शन बेस
      if (config.showReflection) {
        ctx.save();
        const refGrad = ctx.createLinearGradient(w / 2 - config.reflectionWidth, baseHeight, w / 2 + config.reflectionWidth, baseHeight);
        refGrad.addColorStop(0, 'rgba(0,0,0,0)');
        refGrad.addColorStop(0.5, config.colors[2] + '33'); // 20% Opacity
        refGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = refGrad;
        ctx.fillRect(w / 2 - config.reflectionWidth * 1.5, baseHeight, config.reflectionWidth * 3, h - baseHeight);
        ctx.restore();
      }

      // 2. लहरें बनाना (Wave Layering)
      for (let i = 0; i < config.waveCount; i++) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, h);

        const currentOffset = offsetRef.current * (1 + i * 0.2);
        const currentAmp = config.amplitude * (1 - i * 0.15);

        for (let x = 0; x <= w; x += 5) {
          const y = baseHeight + i * 12 + Math.sin(x * config.frequency + currentOffset) * currentAmp;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(w, h);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, baseHeight, 0, h);
        grad.addColorStop(0, config.colors[Math.min(i, config.colors.length - 1)] + 'cc'); // Soft opacity at top
        grad.addColorStop(1, config.colors[0]);

        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      }

      rafId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId.current);
      window.removeEventListener('resize', setSize);
    };
  }, [preset, customAmplitude, customSpeed, customColors, customShowReflection]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 3 }} />;
}
