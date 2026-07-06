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
  // ── 1. HOLI / LIQUID SPLASH ──
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

  // ── 2. LOHRI ──
  LOHRI: {
    default: {
      gravity: -0.04, spread: 0.9, speed: 1.5,
      colors: ['#ff6b35', '#ff4500', '#ffd700', '#ff8c00'],
      minSize: 2.5, maxSize: 6.5, maxCount: 150, glow: true, wobble: false, direction: 'upward', spawnY: 0.9,
    }
  },

  // ── 3. CHRISTMAS (🚀 सुधार 2: घनी और खूबसूरत बर्फबारी के लिए हैवी पैरामीटर्स) ──
  CHRISTMAS: {
    default: {
      gravity: 0.04, spread: 0.9, speed: 1.2, // सुगम बहाव गति
      colors: ['#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0'],
      minSize: 2.5, maxSize: 7.5, maxCount: 450, glow: true, wobble: true, direction: 'downward', spawnY: -0.1,
    }
  },

  // ── 4. RAKSHA_BANDHAN ──
  RAKSHA_BANDHAN: {
    default: {
      gravity: 0.18, spread: 1.5, speed: 2.5,
      colors: ['#a855f7', '#ec4899', '#f43f5e', '#eab308', '#3b82f6', '#10b981'],
      minSize: 4, maxSize: 10, maxCount: 220, glow: false, wobble: true, direction: 'radial', spawnY: 0.4,
    }
  },

  // ── 5. MAKAR_SANKRANTI ──
  MAKAR_SANKRANTI: {
    default: {
      gravity: 0.02, spread: 0.8, speed: 0.6,
      colors: ['#38bdf8', '#fbbf24', '#f43f5e', '#34d399'],
      minSize: 3, maxSize: 7, maxCount: 80, glow: false, wobble: true, direction: 'downward', spawnY: -0.05,
    }
  },

  // ── 6. SPECIAL_OFFER (BROADCAST) ──
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

    const setSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      const actualWidth = rect.width > 0 ? rect.width : window.innerWidth;
      const actualHeight = rect.height > 0 ? rect.height : window.innerHeight;

      canvas.width = actualWidth * dpr;
      canvas.height = actualHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setSize();
    window.addEventListener('resize', setSize);

    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    const spawn = (): Particle => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width > 0 ? rect.width : window.innerWidth;
      const h = rect.height > 0 ? rect.height : window.innerHeight;

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

      return {
        x: cx + rand(-20, 20), y: cy + rand(-10, 10), vx, vy, size,
        color: pick(config.colors),
        life: rand(50, 110),
        maxLife: 110,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: rand(-0.1, 0.1),
      };
    };

    const draw = (p: Particle) => {
      const progress = 1 - p.life / p.maxLife;
      const alpha = Math.max(0, 1 - progress * progress);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();

      if (config.wobble && p.size > 5) {
        ctx.globalAlpha = alpha * 0.4;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-p.size * 0.25, -p.size * 0.25, p.size * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width > 0 ? rect.width : window.innerWidth;
      const h = rect.height > 0 ? rect.height : window.innerHeight;
      const pb = PhaseBehavior[phaseRef.current] || PhaseBehavior.IDLE;

      ctx.clearRect(0, 0, w, h);

      const rawCount = config.maxCount;
      const Math_floor = Math.floor(rawCount * pb.intensity);
      
      // 🚀 क्रिसमस के दौरान स्पॉन गति को बढ़ाएं (Double Spawn rate for heavy winter feel)
      const currentSpawnRate = preset === 'CHRISTMAS' ? 0.35 : pb.spawnRate;

      if (particles.current.length < Math_floor && Math.random() < currentSpawnRate) {
        particles.current.push(spawn());
      }

      particles.current = particles.current.filter(p => {
        p.vy += config.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        p.rotation += p.rotationSpeed;
        p.vx *= 0.995;
        p.vy *= 0.995;

        if (config.wobble) {
          p.vx += Math.sin(p.life * 0.12) * 0.18;
        }

        if (p.life > 0 && p.y < h + 60 && p.x > -60 && p.x < w + 60) {
          draw(p);
          return true;
        }
        return false;
      });

      rafId.current = requestAnimationFrame(animate);
    };

    const activeId = rafId.current;
    animate();

    return () => {
      cancelAnimationFrame(activeId);
      window.removeEventListener('resize', setSize);
      particles.current = [];
    };
  }, [preset]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none" // 🚀 'absolute' से बदलकर 'fixed' किया गया है
      style={{ zIndex: 9999 }} // 🚀 'z-index: 9999' से अब यह सभी डैशबोर्ड कार्ड्स के ऊपर बरसेगी
    />
  );
}
