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
  IDLE:      { intensity: 0.6, spawnRate: 0.08 },
  AMBIENT:   { intensity: 0.9, spawnRate: 0.12 },
  SHOOTING:  { intensity: 1.2, spawnRate: 0.24 },
  HANDOVER:  { intensity: 1.0, spawnRate: 0.16 },
};

const DEFAULT: EngineConfig = {
  gravity: 0.008,
  spread: 1,
  speed: 0.35,
  colors: ['#facc15', '#ffffff', '#f97316'],
  minSize: 3,
  maxSize: 7,
  maxCount: 120,
  glow: true,
  wobble: true,
  direction: 'downward',
  spawnY: -0.08,
};

// 🎨 7 FESTIVALS LIGHT THEME COLORS
const LIGHT_COLORS: Record<string, string[]> = {
  LOHRI:           ['#ea580c', '#f97316', '#d97706', '#b45309', '#dc2626'],
  RAKSHA_BANDHAN:  ['#dc2626', '#e11d48', '#d97706', '#db2777', '#b45309'], // Silk Crimson, Ruby & Gold
  CHRISTMAS:       ['#0369a1', '#0284c7', '#475569', '#15803d', '#dc2626'],
  JANMASHTAMI:     ['#047857', '#0369a1', '#1d4ed8', '#b45309', '#0f766e'],
  DUSSEHRA:        ['#b45309', '#c2410c', '#dc2626', '#92400e', '#a16207'],
  MAKAR_SANKRANTI: ['#0369a1', '#0284c7', '#d97706', '#be123c', '#047857'],
  NEW_YEAR:        ['#6d28d9', '#7c3aed', '#be185d', '#0369a1', '#b45309'],
};

// 🌙 7 FESTIVALS DARK THEME COLORS
const DARK_COLORS: Record<string, string[]> = {
  LOHRI:           ['#ff6b35', '#ff4500', '#ffd700', '#ff8c00', '#fff3b0'],
  RAKSHA_BANDHAN:  ['#f43f5e', '#ec4899', '#ffd700', '#facc15', '#ffffff'], // Glowing Silk Red, Pink & Gold
  CHRISTMAS:       ['#ffffff', '#e0f2fe', '#38bdf8', '#ef4444', '#22c55e'],
  JANMASHTAMI:     ['#00f5d4', '#ffd700', '#3a86ff', '#ffffff', '#06d6a0'],
  DUSSEHRA:        ['#FFD700', '#FF9900', '#FF4500', '#D97706', '#FFFDF0'],
  MAKAR_SANKRANTI: ['#0284c7', '#38bdf8', '#fbbf24', '#f43f5e', '#34d399'],
  NEW_YEAR:        ['#8b5cf6', '#a855f7', '#ffd700', '#00f5d4', '#ec4899'],
};

const MASTER_PRESET_CONFIGS: Record<string, PresetConfig> = {
  LOHRI: { 
    default: { 
      gravity: -0.004, 
      spread: 0.6, 
      speed: 0.25, 
      colors: DARK_COLORS.LOHRI, 
      minSize: 3, 
      maxSize: 6.5, 
      maxCount: 220, 
      glow: true, 
      wobble: true, 
      direction: 'upward', 
      spawnY: 1.05 
    } 
  },
  // 🧵 RAKSHA_BANDHAN: Slow Soft Floating Silk Rakhi Motifs
  RAKSHA_BANDHAN:  { default: { gravity: 0.004, spread: 0.6, speed: 0.18, colors: DARK_COLORS.RAKSHA_BANDHAN, minSize: 3.5, maxSize: 8.0, maxCount: 220, glow: true, wobble: true, direction: 'downward', spawnY: -0.1 } },
  CHRISTMAS:       { default: { gravity: 0.004, spread: 0.5, speed: 0.18, colors: DARK_COLORS.CHRISTMAS, minSize: 5.5, maxSize: 12, maxCount: 220, glow: true, wobble: true, direction: 'downward', spawnY: -0.1 } },
  JANMASHTAMI:     { default: { gravity: 0.005, spread: 0.7, speed: 0.2, colors: DARK_COLORS.JANMASHTAMI, minSize: 3.5, maxSize: 8, maxCount: 260, glow: true, wobble: true, direction: 'downward', spawnY: -0.1 } },
  DUSSEHRA:        { default: { gravity: 0.005, spread: 0.6, speed: 0.25, maxCount: 300, minSize: 2, maxSize: 5, colors: DARK_COLORS.DUSSEHRA, glow: true, wobble: false, direction: 'downward', spawnY: -0.1 } },
  MAKAR_SANKRANTI: { default: { gravity: 0.003, spread: 0.7, speed: 0.12, colors: DARK_COLORS.MAKAR_SANKRANTI, minSize: 4.5, maxSize: 9, maxCount: 200, glow: true, wobble: true, direction: 'downward', spawnY: -0.1 } },
  NEW_YEAR:        { default: { gravity: 0.006, spread: 0.8, speed: 0.22, colors: DARK_COLORS.NEW_YEAR, minSize: 3.5, maxSize: 8, maxCount: 280, glow: true, wobble: true, direction: 'downward', spawnY: -0.1 } },
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

  // 🚀 RAW VALUES EXTRACTED DIRECTLY FROM SUPABASE
  const rawDbSpeed = customSpeed !== undefined && customSpeed !== null 
    ? customSpeed 
    : heroConfig?.customSpeed !== undefined && heroConfig?.customSpeed !== null 
      ? heroConfig.customSpeed 
      : null;

  const rawDbGravity = customGravity !== undefined && customGravity !== null 
    ? customGravity 
    : heroConfig?.customGravity !== undefined && heroConfig?.customGravity !== null 
      ? heroConfig.customGravity 
      : null;

  const rawDbCount = customMaxCount !== undefined && customMaxCount !== null 
    ? customMaxCount 
    : heroConfig?.customMaxCount !== undefined && heroConfig?.customMaxCount !== null 
      ? heroConfig.customMaxCount 
      : null;

  const rawDbMinSize = customMinSize ?? heroConfig?.customMinSize ?? null;
  const rawDbMaxSize = customMaxSize ?? heroConfig?.customMaxSize ?? null;

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
      const dbColors = customColors || heroConfig?.customColors;
      if (dbColors && dbColors.length > 0) return dbColors;
      if (isDarkMode) return DARK_COLORS[normalizedPreset] || activePreset.default.colors || DEFAULT.colors;
      return LIGHT_COLORS[normalizedPreset] || activePreset.default.colors || DEFAULT.colors;
    };

    // 🚀 EXACT SUPABASE SPEED BINDING
    const finalSpeed = rawDbSpeed !== null ? Number(rawDbSpeed) : (activePreset.default.speed ?? DEFAULT.speed);
    const finalGravity = rawDbGravity !== null ? Number(rawDbGravity) : (activePreset.default.gravity ?? DEFAULT.gravity);
    const finalCount = rawDbCount !== null ? Number(rawDbCount) : (activePreset.default.maxCount ?? DEFAULT.maxCount);
    const finalMinSize = rawDbMinSize !== null ? Number(rawDbMinSize) : (activePreset.default.minSize ?? DEFAULT.minSize);
    const finalMaxSize = rawDbMaxSize !== null ? Number(rawDbMaxSize) : (activePreset.default.maxSize ?? DEFAULT.maxSize);

    const config: EngineConfig = {
      ...DEFAULT,
      ...activePreset.default,
      colors: getThemeColors(),
      gravity: finalGravity,
      speed: finalSpeed,
      minSize: finalMinSize,
      maxSize: finalMaxSize,
      maxCount: finalCount,
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
      const isUpward = config.direction === 'upward' || config.gravity < 0;
      const spawnY = isUpward ? h * 1.05 : h * -0.05;
      const size = rand(config.minSize, config.maxSize);
      const spawnX = rand(0, w);

      const baseVy = (isUpward ? -1 : 1) * config.speed * rand(0.7, 1.1);
      const baseVx = (Math.random() - 0.5) * config.speed * config.spread * 0.6;

      const baseLife = Math.max(450, Math.floor(h / Math.max(config.speed, 0.05)));

      return {
        x: spawnX,
        y: spawnY + rand(-15, 15),
        vx: baseVx,
        vy: baseVy,
        size,
        color: pick(getThemeColors()),
        life: rand(baseLife * 0.7, baseLife),
        maxLife: baseLife,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: rand(-0.02, 0.02),
        opacity: rand(0.75, 1),
      };
    };

    const draw = (p: Particle) => {
      const progress = 1 - p.life / p.maxLife;
      const fade = progress < 0.85 ? 1 : Math.max(0, 1 - (progress - 0.85) / 0.15);
      const alpha = p.opacity * fade;
      const s = p.size;

      ctx.save();
      ctx.globalAlpha = isDarkMode ? alpha * 0.95 : alpha * 0.92;

      // 🦚 1. JANMASHTAMI
      if (normalizedPreset === 'JANMASHTAMI' || normalizedPreset === 'KRISHNA_JANMASHTAMI') {
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
      } 
      // ❄️ 2. CHRISTMAS
      else if (normalizedPreset === 'CHRISTMAS') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.strokeStyle = isDarkMode ? '#ffffff' : '#0369a1';
        ctx.lineWidth = isDarkMode ? 1.4 : 2.2;
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
      } 
      // 🧵 3. RAKSHA BANDHAN: Pure 3D Silk Rakhi Motif & Dual Golden Threads (NO LEAVES)
      else if (normalizedPreset === 'RAKSHA_BANDHAN') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (!isDarkMode) {
          ctx.shadowColor = 'rgba(0,0,0,0.12)';
          ctx.shadowBlur = 3;
        } else {
          ctx.shadowColor = p.color;
          ctx.shadowBlur = s * 1.4;
        }

        // A. Left & Right Flowing Silk Threads
        ctx.strokeStyle = !isDarkMode ? '#b91c1c' : '#f43f5e';
        ctx.lineWidth = Math.max(0.6, s * 0.15);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-s * 1.8, 0);
        ctx.quadraticCurveTo(-s * 0.9, Math.sin(p.life * 0.05) * s * 0.4, 0, 0);
        ctx.quadraticCurveTo(s * 0.9, -Math.sin(p.life * 0.05) * s * 0.4, s * 1.8, 0);
        ctx.stroke();

        // B. Outer Golden Zari / Pearl Ring
        ctx.fillStyle = !isDarkMode ? '#d97706' : '#ffd700';
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.75, 0, Math.PI * 2);
        ctx.fill();

        // C. Inner Ruby Red / Silk Center Gem
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // D. Center Shining Pearl Dot
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-s * 0.12, -s * 0.12, s * 0.15, 0, Math.PI * 2);
        ctx.fill();
      } 
      // 🪁 4. MAKAR SANKRANTI
      else if (normalizedPreset === 'MAKAR_SANKRANTI') {
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
      } 
      // 🎊 5. NEW YEAR
      else if (normalizedPreset === 'NEW_YEAR') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-s * 0.6, -s * 0.3, s * 1.2, s * 0.6);
      } 
      // 🔥 6. DUSSEHRA
      else if (normalizedPreset === 'DUSSEHRA') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, s * 0.8, 0, Math.PI * 2);
        ctx.fill();
      } 
      // 🔥 7. LOHRI: Rising Fire Flame
      else if (normalizedPreset === 'LOHRI') {
        ctx.translate(p.x, p.y);
        ctx.fillStyle = p.color;
        if (!isDarkMode) {
          ctx.shadowColor = 'rgba(0,0,0,0.12)';
          ctx.shadowBlur = 3;
        } else {
          ctx.shadowColor = p.color;
          ctx.shadowBlur = s * 1.5;
        }
        ctx.beginPath();
        ctx.moveTo(0, -s * 1.3);
        ctx.quadraticCurveTo(s * 0.8, -s * 0.3, s * 0.4, s * 0.4);
        ctx.quadraticCurveTo(s * 0.7, s * 0.8, 0, s * 0.9);
        ctx.quadraticCurveTo(-s * 0.7, s * 0.8, -s * 0.4, s * 0.4);
        ctx.quadraticCurveTo(-s * 0.8, -s * 0.3, 0, -s * 1.3);
        ctx.fill();
      } 
      else {
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
      if (particles.current.length < targetCount && Math.random() < 0.22) {
        particles.current.push(spawn());
      }

      particles.current = particles.current.filter((p) => {
        p.vy += config.gravity * 0.15;

        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        p.rotation += p.rotationSpeed;

        if (config.wobble) {
          p.vx += Math.sin(p.life * 0.02 + p.y * 0.002) * 0.015;
        }

        if (p.life > 0 && p.y < h + 80 && p.y > -80 && p.x > -60 && p.x < w + 60) {
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
  }, [
    preset, 
    JSON.stringify(heroConfig),
    rawDbSpeed, 
    rawDbGravity, 
    rawDbCount, 
    rawDbMinSize, 
    rawDbMaxSize
  ]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 9999 }}
      aria-hidden="true"
    />
  );
}
