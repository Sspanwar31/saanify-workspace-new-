'use client';

import { useEffect, useRef } from 'react';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TYPES
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

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
  colors: string[]; // [Inner Glow, Outer Glow, Rays]
  rotationSpeed: number;
  showDust: boolean;
  dustColor: string;
  beamIntensity: number;
}

interface RayPresetConfig {
  default: Partial<RayEngineConfig>;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   DEFAULT CONFIGURATION
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const DEFAULT_RAY_CONFIG: RayEngineConfig = {
  rayCount: 12,
  rayLength: 160,
  pulseSpeed: 1.5,
  colors: ['#ffe066', '#f59e0b', '#d97706'], // Rich Gold/Amber
  rotationSpeed: 0.002,
  showDust: true,
  dustColor: '#fbbf24',
  beamIntensity: 0.25,
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🚀 RAY PRESET MAP (Handles all Light/Aura Festivals)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const RAY_PRESET_MAP: Record<string, RayPresetConfig> = {
  // ── 1. DIWALI & DEV_DEEPAWALI (दीपक की समृद्ध दिव्य सुनहरी लौ) ──
  DIWALI: {
    default: {
      rayCount: 16,
      rayLength: 220,
      pulseSpeed: 1.2,
      colors: ['#fff9db', '#f59e0b', '#b45309'],
      rotationSpeed: 0.0015,
      showDust: true,
      dustColor: '#fbbf24',
      beamIntensity: 0.35,
    }
  },
  DEV_DEEPAWALI: {
    default: {
      rayCount: 14,
      rayLength: 200,
      pulseSpeed: 1.2,
      colors: ['#fff9db', '#f59e0b', '#b45309'],
      rotationSpeed: 0.0015,
      showDust: true,
      dustColor: '#fbbf24',
      beamIntensity: 0.3,
    }
  },

  // ── 2. RAM_NAVAMI (सूर्यवंशी राम का दिव्य तेज - भगवा/स्वर्णिम किरणें) ──
  RAM_NAVAMI: {
    default: {
      rayCount: 24, // घनी किरणें (Divine Halo)
      rayLength: 260,
      pulseSpeed: 2.0,
      colors: ['#fffbeb', '#ff781f', '#ea580c'], // Saffron/Gold
      rotationSpeed: 0.004,
      showDust: true,
      dustColor: '#f97316',
      beamIntensity: 0.45,
    }
  },

  // ── 3. PONGAL & CHHATH (सौर ऊर्जा - उगते सूरज की किरणें) ──
  PONGAL: {
    default: {
      rayCount: 20,
      rayLength: 240,
      pulseSpeed: 1.8,
      colors: ['#fffbeb', '#f97316', '#dc2626'], // Sunfire Red/Orange
      rotationSpeed: -0.003, // Opposite rotation
      showDust: true,
      dustColor: '#fbbf24',
      beamIntensity: 0.4,
    }
  },

  // ── 4. KARWA_CHAUTH & EID (चाँद की शीतल और रहस्यमयी किरणें) ──
  KARWA_CHAUTH: {
    default: {
      rayCount: 8, // कम और कोमल किरणें
      rayLength: 180,
      pulseSpeed: 0.8, // बहुत ही शांत पल्स
      colors: ['#f8fafc', '#cbd5e1', '#94a3b8'], // Moonlight Silver
      rotationSpeed: 0.0005,
      showDust: true,
      dustColor: '#cbd5e1',
      beamIntensity: 0.15,
    }
  },
  EID_UL_FITR: {
    default: {
      rayCount: 10,
      rayLength: 200,
      pulseSpeed: 1.0,
      colors: ['#ecfdf5', '#10b981', '#047857'], // Emerald Green/Lunar Glow
      rotationSpeed: 0.001,
      showDust: true,
      dustColor: '#34d399',
      beamIntensity: 0.2,
    }
  },
  EID_AL_ADHA: {
    default: {
      rayCount: 10,
      rayLength: 200,
      pulseSpeed: 1.0,
      colors: ['#ecfdf5', '#10b981', '#047857'],
      rotationSpeed: 0.001,
      showDust: true,
      dustColor: '#34d399',
      beamIntensity: 0.2,
    }
  },

  // ── 5. GURU_NANAK_JAYANTI (पवित्र और शांत गुरु-तेज) ──
  GURU_NANAK_JAYANTI: {
    default: {
      rayCount: 12,
      rayLength: 190,
      pulseSpeed: 1.0,
      colors: ['#ffffff', '#fbbf24', '#d97706'],
      rotationSpeed: 0.001,
      showDust: true,
      dustColor: '#fef08a',
      beamIntensity: 0.25,
    }
  },

  // ── 6. BROADCASTS (EMERGENCY & ANNOUNCEMENT) ──
  EMERGENCY: {
    default: {
      rayCount: 6,
      rayLength: 300,
      pulseSpeed: 3.5, // तेजी से चमकेगा (Flashing Alert)
      colors: ['#ffffff', '#dc2626', '#991b1b'], // Urgent Red Alert
      rotationSpeed: 0.015,
      showDust: false,
      dustColor: '#ef4444',
      beamIntensity: 0.6,
    }
  },
  ANNOUNCEMENT: {
    default: {
      rayCount: 4,
      rayLength: 220,
      pulseSpeed: 1.5,
      colors: ['#eff6ff', '#3b82f6', '#1d4ed8'], // Corporate Blue Aura
      rotationSpeed: 0.002,
      showDust: false,
      dustColor: '#60a5fa',
      beamIntensity: 0.2,
    }
  }
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MAIN COMPONENT
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

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

    // 🚀 मर्ज प्राथमिकता: System Default <- Preset Default <- Backend DB Live values
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

    // ── VOLUMETRIC RAYS GENERATOR ──
    const initRays = () => {
      const tempRays: LightRay[] = [];
      for (let i = 0; i < config.rayCount; i++) {
        tempRays.push({
          angle: (i / config.rayCount) * Math.PI * 2,
          width: 0.15 + Math.random() * 0.25,
          length: config.rayLength * (0.85 + Math.random() * 0.3),
          speed: (0.5 + Math.random() * 0.5) * 0.005,
          opacity: 0.1 + Math.random() * 0.4,
        });
      }
      raysRef.current = tempRays;
    };
    initRays();

    // ── FLOATING SPARKLING DUST GENERATOR ──
    const initDust = () => {
      if (!config.showDust) return;
      const tempDust: SparkleDust[] = [];
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;
      for (let i = 0; i < 35; i++) {
        tempDust.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -0.15 - Math.random() * 0.3,
          size: 1 + Math.random() * 2.5,
          alpha: 0.2 + Math.random() * 0.8,
          speed: 0.02 + Math.random() * 0.04,
        });
      }
      dustRef.current = tempDust;
    };
    initDust();

    /* ── ANIMATE LOOP ── */
    const animate = () => {
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      // 1. कोमल पल्सिंग वैल्यू कैलकुलेशन (Smooth sine pulsation)
      pulseTime.current += 0.015 * config.pulseSpeed;
      const pulseScale = 0.94 + Math.sin(pulseTime.current) * 0.06;

      // 2. रोटेशन अपडेट
      rotationOffset.current += config.rotationSpeed;

      // 3. एम्बिएंट और कोरोना ग्लो ड्रा (Radial Glow Gradients)
      const innerColor = config.colors[0];
      const midColor = config.colors[1];
      const outerColor = config.colors[2] || 'transparent';

      ctx.save();
      const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, config.rayLength * 1.1 * pulseScale);
      glowGrad.addColorStop(0, innerColor);
      glowGrad.addColorStop(0.2, innerColor);
      glowGrad.addColorStop(0.5, midColor + '40'); // Opacity 25%
      glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, config.rayLength * 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 4. दिव्य किरणों का रेंडरिंग (Volumetric Ray Beams)
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      
      for (const ray of raysRef.current) {
        const finalAngle = ray.angle + rotationOffset.current;
        const currentLength = ray.length * pulseScale;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        
        // शंक्वाकार किरण का निर्माण (Cone representation of God Rays)
        const p1x = cx + Math.cos(finalAngle - ray.width) * currentLength;
        const p1y = cy + Math.sin(finalAngle - ray.width) * currentLength;
        const p2x = cx + Math.cos(finalAngle + ray.width) * currentLength;
        const p2y = cy + Math.sin(finalAngle + ray.width) * currentLength;

        ctx.lineTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        ctx.closePath();

        const rayGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, currentLength);
        rayGrad.addColorStop(0, innerColor + 'cc'); // 80% opacity
        rayGrad.addColorStop(0.3, midColor + '2b'); // 17% opacity
        rayGrad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = rayGrad;
        ctx.fill();
      }
      ctx.restore();

      // 5. उड़ते हुए दिव्य कण (Floating Sparkles)
      if (config.showDust) {
        ctx.save();
        for (const d of dustRef.current) {
          d.y += d.vy;
          d.x += d.vx;
          
          // झिलमिलाता प्रभाव (Twinkle twinkle)
          d.alpha += Math.sin(pulseTime.current * 1.5 + d.x) * d.speed;
          const finalAlpha = Math.max(0.1, Math.min(1, d.alpha));

          // रीसेट स्क्रीन से बाहर जाने पर
          if (d.y < -10) {
            d.y = h + 10;
            d.x = Math.random() * w;
          }

          ctx.fillStyle = config.dustColor;
          ctx.globalAlpha = finalAlpha * 0.6;
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
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 4, mixBlendMode: 'screen' }}
    />
  );
} 
