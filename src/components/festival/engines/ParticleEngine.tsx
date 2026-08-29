'use client';

import { useEffect, useRef } from 'react';

/* ═══════════════════════════════════════════════════════════════
   TYPES & CONSTANTS
   ═══════════════════════════════════════════════════════════════ */
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
  direction: 'radial' | 'upward' | 'downward';
  spawnY?: number; 
}

interface PresetConfig {
  default: Partial<EngineConfig>;
}

const PhaseBehavior: Record<string, { intensity: number; spawnRate: number }> = {
  IDLE:      { intensity: 0.3, spawnRate: 0.025 },
  AMBIENT:   { intensity: 0.8, spawnRate: 0.08  }, 
  SHOOTING:  { intensity: 1.2, spawnRate: 0.24  }, 
  HANDOVER:  { intensity: 0.9, spawnRate: 0.12  },
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

/* 🎨 EXACT 7 FESTIVALS DATABASE COLOR PALETTES */
const PRESET_COLORS: Record<string, string[]> = {
  LOHRI:           ['#ff6b35', '#ff4500', '#ffd700', '#ff8c00'],             // Fire & Gold Embers
  RAKSHA_BANDHAN:  ['#ec4899', '#f43f5e', '#facc15', '#ffffff', '#fb7185'], // Silk Pink, Gold & Rose
  CHRISTMAS:       ['#ffffff', '#e0f2fe', '#38bdf8', '#ef4444', '#22c55e'], // Snowflakes & Holly
  JANMASHTAMI:     ['#00f5d4', '#ffd700', '#3a86ff', '#ffffff', '#06d6a0'], // Peacock Feathers & Butter
  KRISHNA_JANMASHTAMI: ['#00f5d4', '#ffd700', '#3a86ff', '#ffffff', '#06d6a0'],
  DUSSEHRA:        ['#FFD700', '#FF9900', '#FF4500', '#D97706', '#FFFDF0'], // Gold Arrow & Fire Sparks
  VIJAYADASHAMI:   ['#FFD700', '#FF9900', '#FF4500', '#D97706', '#FFFDF0'],
  MAKAR_SANKRANTI: ['#0284c7', '#38bdf8', '#fbbf24', '#f43f5e', '#34d399'], // Sky Blue & Kites
  NEW_YEAR:        ['#8b5cf6', '#a855f7', '#ffd700', '#00f5d4', '#ec4899'], // Confetti & Gold
};

const MASTER_PRESET_CONFIGS: Record<string, PresetConfig> = {
  LOHRI: {
    default: { gravity: -0.012, spread: 1.2, speed: 0.6, colors: PRESET_COLORS.LOHRI, minSize: 1.5, maxSize: 5.5, maxCount: 220, glow: true, wobble: true, direction: 'upward', spawnY: 1.02 }
  },
  RAKSHA_BANDHAN: {
    default: { gravity: 0.02, spread: 0.7, speed: 0.75, colors: PRESET_COLORS.RAKSHA_BANDHAN, minSize: 2.5, maxSize: 6.0, maxCount: 220, glow: true, wobble: true, direction: 'downward', spawnY: -0.1 }
  },
  CHRISTMAS: {
    default: { gravity: 0.015, spread: 0.6, speed: 0.7, colors: PRESET_COLORS.CHRISTMAS, minSize: 3, maxSize: 7.5, maxCount: 180, glow: true, wobble: true, direction: 'downward', spawnY: -0.1 }
  },
  JANMASHTAMI: {
    default: { gravity: 0.018, spread: 0.8, speed: 0.75, colors: PRESET_COLORS.JANMASHTAMI, minSize: 1.5, maxSize: 4.5, maxCount: 220, glow: true, wobble: true, direction: 'downward', spawnY: -0.1 }
  },
  KRISHNA_JANMASHTAMI: {
    default: { gravity: 0.018, spread: 0.8, speed: 0.75, colors: PRESET_COLORS.KRISHNA_JANMASHTAMI, minSize: 1.5, maxSize: 4.5, maxCount: 220, glow: true, wobble: true, direction: 'downward', spawnY: -0.1 }
  },
  DUSSEHRA: {
    default: { gravity: 0.012, speed: 0.85, maxCount: 220, minSize: 1.2, maxSize: 3.5, colors: PRESET_COLORS.DUSSEHRA, glow: true, wobble: false, direction: 'downward', spawnY: -0.1 }
  },
  VIJAYADASHAMI: {
    default: { gravity: 0.012, speed: 0.85, maxCount: 220, minSize: 1.2, maxSize: 3.5, colors: PRESET_COLORS.VIJAYADASHAMI, glow: true, wobble: false, direction: 'downward', spawnY: -0.1 }
  },
  MAKAR_SANKRANTI: {
    default: { gravity: 0.012, spread: 0.8, speed: 0.7, colors: PRESET_COLORS.MAKAR_SANKRANTI, minSize: 2.5, maxSize: 5.5, maxCount: 160, glow: true, wobble: true, direction: 'downward', spawnY: -0.1 }
  },
  NEW_YEAR: {
    default: { gravity: 0.018, spread: 1.0, speed: 0.8, colors: PRESET_COLORS.NEW_YEAR, minSize: 3, maxSize: 7, maxCount: 200, glow: true, wobble: true, direction: 'downward', spawnY: -0.1 }
  }
};

export default function ParticleEngine({ 
  preset, 
  heroConfig, 
  phase = 'IDLE',
  customGravity,
  customSpeed,
  customColors,
  customMinSize,
  customMaxSize,
  customMaxCount
}: { 
  preset?: string; 
  heroConfig?: any; 
  phase?: string; 
  customGravity?: number | null;
  customSpeed?: number | null;
  customColors?: string[] | null;
  customMinSize?: number | null;
  customMaxSize?: number | null;
  customMaxCount?: number | null;
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

    const normalizedPreset = (preset || heroConfig?.engine_preset || heroConfig?.preset || '').toUpperCase().trim();
    const activePresetObj = MASTER_PRESET_CONFIGS[normalizedPreset || ''] || { default: DEFAULT };

    const config: EngineConfig = { 
      ...DEFAULT, 
      ...activePresetObj.default,
      ...(customGravity !== null && customGravity !== undefined && { gravity: customGravity }),
      ...(customSpeed !== null && customSpeed !== undefined && { speed: customSpeed }),
      ...(customColors !== null && customColors !== undefined && { colors: customColors }),
      ...(customMinSize !== null && customMinSize !== undefined && { minSize: customMinSize }),
      ...(customMaxSize !== null && customMaxSize !== undefined && { maxSize: customMaxSize }),
      ...(customMaxCount !== null && customMaxCount !== undefined && { maxCount: customMaxCount }),
    };

    let w = 0;
    let h = 0;

    const setSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
      const cx = w / 2;
      const cy = h * (config.spawnY || -0.05); 
      const spd = config.speed * rand(0.5, 1.1); 
      const size = rand(config.minSize, config.maxSize); 
      const spawnX = (config.direction === 'downward' || normalizedPreset === 'LOHRI') ? rand(0, w) : cx + rand(-20, 20);

      let baseMaxLife = Math.max(350, Math.floor(h / (config.speed * 0.9))); 

      return {
        x: spawnX,
        y: cy + rand(-10, 10),
        vx: (Math.random() - 0.5) * spd * config.spread,
        vy: spd * rand(0.8, 1.5) * (config.direction === 'upward' ? -1 : 1),
        size,
        color: pick(config.colors),
        life: rand(baseMaxLife * 0.6, baseMaxLife),
        maxLife: baseMaxLife,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: rand(-0.06, 0.06),
      };
    };

    const draw = (p: Particle) => {
      const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
      const progress = 1 - p.life / p.maxLife;
      const alpha = Math.max(0, 1 - (progress * progress));
      const s = p.size;

      ctx.save();
      ctx.globalAlpha = isDarkMode ? alpha * 0.85 : Math.min(1, alpha * 0.96);

      // 🦚 1. JANMASHTAMI: Peacock Feathers & Butter Drops
      if (normalizedPreset === 'JANMASHTAMI' || normalizedPreset === 'KRISHNA_JANMASHTAMI') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        if (p.color === '#00f5d4' || p.color === '#3a86ff' || p.color === '#06d6a0') {
          ctx.fillStyle = isDarkMode ? p.color : '#0d9488';
          ctx.beginPath();
          ctx.ellipse(0, 0, s * 1.6, s * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1e3a8a';
          ctx.beginPath();
          ctx.ellipse(0, 0, s * 0.8, s * 0.45, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(0, 0, s * 0.25, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = !isDarkMode && p.color === '#ffffff' ? '#f1f5f9' : p.color;
          ctx.beginPath();
          ctx.arc(0, 0, s * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // ❄️ 2. CHRISTMAS: 6-Point Crystal Snowflakes
      else if (normalizedPreset === 'CHRISTMAS') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.strokeStyle = !isDarkMode ? '#0284c7' : '#ffffff';
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 6; i++) {
          ctx.rotate(Math.PI / 3);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, s);
          ctx.moveTo(-s * 0.3, s * 0.6);
          ctx.lineTo(0, s * 0.8);
          ctx.lineTo(s * 0.3, s * 0.6);
          ctx.stroke();
        }
      }
      // 🧵 3. RAKSHA BANDHAN: Silk Thread Knot & Rose Petals
      else if (normalizedPreset === 'RAKSHA_BANDHAN') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = !isDarkMode && p.color === '#ffffff' ? '#db2777' : p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 1.3, s * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // 🪁 4. MAKAR SANKRANTI: Mini Flying Kites (Patang)
      else if (normalizedPreset === 'MAKAR_SANKRANTI') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = !isDarkMode && p.color === '#ffffff' ? '#0284c7' : p.color;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.7, 0);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.7, 0);
        ctx.closePath();
        ctx.fill();
      }
      // 🎊 5. NEW YEAR: 3D Diamond Confetti Ribbons
      else if (normalizedPreset === 'NEW_YEAR') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = !isDarkMode && p.color === '#ffffff' ? '#7c3aed' : p.color;
        ctx.fillRect(-s * 0.6, -s * 0.3, s * 1.2, s * 0.6);
      }
      // 🔥 6. DUSSEHRA / VIJAYADASHAMI: Gold Arrow & Fire Sparks
      else if (normalizedPreset === 'DUSSEHRA' || normalizedPreset === 'VIJAYADASHAMI') {
        const sSize = renderSize;
        ctx.fillStyle = '#b8860b';
        ctx.beginPath();
        ctx.arc(p.x, p.y, sSize * 1.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, sSize * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      // 🔥 7. LOHRI: Rising Campfire Flames & Embers
      else if (normalizedPreset === 'LOHRI') {
        const sSize = renderSize * 1.6;
        ctx.fillStyle = p.color;
        ctx.shadowColor = isDarkMode ? p.color : 'rgba(0,0,0,0.18)';
        ctx.shadowBlur = isDarkMode ? sSize * 1.5 : 3;

        ctx.beginPath();
        ctx.moveTo(p.x, p.y - sSize * 1.4);
        ctx.quadraticCurveTo(p.x + sSize * 0.85, p.y - sSize * 0.3, p.x + sSize * 0.4, p.y + sSize * 0.4);
        ctx.quadraticCurveTo(p.x, p.y + sSize * 0.8, p.x - sSize * 0.4, p.y + sSize * 0.4);
        ctx.quadraticCurveTo(p.x - sSize * 0.8, p.y - sSize * 0.3, p.x, p.y - sSize * 1.4);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    };

    const animate = () => {
      const pb = PhaseBehavior[phaseRef.current] || PhaseBehavior.IDLE;
      ctx.clearRect(0, 0, w, h);

      const rawCount = config.maxCount;
      const Math_floor = Math.floor(rawCount * pb.intensity);
      const currentSpawnRate = normalizedPreset === 'CHRISTMAS' ? 0.35 : pb.spawnRate;

      if (particles.current.length < Math_floor && Math.random() < currentSpawnRate) {
        particles.current.push(spawn());
      }

      particles.current = particles.current.filter(p => {
        p.vy += config.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        p.rotation += p.rotationSpeed;

        if (config.wobble) {
          p.vx += Math.sin(p.life * 0.04 + p.y * 0.005) * 0.05;
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
    
  }, [preset, heroConfig, phase, customGravity, customSpeed, customColors, customMinSize, customMaxSize, customMaxCount]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 9999 }}
    />
  );
}
