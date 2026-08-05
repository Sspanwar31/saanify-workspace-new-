'use client';

import { useEffect, useRef } from 'react';

interface LightRay {
  angle: number;
  width: number;
  length: number;
  speed: number;
  opacity: number;
}

interface SparkleDust {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  speed: number;
}

interface RayEngineConfig {
  rayCount: number;
  rayLength: number;
  pulseSpeed: number;
  colors: string[]; 
  rotationSpeed: number;
  showDust: boolean;
  dustColor: string;
  beamIntensity: number;
}

interface RayPresetConfig {
  default: Partial<RayEngineConfig>;
}

const DEFAULT_RAY_CONFIG: RayEngineConfig = {
  rayCount: 12,
  rayLength: 400,
  pulseSpeed: 1.5,
  colors: ['rgba(255,224,102,0.1)', '#f59e0b', '#d97706'],
  rotationSpeed: 0.001,
  showDust: true,
  dustColor: '#fbbf24',
  beamIntensity: 0.15,
};

const RAY_PRESET_MAP: Record<string, RayPresetConfig> = {
  RAM_NAVAMI: {
    default: {
      rayCount: 16,
      rayLength: 450,
      pulseSpeed: 1.5,
      colors: ['rgba(255,251,235,0.15)', '#ff781f', '#ea580c'],
      rotationSpeed: 0.001,
      showDust: true,
      dustColor: '#ffd700',
      beamIntensity: 0.2,
    }
  },
  PONGAL: {
    default: {
      rayCount: 14,
      rayLength: 400,
      pulseSpeed: 1.8,
      colors: ['rgba(255,251,235,0.15)', '#f97316', '#dc2626'],
      rotationSpeed: -0.001,
      showDust: true,
      dustColor: '#fbbf24',
      beamIntensity: 0.2,
    }
  },
  EID_UL_FITR: {
    default: {
      rayCount: 10,
      rayLength: 350,
      pulseSpeed: 1.0,
      colors: ['rgba(236,253,245,0.12)', '#10b981', '#047857'],
      rotationSpeed: 0.001,
      showDust: true,
      dustColor: '#34d399',
      beamIntensity: 0.15,
    }
  },
  EID_AL_ADHA: {
    default: {
      rayCount: 10,
      rayLength: 350,
      pulseSpeed: 1.0,
      colors: ['rgba(236,253,245,0.12)', '#10b981', '#047857'],
      rotationSpeed: 0.001,
      showDust: true,
      dustColor: '#34d399',
      beamIntensity: 0.15,
    }
  },
  REPUBLIC_DAY: {
    default: {
      rayCount: 14,
      rayLength: 400,
      pulseSpeed: 1.6,
      colors: ['rgba(255,153,51,0.15)', '#ffffff', '#128807'],
      rotationSpeed: 0.001,
      showDust: true,
      dustColor: '#ffffff',
      beamIntensity: 0.2,
    }
  },
  INDEPENDENCE_DAY: {
    default: {
      rayCount: 14,
      rayLength: 400,
      pulseSpeed: 1.6,
      colors: ['rgba(255,153,51,0.15)', '#ffffff', '#128807'],
      rotationSpeed: 0.001,
      showDust: true,
      dustColor: '#ffffff',
      beamIntensity: 0.2,
    }
  }
};

export default function RayEngine({
  preset,
  customRayCount,
  customRayLength,
  customPulseSpeed,
  customColors,
  customRotationSpeed,
  customShowDust,
}: {
  preset?: string;
  customRayCount?: number;
  customRayLength?: number;
  customPulseSpeed?: number;
  customColors?: string[];
  customRotationSpeed?: number;
  customShowDust?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raysRef = useRef<LightRay[]>([]);
  const dustRef = useRef<SparkleDust[]>([]);
  const rafId = useRef<number>(0);
  const rotationOffset = useRef<number>(0);
  const pulseTime = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const normalizedPreset = (preset || '').toUpperCase().trim();
    const activePresetObj = RAY_PRESET_MAP[normalizedPreset] || { default: DEFAULT_RAY_CONFIG };

    const config: RayEngineConfig = {
      ...DEFAULT_RAY_CONFIG,
      ...activePresetObj.default,
      ...(customRayCount !== undefined && { rayCount: customRayCount }),
      ...(customRayLength !== undefined && { rayLength: customRayLength }),
      ...(customPulseSpeed !== undefined && { pulseSpeed: customPulseSpeed }),
      ...(customColors && { colors: customColors }),
      ...(customRotationSpeed !== undefined && { rotationSpeed: customRotationSpeed }),
      ...(customShowDust !== undefined && { showDust: customShowDust }),
    };

    const setSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setSize();
    window.addEventListener('resize', setSize);

    const initRays = () => {
      const tempRays: LightRay[] = [];
      for (let i = 0; i < config.rayCount; i++) {
        tempRays.push({
          angle: (i / config.rayCount) * Math.PI * 2,
          width: 0.08 + Math.random() * 0.12,
          length: config.rayLength * (0.8 + Math.random() * 0.3),
          speed: (0.5 + Math.random() * 0.5) * 0.002,
          opacity: 0.05 + Math.random() * 0.15,
        });
      }
      raysRef.current = tempRays;
    };
    initRays();

    const initDust = () => {
      if (!config.showDust) return;
      const tempDust: SparkleDust[] = [];
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;
      for (let i = 0; i < 85; i++) {
        tempDust.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -0.15 - Math.random() * 0.3,
          size: 1.5 + Math.random() * 3.2,
          alpha: 0.2 + Math.random() * 0.8,
          speed: 0.02 + Math.random() * 0.04,
        });
      }
      dustRef.current = tempDust;
    };
    initDust();

    const animate = () => {
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;

      ctx.clearRect(0, 0, w, h);

      pulseTime.current += 0.012 * config.pulseSpeed;
      rotationOffset.current += config.rotationSpeed;

      // 🚀 SURAJ / CENTER GLOW HAS BEEN REMOVED PERMANENTLY!
      // Ab Center mein koi dhabba nahi aayega. 

      // ✨ ONLY FLOATING SPARKLE PARTICLES ARE DRAWN
      if (config.showDust) {
        ctx.save();
        for (const d of dustRef.current) {
          d.y += d.vy;
          d.x += d.vx;
          
          d.alpha += Math.sin(pulseTime.current * 2 + d.x) * d.speed;
          const finalAlpha = Math.max(0.1, Math.min(1, d.alpha));

          if (d.y < -10) {
            d.y = h + 10;
            d.x = Math.random() * w;
          }

          ctx.shadowBlur = 6;
          ctx.shadowColor = config.dustColor;
          ctx.fillStyle = config.dustColor;
          ctx.globalAlpha = finalAlpha * 0.85;
          
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      rafId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId.current);
      window.removeEventListener('resize', setSize);
    };
  }, [preset, customRayCount, customRayLength, customPulseSpeed, customColors, customRotationSpeed, customShowDust]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
