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

const PRESET_COLORS: Record<string, string[]> = {
  GANESH_CHATURTHI: ['#fde047', '#facc15', '#fef08a', '#f97316'],
  HANUMAN_JAYANTI: ['#dc2626', '#f97316', '#16a34a', '#fbbf24'], 
  NAVRATRI: ['#f43f5e', '#fbcfe8', '#ffffff'],
  DUSSEHRA: ['#FFFDF0', '#FFD700', '#FF9900', '#FF4500', '#D97706'],
  VIJAYADASHAMI: ['#FFFDF0', '#FFD700', '#FF9900', '#FF4500', '#D97706'],
  REPUBLIC_DAY: ['#ff9933', '#ffffff', '#128807'],
  INDEPENDENCE_DAY: ['#ff9933', '#ffffff', '#128807'],
  RAY_ENGINE: ['#ff9933', '#ffffff', '#128807'],
  JANMASHTAMI: ['#00f5d4', '#ffd700', '#3a86ff', '#ffffff', '#06d6a0', '#fbbf24'],
  KRISHNA_JANMASHTAMI: ['#00f5d4', '#ffd700', '#3a86ff', '#ffffff', '#06d6a0', '#fbbf24']
};

const MASTER_PRESET_CONFIGS: Record<string, PresetConfig> = {
  GANESH_CHATURTHI: { default: { gravity: 0.003, speed: 1.0, maxCount: 90, minSize: 5, maxSize: 11, colors: PRESET_COLORS.GANESH_CHATURTHI, direction: 'downward' } },
  HANUMAN_JAYANTI:  { default: { gravity: 0.0012, speed: 0.65, maxCount: 130, minSize: 6, maxSize: 12, colors: PRESET_COLORS.HANUMAN_JAYANTI, direction: 'downward' } },
  NAVRATRI:         { default: { gravity: 0.003, speed: 1.0, maxCount: 90, minSize: 5, maxSize: 11, colors: PRESET_COLORS.NAVRATRI, direction: 'downward' } },
  DUSSEHRA:         { default: { gravity: 0.012, speed: 0.85, maxCount: 200, minSize: 0.8, maxSize: 2.2, colors: PRESET_COLORS.DUSSEHRA, glow: true, wobble: false, direction: 'downward', spawnY: -0.1 } },
  VIJAYADASHAMI:    { default: { gravity: 0.012, speed: 0.85, maxCount: 200, minSize: 0.8, maxSize: 2.2, colors: PRESET_COLORS.VIJAYADASHAMI, glow: true, wobble: false, direction: 'downward', spawnY: -0.1 } },

  JANMASHTAMI: {
    default: {
      gravity: 0.018, spread: 0.8, speed: 0.75, colors: PRESET_COLORS.JANMASHTAMI,
      minSize: 1.5, maxSize: 4.5, maxCount: 220, glow: true, wobble: true, direction: 'downward', spawnY: -0.1,
    }
  },
  KRISHNA_JANMASHTAMI: {
    default: {
      gravity: 0.018, spread: 0.8, speed: 0.75, colors: PRESET_COLORS.KRISHNA_JANMASHTAMI,
      minSize: 1.5, maxSize: 4.5, maxCount: 220, glow: true, wobble: true, direction: 'downward', spawnY: -0.1,
    }
  },

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
      gravity: -0.015, spread: 1.2, speed: 0.6,
      colors: ['#ff6b35', '#ff4500', '#ffd700', '#ff8c00'],
      minSize: 1.5, maxSize: 5.5, maxCount: 220, glow: true, wobble: true, direction: 'upward', spawnY: 1.02,
    }
  },
  CHRISTMAS: {
    default: {
      gravity: 0.025, spread: 0.6, speed: 0.9,
      colors: ['#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0'], 
      minSize: 0.8, maxSize: 2.5, maxCount: 450, glow: true, wobble: true, direction: 'downward', spawnY: -0.1,
    }
  },
  RAKSHA_BANDHAN: {
    default: {
      gravity: 0.025, spread: 0.7, speed: 0.8,
      colors: ['#ffffff', '#fef08a', '#fbbf24', '#f43f5e', '#ec4899'], 
      minSize: 1.0, maxSize: 4.0, maxCount: 280, glow: true, wobble: true, direction: 'downward', spawnY: -0.1,         
    }
  },
  MAKAR_SANKRANTI: {
    default: {
      gravity: 0.012, spread: 0.8, speed: 0.7,
      colors: ['#38bdf8', '#fbbf24', '#f43f5e', '#34d399', '#ffffff'], 
      minSize: 1.2, maxSize: 3.5, maxCount: 160, glow: true, wobble: true, direction: 'downward', spawnY: -0.1,
    }
  },
  NEW_YEAR: {
    default: {
      gravity: 0.016, spread: 1.0, speed: 0.6,
      colors: ['#ffffff', '#fef08a', '#fbbf24', '#10b981', '#8b5cf6', '#00f5d4'], 
      minSize: 1.2, maxSize: 4.2, maxCount: 280, glow: true, wobble: true, direction: 'downward', spawnY: -0.1,
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

    const resolvedGravity = customGravity ?? heroConfig?.customGravity ?? activePresetObj.default.gravity;
    const resolvedSpeed = customSpeed ?? heroConfig?.customSpeed ?? (heroConfig?.speed ? heroConfig.speed / 3.5 : activePresetObj.default.speed);
    const resolvedColors = customColors || heroConfig?.customColors || activePresetObj.default.colors;
    const resolvedMinSize = customMinSize ?? heroConfig?.customMinSize ?? activePresetObj.default.minSize;
    const resolvedMaxSize = customMaxSize ?? heroConfig?.customMaxSize ?? activePresetObj.default.maxSize;
    const resolvedMaxCount = customMaxCount ?? heroConfig?.customMaxCount ?? activePresetObj.default.maxCount;

    const config: EngineConfig = { 
      ...DEFAULT, 
      ...activePresetObj.default,
      ...(resolvedGravity !== null && resolvedGravity !== undefined && { gravity: resolvedGravity }),
      ...(resolvedSpeed !== null && resolvedSpeed !== undefined && { speed: resolvedSpeed }),
      ...(resolvedColors !== null && resolvedColors !== undefined && { colors: resolvedColors }),
      ...(resolvedMinSize !== null && resolvedMinSize !== undefined && { minSize: resolvedMinSize }),
      ...(resolvedMaxSize !== null && resolvedMaxSize !== undefined && { maxSize: resolvedMaxSize }),
      ...(resolvedMaxCount !== null && resolvedMaxCount !== undefined && { maxCount: resolvedMaxCount }),
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
      const phaseConfig = activePresetObj.phases?.[phaseRef.current] || {};

      let currentDirection = phaseConfig.direction || config.direction;
      let currentSpawnY    = phaseConfig.spawnY !== undefined ? phaseConfig.spawnY : (config.spawnY || 0.5);
      let currentMinSize   = config.minSize;
      let currentMaxSize   = config.maxSize;
      let currentSpeed     = config.speed;

      const cx = w / 2;
      const cy = h * currentSpawnY; 
      const spd = currentSpeed * rand(0.5, 1.1); 
      const size = rand(currentMinSize, currentMaxSize); 
      const angle = Math.random() * Math.PI * 2;

      let vx = 0;
      let vy = 0;

      switch (currentDirection) {
        case 'upward':   
          vx = rand(-1, 1) * spd * config.spread * 1.2; 
          vy = -spd * rand(1.2, 2.8) * config.spread; 
          break;
        case 'downward': 
          vx = rand(-0.15, 0.15) * spd; 
          vy = spd * rand(0.8, 1.6) * config.spread; 
          break;
        case 'spiral':   
          vx = Math.cos(angle + particles.current.length * 0.4) * spd * config.spread; 
          vy = Math.sin(angle + particles.current.length * 0.4) * spd * config.spread; 
          break;
        case 'radial':
        default:         
          vx = Math.cos(angle) * spd * config.spread * 2; 
          vy = Math.sin(angle) * spd * config.spread * 2;
      }

      const spawnX = (currentDirection === 'downward' || normalizedPreset === 'LOHRI') ? rand(0, w) : cx + rand(-20, 20);

      let baseMaxLife = 110;
      if (currentDirection === 'downward' || currentDirection === 'upward') {
         baseMaxLife = Math.max(350, Math.floor(h / (currentSpeed * 0.9))); 
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

    const draw = (p: Particle) => {
      // 🌓 1. GLOBAL THEME CHECK (Applies to all festivals)
      const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

      const progress = 1 - p.life / p.maxLife;
      const alpha = Math.max(0, 1 - (progress * progress));
      const renderSize = normalizedPreset === 'LOHRI' ? p.size * (1 - progress * 0.8) : p.size;

      ctx.save();
      
      // 🌟 GLOBAL RULE: Light mode me +20% extra opacity for solid visibility
      ctx.globalAlpha = isDarkMode ? alpha * 0.85 : Math.min(1, alpha * 0.98); 
      
      // 🌟 GLOBAL RULE: Lighter glow only in dark mode to prevent light mode wash-out
      if (config.glow && isDarkMode) {
        ctx.globalCompositeOperation = 'lighter';
      }

      // 🦚 A. JANMASHTAMI SPECIAL DRAWING
      if (normalizedPreset === 'JANMASHTAMI' || normalizedPreset === 'KRISHNA_JANMASHTAMI') {
        const s = renderSize * 1.4;

        if (p.color === '#00f5d4' || p.color === '#3a86ff' || p.color === '#06d6a0') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation + Math.sin(p.life * 0.05) * 0.4);

          if (!isDarkMode) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetY = 1.5;

            ctx.fillStyle = '#0d9488';
            ctx.beginPath();
            ctx.ellipse(0, 0, s * 1.5, s * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#1e3a8a';
            ctx.beginPath();
            ctx.ellipse(0, 0, s * 0.8, s * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#d97706';
            ctx.beginPath();
            ctx.arc(0, 0, s * 0.25, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.shadowColor = p.color;
            ctx.shadowBlur = s * 1.8;

            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, s * 1.5, s * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#1d4ed8';
            ctx.beginPath();
            ctx.ellipse(0, 0, s * 0.8, s * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(0, 0, s * 0.25, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        } 
        else if (p.color === '#ffffff') {
          if (!isDarkMode) {
            ctx.fillStyle = '#f8fafc';
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1;
            ctx.shadowColor = 'rgba(0,0,0,0.12)';
            ctx.shadowBlur = 3;
            ctx.beginPath();
            ctx.arc(p.x, p.y, s * 0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else {
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = s * 1.2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, s * 0.6, 0, Math.PI * 2);
            ctx.fill();
          }
        } 
        else {
          ctx.fillStyle = !isDarkMode ? '#b45309' : p.color;
          ctx.shadowBlur = !isDarkMode ? 2 : 6;
          ctx.shadowColor = !isDarkMode ? 'rgba(0,0,0,0.15)' : '#ffd700';
          ctx.beginPath();
          ctx.arc(p.x, p.y, s * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // 🚀 B. MAKAR SANKRANTI
      else if (normalizedPreset === 'MAKAR_SANKRANTI') {
        const s = renderSize * 1.5; 
        ctx.fillStyle = !isDarkMode && p.color === '#ffffff' ? '#64748b' : p.color;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 0.5;
        ctx.shadowColor = isDarkMode ? p.color : 'rgba(0,0,0,0.18)';
        ctx.shadowBlur = isDarkMode ? s * 1.5 : 3;

        ctx.beginPath();
        ctx.moveTo(p.x, p.y - s);
        ctx.lineTo(p.x + s * 0.7, p.y);
        ctx.lineTo(p.x, p.y + s);
        ctx.lineTo(p.x - s * 0.7, p.y);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(p.x, p.y + s);
        ctx.quadraticCurveTo(
          p.x + Math.sin(p.life * 0.15) * s * 0.4,
          p.y + s * 1.4,
          p.x + Math.sin(p.life * 0.08) * s * 0.7,
          p.y + s * 2.2
        );
        ctx.stroke();
      } 
      // 🚀 C. DUSSEHRA / VIJAYADASHAMI
      else if (normalizedPreset === 'DUSSEHRA' || normalizedPreset === 'VIJAYADASHAMI') {
        const s = renderSize;
        ctx.fillStyle = '#b8860b';
        ctx.beginPath();
        ctx.arc(p.x, p.y, s * 1.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, s * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      // 🚀 D. LOHRI
      else if (normalizedPreset === 'LOHRI') {
        const s = renderSize * 1.6;
        ctx.fillStyle = p.color;
        ctx.shadowColor = isDarkMode ? p.color : 'rgba(0,0,0,0.18)';
        ctx.shadowBlur = isDarkMode ? s * 1.5 : 3;

        ctx.beginPath();
        ctx.moveTo(p.x, p.y - s * 1.4);
        ctx.quadraticCurveTo(p.x + s * 0.85, p.y - s * 0.3, p.x + s * 0.4, p.y + s * 0.4);
        ctx.quadraticCurveTo(p.x, p.y + s * 0.8, p.x - s * 0.4, p.y + s * 0.4);
        ctx.quadraticCurveTo(p.x - s * 0.8, p.y - s * 0.3, p.x, p.y - s * 1.4);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y + s * 0.15, s * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }
      // 🚀 E. RAKSHA BANDHAN
      else if (normalizedPreset === 'RAKSHA_BANDHAN') {
        const s = renderSize * 1.4;
        ctx.shadowColor = isDarkMode ? p.color : 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = isDarkMode ? s * 1.2 : 2;

        ctx.strokeStyle = '#dc2626'; 
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(p.x - s, p.y);
        ctx.quadraticCurveTo(p.x - s * 1.4, p.y + Math.sin(p.life * 0.1) * s * 0.25, p.x - s * 2.2, p.y);
        ctx.moveTo(p.x + s, p.y);
        ctx.quadraticCurveTo(p.x + s * 1.4, p.y + Math.cos(p.life * 0.1) * s * 0.25, p.x + s * 2.2, p.y);
        ctx.stroke();

        ctx.fillStyle = p.color;
        for (let i = 0; i < 4; i++) {
          const ang = (i / 4) * Math.PI * 2 + p.rotation; 
          ctx.beginPath();
          ctx.arc(p.x + Math.cos(ang) * s * 0.42, p.y + Math.sin(ang) * s * 0.42, s * 0.38, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(p.x, p.y, s * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
      // 🌐 F. UNIVERSAL FALLBACK FOR ALL OTHER FESTIVALS (Holi, Diwali, Christmas, New Year, etc.)
      else {
        // Universal Smart Color Adaptation for Light Mode
        let finalColor = p.color;
        if (!isDarkMode) {
          if (p.color === '#ffffff') finalColor = '#94a3b8'; // Slate silver on white
          else if (p.color === '#fef08a' || p.color === '#fde047') finalColor = '#d97706'; // Rich Amber
          
          // Universal Soft Contrast Drop Shadow for Light Theme
          ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
          ctx.shadowBlur = 3;
          ctx.shadowOffsetY = 1;
        }

        ctx.fillStyle = finalColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, renderSize, 0, Math.PI * 2);
        ctx.fill();

        if (config.wobble && p.size > 5) {
          ctx.globalAlpha = alpha * 0.5;
          ctx.fillStyle = !isDarkMode ? '#e2e8f0' : '#ffffff';
          ctx.beginPath();
          ctx.arc(-renderSize * 0.25, -renderSize * 0.25, renderSize * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
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

        if (config.direction === 'downward') {
          p.vx *= 0.94;  
          p.vy *= 0.995; 
        } else {
          p.vx *= 0.998;
          p.vy *= 0.998;
        }

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
