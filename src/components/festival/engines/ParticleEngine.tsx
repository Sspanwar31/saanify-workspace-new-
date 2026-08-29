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
  opacity: number;
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
  IDLE: { intensity: 0.6, spawnRate: 0.08 }, // Increased intensity for more particles
  AMBIENT: { intensity: 0.9, spawnRate: 0.12 },
  SHOOTING: { intensity: 1.2, spawnRate: 0.24 },
  HANDOVER: { intensity: 1.0, spawnRate: 0.16 },
};

const DEFAULT: EngineConfig = {
  gravity: 0.008, // Reduced gravity for slow fall
  spread: 1,
  speed: 0.3, // Reduced base speed
  colors: ['#facc15', '#ffffff', '#f97316'],
  minSize: 3,
  maxSize: 7,
  maxCount: 100,
  glow: true,
  wobble: true,
  direction: 'downward',
  spawnY: -0.08,
};

// 🎨 7 FESTIVALS LIGHT COLORS
const LIGHT_COLORS: Record<string, string[]> = {
  LOHRI: ['#dc2626', '#ea580c', '#d97706', '#b45309', '#f59e0b'],
  RAKSHA_BANDHAN: ['#be185d', '#db2777', '#e11d48', '#c2410c', '#a16207'],
  CHRISTMAS: ['#0369a1', '#0284c7', '#475569', '#15803d', '#dc2626'],
  JANMASHTAMI: ['#047857', '#0369a1', '#1d4ed8', '#b45309', '#0f766e'],
  DUSSEHRA: ['#b45309', '#c2410c', '#dc2626', '#92400e', '#a16207'],
  MAKAR_SANKRANTI: ['#0369a1', '#0284c7', '#d97706', '#be123c', '#047857'],
  NEW_YEAR: ['#6d28d9', '#7c3aed', '#be185d', '#0369a1', '#b45309'],
};

// 🌙 7 FESTIVALS DARK COLORS
const DARK_COLORS: Record<string, string[]> = {
  LOHRI: ['#ff6b35', '#ff4500', '#ffd700', '#ff8c00', '#fff3b0'],
  RAKSHA_BANDHAN: ['#ec4899', '#f43f5e', '#facc15', '#ffffff', '#fb7185'],
  CHRISTMAS: ['#ffffff', '#e0f2fe', '#38bdf8', '#ef4444', '#22c55e'],
  JANMASHTAMI: ['#00f5d4', '#ffd700', '#3a86ff', '#ffffff', '#06d6a0'],
  DUSSEHRA: ['#FFD700', '#FF9900', '#FF4500', '#D97706', '#FFFDF0'],
  MAKAR_SANKRANTI: ['#0284c7', '#38bdf8', '#fbbf24', '#f43f5e', '#34d399'],
  NEW_YEAR: ['#8b5cf6', '#a855f7', '#ffd700', '#00f5d4', '#ec4899'],
};

const MASTER_PRESET_CONFIGS: Record<string, PresetConfig> = {
  // LOHRI: Slow upward embers
  LOHRI: { default: { gravity: 0.008, spread: 1.2, speed: 0.35, colors: DARK_COLORS.LOHRI, minSize: 2, maxSize: 6, maxCount: 300, glow: true, wobble: true, direction: 'upward', spawnY: 1.05 } },
  
  // RAKSHA_BANDHAN: Very slow falling petals
  RAKSHA_BANDHAN: { default: { gravity: 0.008, spread: 0.8, speed: 0.2, colors: DARK_COLORS.RAKSHA_BANDHAN, minSize: 4, maxSize: 8, maxCount: 300, glow: true, wobble: true, direction: 'downward', spawnY: -0.1 } },
  
  // CHRISTMAS: Large slow-falling snowflakes
  CHRISTMAS: { default: { gravity: 0.005, spread: 0.8, speed: 0.15, colors: DARK_COLORS.CHRISTMAS, minSize: 6, maxSize: 14, maxCount: 250, glow: true, wobble: true, direction: 'downward', spawnY: -0.1 } },
  
  // JANMASHTAMI: Slow floating feathers/butter
  JANMASHTAMI: { default: { gravity: 0.006, spread: 0.9, speed: 0.25, colors: DARK_COLORS.JANMASHTAMI, minSize: 4, maxSize: 9, maxCount: 300, glow: true, wobble: true, direction: 'downward', spawnY: -0.1 } },
  
  // DUSSEHRA: Slow falling fire sparks
  DUSSEHRA: { default: { gravity: 0.006, spread: 0.9, speed: 0.3, maxCount: 350, minSize: 2, maxSize: 6, colors: DARK_COLORS.DUSSEHRA, glow: true, wobble: true, direction: 'downward', spawnY: -0.1 } },
  
  // MAKAR_SANKRANTI: Gentle kites gliding down
  MAKAR_SANKRANTI: { default: { gravity: 0.003, spread: 0.9, speed: 0.1, colors: DARK_COLORS.MAKAR_SANKRANTI, minSize: 5, maxSize: 11, maxCount: 250, glow: true, wobble: true, direction: 'downward', spawnY: -0.1 } },
  
  // NEW_YEAR: Slow falling confetti
  NEW_YEAR: { default: { gravity: 0.01, spread: 1.0, speed: 0.25, colors: DARK_COLORS.NEW_YEAR, minSize: 4, maxSize: 10, maxCount: 350, glow: true, wobble: true, direction: 'downward', spawnY: -0.1 } },
};

export default function ParticleEngine({ 
  preset, heroConfig, phase = 'IDLE', customGravity, customSpeed, customColors, customMinSize, customMaxSize, customMaxCount 
}: { 
  preset?: string; heroConfig?: any; phase?: string; 
  customGravity?: number | null; customSpeed?: number | null; customColors?: string[] | null; 
  customMinSize?: number | null; customMaxSize?: number | null; customMaxCount?: number | null; 
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
    const activePreset = MASTER_PRESET_CONFIGS[normalizedPreset] || { default: DEFAULT };

    const getIsDarkMode = () => {
      if (typeof document === 'undefined') return false;
      return document.documentElement.classList.contains('dark') || document.documentElement.getAttribute('data-theme') === 'dark';
    };

    let isDarkMode = getIsDarkMode();

    const getThemeColors = () => {
      if (customColors && customColors.length > 0) return customColors;
      if (isDarkMode) return DARK_COLORS[normalizedPreset] || activePreset.default.colors || DEFAULT.colors;
      return LIGHT_COLORS[normalizedPreset] || activePreset.default.colors || DEFAULT.colors;
    };

    const config: EngineConfig = {
      ...DEFAULT,
      ...activePreset.default,
      colors: getThemeColors(),
      ...(customGravity !== null && customGravity !== undefined && { gravity: customGravity }),
      ...(customSpeed !== null && customSpeed !== undefined && { speed: customSpeed }),
      ...(customMinSize !== null && customMinSize !== undefined && { minSize: customMinSize }),
      ...(customMaxSize !== null && customMaxSize !== undefined && { maxSize: customMaxSize }),
      ...(customMaxCount !== null && customMaxCount !== undefined && { maxCount: customMaxCount }),
    };

    let w = 0, h = 0;

    const setSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width > 0 ? rect.width : window.innerWidth;
      h = rect.height > 0 ? rect.height : window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    setSize();
    window.addEventListener('resize', setSize);

    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    const spawn = (): Particle => {
      const centerX = w / 2;
      const spawnY = h * (config.spawnY !== undefined ? config.spawnY : -0.05);
      const speed = config.speed * rand(0.6, 1.1); // Reduced upper range for slower base speed
      const size = rand(config.minSize, config.maxSize);
      let spawnX: number;

      if (config.direction === 'downward' || normalizedPreset === 'LOHRI') {
        spawnX = rand(0, w);
      } else {
        spawnX = centerX + rand(-40, 40);
      }

      const baseLife = Math.max(350, Math.floor(h / Math.max(config.speed, 0.1)));

      return {
        x: spawnX,
        y: spawnY + rand(-20, 20),
        vx: (Math.random() - 0.5) * speed * config.spread,
        vy: speed * rand(0.8, 1.2) * (config.direction === 'upward' ? -1 : 1),
        size,
        color: pick(getThemeColors()),
        life: rand(baseLife * 0.55, baseLife),
        maxLife: baseLife,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: rand(-0.06, 0.06),
        opacity: rand(0.65, 1), // Slightly increased opacity
      };
    };

    const draw = (p: Particle) => {
      const progress = 1 - p.life / p.maxLife;
      const fade = progress < 0.75 ? 1 : Math.max(0, 1 - (progress - 0.75) / 0.25);
      const alpha = p.opacity * fade;
      const s = p.size;

      ctx.save();
      ctx.globalAlpha = isDarkMode ? alpha * 0.95 : alpha * 0.92;

      if (config.glow && isDarkMode) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = Math.max(4, s * 2.5);
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }

      if (normalizedPreset === 'JANMASHTAMI') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        const peacock = p.color === '#00f5d4' || p.color === '#3a86ff' || p.color === '#06d6a0' || p.color === '#047857' || p.color === '#0369a1';
        if (peacock) {
          ctx.fillStyle = isDarkMode ? p.color : '#047857';
          ctx.beginPath();
          ctx.ellipse(0, 0, s * 1.6, s * 0.75, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = isDarkMode ? '#1e3a8a' : '#1d4ed8';
          ctx.beginPath();
          ctx.ellipse(0, 0, s * 0.85, s * 0.48, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(0, 0, s * 0.25, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = isDarkMode ? '#fff7cc' : '#d97706';
          ctx.beginPath();
          ctx.arc(0, 0, s * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (normalizedPreset === 'CHRISTMAS') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.strokeStyle = isDarkMode ? '#ffffff' : '#0369a1';
        ctx.lineWidth = isDarkMode ? 1.5 : 2.5; // Thicker lines for larger snowflakes
        ctx.lineCap = 'round';
        for (let i = 0; i < 6; i++) {
          ctx.rotate(Math.PI / 3);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, s);
          ctx.moveTo(-s * 0.3, s * 0.58);
          ctx.lineTo(0, s * 0.8);
          ctx.lineTo(s * 0.3, s * 0.58);
          ctx.stroke();
        }
      } else if (normalizedPreset === 'RAKSHA_BANDHAN') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 1.3, s * 0.62, 0, 0, Math.PI * 2);
        ctx.fill();
        if (isDarkMode) {
          ctx.globalAlpha = alpha * 0.35;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(-s * 0.35, -s * 0.15, s * 0.35, s * 0.15, -0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (normalizedPreset === 'MAKAR_SANKRANTI') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.72, 0);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.72, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = isDarkMode ? 'rgba(255,255,255,0.75)' : 'rgba(30,41,59,0.5)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(0, s);
        ctx.moveTo(-s * 0.72, 0);
        ctx.lineTo(s * 0.72, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, s);
        ctx.quadraticCurveTo(s * 0.7, s * 1.35, 0, s * 1.7);
        ctx.stroke();
      } else if (normalizedPreset === 'NEW_YEAR') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.65, 0);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.65, 0);
        ctx.closePath();
        ctx.fill();
        if (isDarkMode) {
          ctx.globalAlpha = alpha * 0.5;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-s * 0.18, -s * 0.18, s * 0.16, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (normalizedPreset === 'DUSSEHRA') {
        const sSize = p.size;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, sSize, 0, Math.PI * 2);
        ctx.fill();
        if (isDarkMode) {
          ctx.fillStyle = '#fff7ae';
          ctx.globalAlpha = alpha * 0.8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, sSize * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (normalizedPreset === 'LOHRI') {
        const sSize = p.size * 1.6;
        ctx.fillStyle = p.color;
        ctx.shadowColor = isDarkMode ? p.color : 'rgba(180,83,9,0.35)';
        ctx.shadowBlur = isDarkMode ? sSize * 1.8 : 4;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - sSize * 1.4);
        ctx.quadraticCurveTo(p.x + sSize * 0.85, p.y - sSize * 0.3, p.x + sSize * 0.4, p.y + sSize * 0.4);
        ctx.quadraticCurveTo(p.x, p.y + sSize * 0.8, p.x - sSize * 0.4, p.y + sSize * 0.4);
        ctx.quadraticCurveTo(p.x - sSize * 0.8, p.y - sSize * 0.3, p.x, p.y - sSize * 1.4);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    const animate = () => {
      const pb = PhaseBehavior[phaseRef.current] || PhaseBehavior.IDLE;
      ctx.clearRect(0, 0, w, h);

      const targetCount = Math.floor(config.maxCount * pb.intensity);
      let spawnRate = pb.spawnRate;

      if (normalizedPreset === 'CHRISTMAS') spawnRate = Math.max(spawnRate, 0.18);
      if (normalizedPreset === 'LOHRI') spawnRate = Math.max(spawnRate, 0.12);

      if (particles.current.length < targetCount && Math.random() < spawnRate) {
        particles.current.push(spawn());
      }

      particles.current = particles.current.filter((p) => {
        p.vy += config.gravity;
        
        // 🚀 TERMINAL VELOCITY: Prevent particles from falling infinitely fast
        const maxVy = config.speed * 2.5;
        if (p.vy > maxVy) p.vy = maxVy;
        if (p.vy < -maxVy) p.vy = -maxVy;

        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        p.rotation += p.rotationSpeed;

        if (config.wobble) {
          p.vx += Math.sin(p.life * 0.04 + p.y * 0.005) * 0.04;
        }
        p.vx += Math.sin(p.life * 0.008) * 0.002;

        if (p.life > 0 && p.y < h + 100 && p.y > -150 && p.x > -100 && p.x < w + 100) {
          draw(p);
          return true;
        }
        return false;
      });

      rafId.current = requestAnimationFrame(animate);
    };

    const themeObserver = new MutationObserver(() => {
      const nextTheme = getIsDarkMode();
      if (nextTheme !== isDarkMode) {
        isDarkMode = nextTheme;
        particles.current = [];
      }
    });

    if (typeof document !== 'undefined') {
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class', 'data-theme'],
      });
    }

    particles.current = [];
    animate();

    return () => {
      cancelAnimationFrame(rafId.current);
      window.removeEventListener('resize', setSize);
      themeObserver.disconnect();
      particles.current = [];
    };
  }, [preset, heroConfig, customGravity, customSpeed, customColors, customMinSize, customMaxSize, customMaxCount]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 9999 }}
      aria-hidden="true"
    />
  );
}
