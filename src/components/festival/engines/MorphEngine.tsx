'use client';

import { useEffect, useRef } from 'react';

interface Point {
  x: number;
  y: number;
}

interface MorphConfig {
  pointCount: number;
  speed: number;
  colors: string[];
  scale: number;
}

// पार्टिकल का इंटरफ़ेस
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  life: number;
  maxLife: number;
  spin: number;
  spinSpd: number;
  tp: 'heart' | 'sparkle';
}

const DEFAULT_MORPH: MorphConfig = {
  pointCount: 60,
  speed: 0.015,
  colors: ['#ec4899', '#f43f5e'],
  scale: 1.2,
};

// विभिन्न आकृतियों के लिए गणितीय पॉइंट जनरेटर
const getShapePoints = (type: string, count: number, time: number): Point[] => {
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    let r = 100;

    if (type === 'HEART') {
      const x = 16 * Math.pow(Math.sin(angle), 3);
      const y = -(13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle));
      points.push({ x: x * 6, y: y * 6 });
      continue;
    } else if (type === 'ROSE') {
      const k = 5;
      r = 100 * Math.sin(k * angle + time);
    } else if (type === 'MANDALA' || type === 'RANGOLI') {
      r = 90 + Math.sin(8 * angle) * 25 + Math.cos(4 * angle) * 10;
    } else {
      r = 100 + Math.sin(time + i) * 3;
    }

    points.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
    });
  }
  return points;
};

const MORPH_PRESETS: Record<string, { default: Partial<MorphConfig>; shapes: string[] }> = {
  VALENTINES_DAY: {
    default: { colors: ['#f43f5e', '#ec4899', '#fda4af'] },
    shapes: ['ROSE', 'HEART'] 
  },
  NEW_YEAR: {
    default: { colors: ['#fbbf24', '#f59e0b', '#ffffff'] },
    shapes: ['MANDALA', 'CIRCLE']
  }
};

export default function MorphEngine({
  preset,
  customSpeed,
  customColors,
  customScale,
}: {
  preset?: string;
  customSpeed?: number;
  customColors?: string[];
  customScale?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafId = useRef<number>(0);
  const progressRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const normalizedPreset = (preset || '').toUpperCase().trim();
    const activePreset = MORPH_PRESETS[normalizedPreset] || { default: DEFAULT_MORPH, shapes: ['CIRCLE', 'MANDALA'] };
    
    const config: MorphConfig = {
      ...DEFAULT_MORPH,
      ...activePreset.default,
      ...(customSpeed !== undefined && { speed: customSpeed }),
      ...(customColors && { colors: customColors }),
      ...(customScale !== undefined && { scale: customScale }),
    };

    // पार्टिकल पूल
    const particles: Particle[] = [];
    const maxParticles = 120;

    const rn = (min: number, max: number) => min + Math.random() * (max - min);

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

    // बारीक हार्ट ड्रॉ करने की विधि
    const drawHeartParticle = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      alpha: number,
      spin: number,
      color: string
    ) => {
      c.save();
      c.translate(x, y);
      c.rotate(spin);
      c.globalAlpha = alpha;
      c.fillStyle = color;
      c.shadowBlur = size * 1.5;
      c.shadowColor = color;

      c.beginPath();
      const scale = size * 0.12;
      c.moveTo(0, -scale * 5);
      c.bezierCurveTo(-scale * 10, -scale * 12, -scale * 20, -scale * 2, 0, scale * 12);
      c.bezierCurveTo(scale * 20, -scale * 2, scale * 10, -scale * 12, 0, -scale * 5);
      c.closePath();
      c.fill();
      c.restore();
    };

    // सितारे / स्पार्कल ड्रॉ करने की विधि
    const drawSparkleParticle = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      alpha: number,
      color: string
    ) => {
      c.save();
      c.translate(x, y);
      c.globalAlpha = alpha;
      c.strokeStyle = color;
      c.lineWidth = 1.5;
      c.shadowBlur = size * 2;
      c.shadowColor = color;

      c.beginPath();
      c.moveTo(-size, 0); c.lineTo(size, 0);
      c.moveTo(0, -size); c.lineTo(0, size);
      c.stroke();
      c.restore();
    };

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width > 0 ? rect.width : window.innerWidth;
      const h = rect.height > 0 ? rect.height : window.innerHeight;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      progressRef.current += config.speed;
      timeRef.current += 0.02;

      const t = (Math.sin(progressRef.current) + 1) / 2;

      const shape1 = activePreset.shapes[0];
      const shape2 = activePreset.shapes[1] || activePreset.shapes[0];

      const p1 = getShapePoints(shape1, config.pointCount, timeRef.current);
      const p2 = getShapePoints(shape2, config.pointCount, timeRef.current);

      // ── PARTICLE EMITTER (उत्सर्जन) ──
      if (particles.length < maxParticles) {
        if (normalizedPreset === 'VALENTINES_DAY' && Math.random() < 0.28) {
          // खूबसूरत गुलाबी/लाल दिल उत्सर्जित करें
          particles.push({
            x: cx + rn(-25, 25),
            y: cy + rn(-25, 25),
            vx: rn(-1.2, 1.2),
            vy: rn(-2.5, -0.8),
            size: rn(6, 13),
            alpha: 1,
            color: config.colors[Math.floor(Math.random() * config.colors.length)],
            life: 0,
            maxLife: rn(100, 180),
            spin: rn(0, Math.PI * 2),
            spinSpd: rn(-0.02, 0.02),
            tp: 'heart',
          });
        } else if (normalizedPreset === 'NEW_YEAR' && Math.random() < 0.25) {
          // खूबसूरत सुनहरे सितारे उत्सर्जित करें
          particles.push({
            x: cx + rn(-40, 40),
            y: cy + rn(-40, 40),
            vx: rn(-1.5, 1.5),
            vy: rn(-1.8, 1.5),
            size: rn(4, 9),
            alpha: 1,
            color: config.colors[Math.floor(Math.random() * config.colors.length)],
            life: 0,
            maxLife: rn(80, 140),
            spin: 0,
            spinSpd: 0,
            tp: 'sparkle',
          });
        }
      }

      // ── UPDATE & DRAW PARTICLES ──
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;

        // कोमल हवा का बहाव (Sway movement)
        if (p.tp === 'heart') {
          p.vx += Math.sin(timeRef.current * 2 + p.y * 0.01) * 0.03;
          p.spin += p.spinSpd;
        }

        const lt = p.life / p.maxLife;
        p.alpha = 1 - lt;

        if (p.life >= p.maxLife || p.y < -50 || p.x < -50 || p.x > w + 50) {
          particles.splice(i, 1);
          continue;
        }

        if (p.tp === 'heart') {
          drawHeartParticle(ctx, p.x, p.y, p.size, p.alpha, p.spin, p.color);
        } else {
          drawSparkleParticle(ctx, p.x, p.y, p.size, p.alpha, p.color);
        }
      }

      // ── MASTER SHAPE DRAW (मुख्य आकृतियाँ) ──
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(config.scale, config.scale);
      ctx.shadowBlur = 18;
      ctx.shadowColor = config.colors[0];

      ctx.beginPath();
      for (let i = 0; i < config.pointCount; i++) {
        const mx = p1[i].x * (1 - t) + p2[i].x * t;
        const my = p1[i].y * (1 - t) + p2[i].y * t;

        if (i === 0) ctx.moveTo(mx, my);
        else ctx.lineTo(mx, my);
      }
      ctx.closePath();

      const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, 150);
      grad.addColorStop(0, config.colors[0] + '33'); 
      grad.addColorStop(1, config.colors[1] + 'aa');

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = grad;
      ctx.fill();

      ctx.restore();
      rafId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId.current);
      window.removeEventListener('resize', setSize);
    };
  }, [preset, customSpeed, customColors, customScale]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 4 }} />;
}
