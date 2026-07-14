'use client';

import { useEffect, useRef } from 'react';

/* ═══════════════════════════════════════════════════════════════
   TYPES & CONSTANTS
   ═══════════════════════════════════════════════════════════════ */
interface NeonConfig {
  ringCount: number;
  radius: number;
  speed: number;
  colors: string[];
  glowIntensity: number;
  trailLength: number; // 0.1 to 1.0
  spiral: boolean;
}

interface NeonParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  rotation: number;
  rotSpeed: number;
  life: number;
  maxLife: number;
  tp: 'petal' | 'sparkle' | 'confetti';
}

const DEFAULT_NEON: NeonConfig = {
  ringCount: 2,
  radius: 120,
  speed: 0.03,
  colors: ['#00f5d4', '#8338ec'],
  glowIntensity: 15,
  trailLength: 0.4,
  spiral: false,
};

const NEON_PRESETS: Record<string, { default: Partial<NeonConfig> }> = {
  GANESH_CHATURTHI: {
    default: { ringCount: 3, radius: 110, speed: 0.02, colors: ['#f97316', '#fbbf24', '#ffffff'], glowIntensity: 20, spiral: true }
  },
  HANUMAN_JAYANTI: {
    default: { ringCount: 2, radius: 130, speed: 0.04, colors: ['#dc2626', '#f97316'], glowIntensity: 25, spiral: false }
  },
  NAVRATRI: {
    default: { ringCount: 4, radius: 100, speed: -0.025, colors: ['#ff006e', '#ffbe0b', '#00f5d4'], glowIntensity: 15, spiral: true }
  },
  REPUBLIC_DAY: {
    default: { ringCount: 3, radius: 140, speed: 0.015, colors: ['#ff9933', '#ffffff', '#128807'], glowIntensity: 12, spiral: false }
  },
  INDEPENDENCE_DAY: {
    default: { ringCount: 3, radius: 140, speed: 0.015, colors: ['#ff9933', '#ffffff', '#128807'], glowIntensity: 12, spiral: false }
  }
};

export default function NeonEngine({
  preset,
  customRadius,
  customSpeed,
  customColors,
  customGlow,
}: {
  preset?: string;
  customRadius?: number;
  customSpeed?: number;
  customColors?: string[];
  customGlow?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafId = useRef<number>(0);
  const angleRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const normalizedPreset = (preset || '').toUpperCase().trim();
    const activePreset = NEON_PRESETS[normalizedPreset] || { default: DEFAULT_NEON };
    const config: NeonConfig = {
      ...DEFAULT_NEON,
      ...activePreset.default,
      ...(customRadius !== undefined && { radius: customRadius }),
      ...(customSpeed !== undefined && { speed: customSpeed }),
      ...(customColors && { colors: customColors }),
      ...(customGlow !== undefined && { glowIntensity: customGlow }),
    };

    // पार्टिकल पूल
    const particles: NeonParticle[] = [];
    const maxParticles = 90; // स्क्रीन पर सुंदर और संतुलित डेंसिटी

    const rn = (min: number, max: number) => min + Math.random() * (max - min);

    const setSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setSize();
    window.addEventListener('resize', setSize);

    // कोमल गेंदा/गुलाब की पंखुड़ी ड्रॉ करने की विधि
    const drawPetal = (c: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number, rot: number, color: string) => {
      c.save();
      c.translate(x, y);
      c.rotate(rot);
      c.globalAlpha = alpha;

      const grad = c.createLinearGradient(0, -size, 0, size);
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'rgba(0,0,0,0.15)'); // कोमल शैडो इफ़ेक्ट
      c.fillStyle = grad;

      c.beginPath();
      c.ellipse(0, 0, size * 0.42, size, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    };

    // टिमटिमाते सितारे (Sparkles)
    const drawSparkle = (c: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number, color: string) => {
      c.save();
      c.translate(x, y);
      c.globalAlpha = alpha * 0.85;
      c.strokeStyle = '#ffffff';
      c.lineWidth = 1.0;
      c.shadowBlur = size * 2;
      c.shadowColor = color;

      c.beginPath();
      c.moveTo(-size, 0); c.lineTo(size, 0);
      c.moveTo(0, -size); c.lineTo(0, size);
      c.stroke();
      c.restore();
    };

    // तिरंगा कंफेटी (Patriotic Confetti)
    const drawConfetti = (c: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number, rot: number, color: string) => {
      c.save();
      c.translate(x, y);
      c.rotate(rot);
      c.globalAlpha = alpha;
      c.fillStyle = color;
      c.fillRect(-size / 2, -size / 4, size, size * 0.5);
      c.restore();
    };

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);
      angleRef.current += config.speed;
      timeRef.current += 0.015;

      // ── 🚀 PARTICLE EMITTER (उत्सर्जन) ──
      if (particles.length < maxParticles) {
        if (normalizedPreset === 'GANESH_CHATURTHI' && Math.random() < 0.35) {
          const isPetal = Math.random() < 0.7;
          particles.push({
            x: rn(-20, w + 20),
            y: rn(-30, -10),
            vx: rn(-0.5, 0.5),
            vy: rn(1.0, 2.4),
            size: isPetal ? rn(5, 11) : rn(3, 7),
            alpha: 1,
            color: isPetal ? (Math.random() < 0.6 ? '#f97316' : '#ea580c') : '#fbbf24',
            rotation: rn(0, Math.PI * 2),
            rotSpeed: rn(-0.015, 0.015),
            life: 0,
            maxLife: rn(320, 520),
            tp: isPetal ? 'petal' : 'sparkle'
          });
        } else if (normalizedPreset === 'NAVRATRI' && Math.random() < 0.3) {
          // नवदुर्गा के लिए गुलाब की कोमल पंखुड़ियां
          particles.push({
            x: rn(-20, w + 20),
            y: rn(-30, -10),
            vx: rn(-0.4, 0.4),
            vy: rn(0.8, 2.0),
            size: rn(6, 12),
            alpha: 1,
            color: Math.random() < 0.7 ? '#f43f5e' : '#fbcfe8',
            rotation: rn(0, Math.PI * 2),
            rotSpeed: rn(-0.01, 0.01),
            life: 0,
            maxLife: rn(350, 550),
            tp: 'petal'
          });
        } else if (['REPUBLIC_DAY', 'INDEPENDENCE_DAY'].includes(normalizedPreset) && Math.random() < 0.3) {
          // राष्ट्रीय त्योहारों के लिए तिरंगे कागज़ के टुकड़े (Confetti)
          const cols = ['#ff9933', '#ffffff', '#128807'];
          particles.push({
            x: rn(-20, w + 20),
            y: rn(-30, -10),
            vx: rn(-0.6, 0.6),
            vy: rn(1.2, 2.6),
            size: rn(5, 10),
            alpha: 1,
            color: cols[Math.floor(Math.random() * cols.length)],
            rotation: rn(0, Math.PI * 2),
            rotSpeed: rn(-0.03, 0.03),
            life: 0,
            maxLife: rn(250, 420),
            tp: 'confetti'
          });
        }
      }

      // ── UPDATE & DRAW PARTICLES ──
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;

        // स्वाभाविक हवा का झोंका (Sway physics)
        p.vx += Math.sin(timeRef.current + p.y * 0.01) * 0.015;
        if (p.tp !== 'sparkle') p.rotation += p.rotSpeed;

        const lt = p.life / p.maxLife;
        p.alpha = lt < 0.85 ? 1 : (1 - lt) / 0.15;

        if (p.life >= p.maxLife || p.y > h + 30) {
          particles.splice(i, 1);
          continue;
        }

        if (p.tp === 'petal') {
          drawPetal(ctx, p.x, p.y, p.size, p.alpha, p.rotation, p.color);
        } else if (p.tp === 'sparkle') {
          drawSparkle(ctx, p.x, p.y, p.size, p.alpha, p.color);
        } else if (p.tp === 'confetti') {
          drawConfetti(ctx, p.x, p.y, p.size, p.alpha, p.rotation, p.color);
        }
      }

      // ── MASTER NEON RINGS DRAW ──
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.shadowBlur = config.glowIntensity;

      for (let i = 0; i < config.ringCount; i++) {
        const ringAngle = angleRef.current * (1 + i * 0.1) + (i * Math.PI) / 3;
        const color = config.colors[i % config.colors.length];
        const rad = config.radius * (1 + (config.spiral ? i * 0.15 : 0));

        ctx.shadowColor = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.arc(cx, cy, rad, ringAngle, ringAngle + Math.PI * 2 * config.trailLength);
        ctx.stroke();

        const headX = cx + Math.cos(ringAngle + Math.PI * 2 * config.trailLength) * rad;
        const headY = cy + Math.sin(ringAngle + Math.PI * 2 * config.trailLength) * rad;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(headX, headY, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      rafId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId.current);
      window.removeEventListener('resize', setSize);
    };
  }, [preset, customRadius, customSpeed, customColors, customGlow]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 4 }} />;
}
