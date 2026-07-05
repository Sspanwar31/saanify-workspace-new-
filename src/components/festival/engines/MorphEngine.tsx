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
      // शास्त्रीय कार्डियोइड दिल का समीकरण (Cardioid Heart shape)
      const x = 16 * Math.pow(Math.sin(angle), 3);
      const y = -(13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle));
      points.push({ x: x * 6, y: y * 6 });
      continue;
    } else if (type === 'ROSE') {
      // गुलाब का फूल (Mathematical Rose curve)
      const k = 5;
      r = 100 * Math.sin(k * angle + time);
    } else if (type === 'MANDALA' || type === 'RANGOLI') {
      // रंगोली आकृतियाँ
      r = 90 + Math.sin(8 * angle) * 25 + Math.cos(4 * angle) * 10;
    } else {
      // डिफ़ॉल्ट सर्कल
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
    shapes: ['ROSE', 'HEART'] // गुलाब से दिल में रूपांतरण होगा
  },
  NEW_YEAR: {
    default: { colors: ['#fbbf24', '#f59e0b', '#ffffff'] },
    shapes: ['MANDALA', 'CIRCLE']
  },
  DIWALI: {
    default: { colors: ['#f59e0b', '#ef4444', '#fffbeb'] },
    shapes: ['RANGOLI', 'MANDALA']
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

    const activePreset = MORPH_PRESETS[preset || ''] || { default: DEFAULT_MORPH, shapes: ['CIRCLE', 'MANDALA'] };
    const config: MorphConfig = {
      ...DEFAULT_MORPH,
      ...activePreset.default,
      ...(customSpeed !== undefined && { speed: customSpeed }),
      ...(customColors && { colors: customColors }),
      ...(customScale !== undefined && { scale: customScale }),
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

    const animate = () => {
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      progressRef.current += config.speed;
      timeRef.current += 0.02;

      // रूपांतरण प्रोग्रेस कैलकुलेशन (Smooth morph loop)
      const t = (Math.sin(progressRef.current) + 1) / 2;

      const shape1 = activePreset.shapes[0];
      const shape2 = activePreset.shapes[1] || activePreset.shapes[0];

      const p1 = getShapePoints(shape1, config.pointCount, timeRef.current);
      const p2 = getShapePoints(shape2, config.pointCount, timeRef.current);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(config.scale, config.scale);
      ctx.shadowBlur = 18;
      ctx.shadowColor = config.colors[0];

      ctx.beginPath();
      for (let i = 0; i < config.pointCount; i++) {
        // दो आकृतियों के कोणीय बिंदुओं को आपस में मर्ज करना (Linear Interpolation)
        const mx = p1[i].x * (1 - t) + p2[i].x * t;
        const my = p1[i].y * (1 - t) + p2[i].y * t;

        if (i === 0) ctx.moveTo(mx, my);
        else ctx.lineTo(mx, my);
      }
      ctx.closePath();

      const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, 150);
      grad.addColorStop(0, config.colors[0] + '33'); // हल्का 20% भरा हुआ बैकग्राउंड
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
