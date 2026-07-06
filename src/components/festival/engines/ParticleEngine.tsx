'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  rotation: number;
  rotationSpeed: number;
}

interface EngineConfig {
  gravity: number;
  spread: number;
  speed: number;
  colors: string[];
  minSize: number;
  maxSize: number;
  maxCount: number;
  glow: boolean;
  wobble: boolean;
  direction: 'radial' | 'upward' | 'downward' | 'spiral';
  spawnY?: number; 
}

interface PresetConfig {
  default: Partial<EngineConfig>;
  phases?: Record<string, Partial<EngineConfig>>;
}

const PhaseBehavior: Record<string, { intensity: number; spawnRate: number }> = {
  IDLE:           { intensity: 0.3,  spawnRate: 0.025 },
  AMBIENT:        { intensity: 0.8,  spawnRate: 0.08  }, 
  SHOOTING:       { intensity: 1.2,  spawnRate: 0.24  }, 
  FLASH:          { intensity: 1.5,  spawnRate: 0.65  }, 
  HANDOVER:       { intensity: 0.9,  spawnRate: 0.12  },
  ROCKET_LAUNCH:  { intensity: 1.5,  spawnRate: 0.65 }, 
  COLOR_DHAMAKA:  { intensity: 2.0,  spawnRate: 0.90 }, 
  GULAL_RAIN:     { intensity: 1.2,  spawnRate: 0.30 }, 
};

const DEFAULT: EngineConfig = {
  gravity: 0.15,
  spread: 1.0,
  speed: 1.0,
  colors: ['#ffffff', '#e2e8f0', '#94a3b8'],
  minSize: 2,
  maxSize: 5,
  maxCount: 40,
  glow: false,
  wobble: false,
  direction: 'radial',
};

const PRESET_MAP: Record<string, PresetConfig> = {
  LIQUID_SPLASH: {
    default: {
      gravity: 0.28, spread: 1.6, speed: 2.2,
      colors: ['#ff006e', '#ffbe0b', '#00f5d4', '#3a86ff', '#8338ec', '#fb5607'],
      minSize: 5, maxSize: 15, maxCount: 350, glow: false, wobble: true, direction: 'upward', spawnY: 0.75,
    },
    phases: {
      ROCKET:         { direction: 'upward',   spawnY: 0.9,  minSize: 10, maxSize: 25, speed: 3.5 },
      FIREWORK:       { direction: 'radial',   spawnY: 0.35, minSize: 5,  maxSize: 14, speed: 3.8 },
      FLASH:          { direction: 'radial',   spawnY: 0.35, minSize: 5,  maxSize: 14, speed: 3.8 },
      SHOOTING:       { direction: 'radial',   spawnY: 0.35, minSize: 5,  maxSize: 14, speed: 3.8 },
      ROCKET_LAUNCH:  { direction: 'upward',   spawnY: 0.9,  minSize: 10, maxSize: 25, speed: 1.9 },
      COLOR_DHAMAKA:  { direction: 'radial',   spawnY: 0.15, minSize: 6,  maxSize: 18, speed: 5.5 },
      GULAL_RAIN:     { direction: 'downward', spawnY: -0.1, minSize: 4,  maxSize: 12, speed: 1.5 },
      HANDOVER:       { direction: 'downward', spawnY: -0.05,minSize: 3,  maxSize: 7,  speed: 0.6 },
      AMBIENT:        { direction: 'downward', spawnY: -0.05,minSize: 3,  maxSize: 7,  speed: 0.6 },
    }
  },
  HOLI: {
    default: {
      gravity: 0.28, spread: 1.6, speed: 2.2,
      colors: ['#ff006e', '#ffbe0b', '#00f5d4', '#3a86ff', '#8338ec', '#fb5607'],
      minSize: 5, maxSize: 15, maxCount: 350, glow: false, wobble: true, direction: 'upward', spawnY: 0.75,
    },
    phases: {
      ROCKET:         { direction: 'upward',   spawnY: 0.9,  minSize: 10, maxSize: 25, speed: 3.5 },
      FIREWORK:       { direction: 'radial',   spawnY: 0.35, minSize: 5,  maxSize: 14, speed: 3.8 },
      FLASH:          { direction: 'radial',   spawnY: 0.35, minSize: 5,  maxSize: 14, speed: 3.8 },
      SHOOTING:       { direction: 'radial',   spawnY: 0.35, minSize: 5,  maxSize: 14, speed: 3.8 },
      ROCKET_LAUNCH:  { direction: 'upward',   spawnY: 0.9,  minSize: 10, maxSize: 25, speed: 1.9 },
      COLOR_DHAMAKA:  { direction: 'radial',   spawnY: 0.15, minSize: 6,  maxSize: 18, speed: 5.5 },
      GULAL_RAIN:     { direction: 'downward', spawnY: -0.1, minSize: 4,  maxSize: 12, speed: 1.5 },
      HANDOVER:       { direction: 'downward', spawnY: -0.05,minSize: 3,  maxSize: 7,  speed: 0.6 },
      AMBIENT:        { direction: 'downward', spawnY: -0.05,minSize: 3,  maxSize: 7,  speed: 0.6 },
    }
  },
  LOHRI: {
    default: {
      gravity: -0.04, spread: 0.9, speed: 1.5,
      colors: ['#ff6b35', '#ff4500', '#ffd700', '#ff8c00'],
      minSize: 2.5, maxSize: 6.5, maxCount: 150, glow: true, wobble: false, direction: 'upward', spawnY: 0.9,
    }
  },
  // 🚀 2027 MODERN PREMIUM SNOW CONFIG
  CHRISTMAS: {
    default: {
      gravity: 0.015,       // Bahut slow gravity (Floaty feel)
      spread: 1.8,          // Zyada spread = hawa mein dolna
      speed: 0.7,           // Slow speed
      colors: ['#ffffff', '#f8fafc', '#e2e8f0', '#cbd5e1'], // Subtle white shades
      minSize: 0.8,         // 🚀 Bohot chhota size (Ab mote nahi rahega)
      maxSize: 2.2,         // 🚀 Max bhi 2.2 tak
      maxCount: 900,        // 🚀 High density (Barf ki boondiya jaisa dense)
      glow: true,           // 🚀 Magical glow effect ke liye
      wobble: true,         // Smooth hawa ka jhukav
      direction: 'downward', 
      spawnY: -0.1,
    }
  },
  RAKSHA_BANDHAN: {
    default: {
      gravity: 0.18, spread: 1.5, speed: 2.5,
      colors: ['#a855f7', '#ec4899', '#f43f5e', '#eab308', '#3b82f6', '#10b981'],
      minSize: 4, maxSize: 10, maxCount: 220, glow: false, wobble: true, direction: 'radial', spawnY: 0.4,
    }
  },
  MAKAR_SANKRANTI: {
    default: {
      gravity: 0.02, spread: 0.8, speed: 0.6,
      colors: ['#38bdf8', '#fbbf24', '#f43f5e', '#34d399'],
      minSize: 3, maxSize: 7, maxCount: 80, glow: false, wobble: true, direction: 'downward', spawnY: -0.05,
    }
  },
  SPECIAL_OFFER: {
    default: {
      gravity: 0.08, spread: 1.2, speed: 1.4,
      colors: ['#ec4899', '#f43f5e', '#fda4af', '#e11d48'],
      minSize: 4, maxSize: 9, maxCount: 120, glow: true, wobble: true, direction: 'radial', spawnY: 0.5,
    }
  }
};

export default function ParticleEngine({ 
  preset, 
  phase = 'IDLE',
  customGravity,
  customSpeed,
  customColors,
  customMinSize,
  customMaxSize,
  customMaxCount
}: { 
  preset?: string; 
  phase?: string; 
  customGravity?: number;
  customSpeed?: number;
  customColors?: string[];
  customMinSize?: number;
  customMaxSize?: number;
  customMaxCount?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const rafId = useRef<number>(0);
  const phaseRef = useRef(phase);

  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const activePresetObj = PRESET_MAP[preset || ''] || { default: DEFAULT };

    const config: EngineConfig = { 
      ...DEFAULT, 
      ...activePresetObj.default,
      ...(customGravity !== undefined && { gravity: customGravity }),
      ...(customSpeed !== undefined && { speed: customSpeed }),
      ...(customColors && { colors: customColors }),
      ...(customMinSize !== undefined && { minSize: customMinSize }),
      ...(customMaxSize !== undefined && { maxSize: customMaxSize }),
      ...(customMaxCount !== undefined && { maxCount: customMaxCount }),
    };

    let w = 0;
    let h = 0;

    const setSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      w = rect.width > 0 ? rect.width : window.innerWidth;
      h = rect.height > 0 ? rect.height : window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setSize();
    window.addEventListener('resize', setSize);

    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    const spawn = (): Particle => {
      const phaseConfig = activePresetObj.phases?.[phaseRef.current] || {};

      let currentDirection = phaseConfig.direction || config.direction;
      let currentSpawnY    = phaseConfig.spawnY !== undefined ? phaseConfig.spawnY : (config.spawnY || 0.5);
      let currentMinSize   = phaseConfig.minSize || config.minSize;
      let currentMaxSize   = phaseConfig.maxSize || config.maxSize;
      let currentSpeed     = phaseConfig.speed || config.speed;

      const cx = w / 2;
      const cy = h * currentSpawnY; 
      const spd = currentSpeed * rand(0.4, 1.3); 
      const size = rand(currentMinSize, currentMaxSize); 
      const angle = Math.random() * Math.PI * 2;

      let vx = 0;
      let vy = 0;

      switch (currentDirection) {
        case 'upward':   vx = rand(-1, 1) * spd * config.spread * 1.2; vy = -spd * rand(1.2, 2.8) * config.spread; break;
        case 'downward': vx = rand(-1, 1) * spd * config.spread; vy = spd * rand(0.5, 1.5) * config.spread; break;
        case 'spiral':   vx = Math.cos(angle + particles.current.length * 0.4) * spd * config.spread; vy = Math.sin(angle + particles.current.length * 0.4) * spd * config.spread; break;
        case 'radial':
        default:         vx = Math.cos(angle) * spd * config.spread * 2; vy = Math.sin(angle) * spd * config.spread * 2;
      }

      const spawnX = currentDirection === 'downward' ? rand(0, w) : cx + rand(-20, 20);

      let baseMaxLife = 110;
      if (currentDirection === 'downward') {
         baseMaxLife = Math.max(350, Math.floor(h / (currentSpeed * 0.8))); 
      }

      return {
        x: spawnX,
        y: cy + rand(-10, 10),
        vx, vy, size,
        color: pick(config.colors),
        life: rand(baseMaxLife * 0.6, baseMaxLife),
        maxLife: baseMaxLife,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: rand(-0.1, 0.1),
      };
    };

    // 🚀 2027 PREMIUM DRAW FUNCTION
    const draw = (p: Particle) => {
      const progress = 1 - p.life / p.maxLife;
      
      // Smooth fade-in aur fade-out
      const alpha = Math.max(0, 1 - (progress * progress));

      ctx.save();
      ctx.globalAlpha = alpha * 0.85; // Thoda transparent rakhne se dust jaisa feel aata hai
      
      // 🚀 MODERN GLOW: Agar glow true hai toh 'lighter' blend mode use karo
      // Jab particles ek dusre se overlap karenge toh ek beautiful soft glow banega
      if (config.glow) {
        ctx.globalCompositeOperation = 'lighter';
      }

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const animate = () => {
      const pb = PhaseBehavior[phaseRef.current] || PhaseBehavior.IDLE;

      ctx.clearRect(0, 0, w, h);

      const rawCount = config.maxCount;
      const Math_floor = Math.floor(rawCount * pb.intensity);
      
      const currentSpawnRate = preset === 'CHRISTMAS' ? 0.45 : pb.spawnRate; // Fast spawn for dense snow

      if (particles.current.length < Math_floor && Math.random() < currentSpawnRate) {
        particles.current.push(spawn());
      }

      particles.current = particles.current.filter(p => {
        p.vy += config.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        p.rotation += p.rotationSpeed;
        p.vx *= 0.998; // 🚀 Thoda slow friction for smooth floating
        p.vy *= 0.998;

        // 🚀 SMOOTH WOBBLE: Ab har size par chalega (p.size > 5 wala condition hata diya)
        // Yeh snow ko naturally hawa mein dolne dega
        if (config.wobble) {
          p.vx += Math.sin(p.life * 0.05 + p.y * 0.01) * 0.08;
        }

        if (p.life > 0 && p.y < h + 60 && p.x > -60 && p.x < w + 60) {
          draw(p);
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
      particles.current = [];
    };
  }, [preset]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 9999 }}
    />
  );
}
