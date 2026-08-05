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
  rayCount: 16,
  rayLength: 500,
  pulseSpeed: 1.5,
  colors: ['rgba(255,224,102,0.2)', '#f59e0b', '#d97706'],
  rotationSpeed: 0.001,
  showDust: true,
  dustColor: '#fbbf24',
  beamIntensity: 0.25,
};

const RAY_PRESET_MAP: Record<string, RayPresetConfig> = {
  // ── 1. RAM_NAVAMI (स्वर्णिम सूर्यवंशी दिव्य किरणें) ──
  RAM_NAVAMI: {
    default: {
      rayCount: 22,
      rayLength: 600,
      pulseSpeed: 1.5,
      colors: ['rgba(255,251,235,0.25)', '#ff781f', '#ea580c'],
      rotationSpeed: 0.0015,
      showDust: true,
      dustColor: '#ffd700',
      beamIntensity: 0.3,
    }
  },

  // ── 2. PONGAL ──
  PONGAL: {
    default: {
      rayCount: 18,
      rayLength: 550,
      pulseSpeed: 1.8,
      colors: ['rgba(255,251,235,0.2)', '#f97316', '#dc2626'],
      rotationSpeed: -0.0015,
      showDust: true,
      dustColor: '#fbbf24',
      beamIntensity: 0.3,
    }
  },

  // ── 3. EID AL-ADHA & EID_UL_FITR ──
  EID_UL_FITR: {
    default: {
      rayCount: 12,
      rayLength: 450,
      pulseSpeed: 1.0,
      colors: ['rgba(236,253,245,0.2)', '#10b981', '#047857'],
      rotationSpeed: 0.001,
      showDust: true,
      dustColor: '#34d399',
      beamIntensity: 0.2,
    }
  },
  EID_AL_ADHA: {
    default: {
      rayCount: 12,
      rayLength: 450,
      pulseSpeed: 1.0,
      colors: ['rgba(236,253,245,0.2)', '#10b981', '#047857'],
      rotationSpeed: 0.001,
      showDust: true,
      dustColor: '#34d399',
      beamIntensity: 0.2,
    }
  },

  // ── 4. REPUBLIC_DAY & INDEPENDENCE_DAY ──
  REPUBLIC_DAY: {
    default: {
      rayCount: 18,
      rayLength: 500,
      pulseSpeed: 1.6,
      colors: ['rgba(255,153,51,0.25)', '#ffffff', '#128807'],
      rotationSpeed: 0.001,
      showDust: true,
      dustColor: '#ffffff',
      beamIntensity: 0.25,
    }
  },
  INDEPENDENCE_DAY: {
    default: {
      rayCount: 18,
      rayLength: 500,
      pulseSpeed: 1.6,
      colors: ['rgba(255,153,51,0.25)', '#ffffff', '#128807'],
      rotationSpeed: 0.001,
      showDust: true,
      dustColor: '#ffffff',
      beamIntensity: 0.25,
    }
  },

  // ── 5. BROADCASTS ──
  EMERGENCY: {
    default: {
      rayCount: 8,
      rayLength: 600,
      pulseSpeed: 3.5,
      colors: ['rgba(255,255,255,0.3)', '#dc2626', '#991b1b'],
      rotationSpeed: 0.005,
      showDust: false,
      dustColor: '#ef4444',
      beamIntensity: 0.4,
    }
  },
  ANNOUNCEMENT: {
    default: {
      rayCount: 6,
      rayLength: 450,
      pulseSpeed: 1.5,
      colors: ['rgba(239,246,255,0.2)', '#3b82f6', '#1d4ed8'],
      rotationSpeed: 0.001,
      showDust: false,
      dustColor: '#60a5fa',
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

    const activePresetObj = RAY_PRESET_MAP[preset || ''] || { default: DEFAULT_RAY_CONFIG };

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
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setSize();
    window.addEventListener('resize', setSize);

    // 🚀 Rays angle downward from the top header
    const initRays = () => {
      const tempRays: LightRay[] = [];
      const angleSpread = Math.PI * 0.8; // Downward cone spread
      const startAngle = Math.PI * 0.1;

      for (let i = 0; i < config.rayCount; i++) {
        tempRays.push({
          angle: startAngle + (i / config.rayCount) * angleSpread,
          width: 0.08 + Math.random() * 0.15,
          length: config.rayLength * (0.8 + Math.random() * 0.4),
          speed: (0.5 + Math.random() * 0.5) * 0.003,
          opacity: 0.1 + Math.random() * 0.25,
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
      for (let i = 0; i < 90; i++) {
        tempDust.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -0.2 - Math.random() * 0.3,
          size: 1.5 + Math.random() * 3.5,
          alpha: 0.2 + Math.random() * 0.8,
          speed: 0.03 + Math.random() * 0.05,
        });
      }
      dustRef.current = tempDust;
    };
    initDust();

    const animate = () => {
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;

      // 🚀 TOP ORIGIN FIX: Ray origin moved to top-center of the screen!
      const cx = w / 2;
      const cy = -30; // Just above top banner

      ctx.clearRect(0, 0, w, h);

      pulseTime.current += 0.015 * config.pulseSpeed;
      const pulseScale = 0.95 + Math.sin(pulseTime.current) * 0.05;
      rotationOffset.current += config.rotationSpeed;

      const innerColor = config.colors[0];
      const midColor = config.colors[1];

      // 🌟 Subtle Divine Glow from Top Header
      ctx.save();
      const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 350 * pulseScale);
      glowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
      glowGrad.addColorStop(0.4, innerColor);
      glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 400, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ☀️ Downward Divine Rays (God Rays Effect)
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      
      const sweepOffset = Math.sin(pulseTime.current * 0.5) * 0.05;

      for (const ray of raysRef.current) {
        const finalAngle = ray.angle + sweepOffset;
        const currentLength = ray.length * pulseScale;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        
        const p1x = cx + Math.cos(finalAngle - ray.width) * currentLength;
        const p1y = cy + Math.sin(finalAngle - ray.width) * currentLength;
        const p2x = cx + Math.cos(finalAngle + ray.width) * currentLength;
        const p2y = cy + Math.sin(finalAngle + ray.width) * currentLength;

        ctx.lineTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        ctx.closePath();

        const rayGrad = ctx.createLinearGradient(cx, cy, p1x, p1y);
        rayGrad.addColorStop(0, 'rgba(255,255,255,0.2)');
        rayGrad.addColorStop(0.3, midColor + '20');
        rayGrad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = rayGrad;
        ctx.fill();
      }
      ctx.restore();

      // ✨ Floating Sparkles
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

          ctx.shadowBlur = 8;
          ctx.shadowColor = config.dustColor;
          ctx.fillStyle = config.dustColor;
          ctx.globalAlpha = finalAlpha * 0.8;
          
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
      style={{ zIndex: 0, mixBlendMode: 'screen' }}
    />
  );
}
