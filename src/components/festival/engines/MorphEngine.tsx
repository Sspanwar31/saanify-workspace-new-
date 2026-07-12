'use client';

import { useEffect, useRef } from 'react';

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

const DEFAULT_COLORS = ['#f43f5e', '#ec4899', '#fda4af'];

const PRESET_COLORS: Record<string, string[]> = {
  VALENTINES_DAY: ['#f43f5e', '#ec4899', '#fda4af', '#f43f5e'],
  NEW_YEAR: ['#fbbf24', '#f59e0b', '#ffffff']
};

export default function MorphEngine({
  preset,
  customColors,
}: {
  preset?: string;
  customColors?: string[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafId = useRef<number>(0);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const normalizedPreset = (preset || '').toUpperCase().trim();
    const colors = customColors || PRESET_COLORS[normalizedPreset] || DEFAULT_COLORS;

    // पार्टिकल पूल (स्क्रीन-वाइड बारिश के लिए आकार)
    const particles: Particle[] = [];
    const maxParticles = 100; // स्क्रीन पर एक बार में संतुलित संख्या

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

    // कोमल गिरता हुआ दिल ड्रॉ करने की विधि
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

    // गिरते हुए टिमटिमाते सितारे ड्रॉ करने की विधि (New Year के लिए)
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
      c.lineWidth = 1.2;
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

      ctx.clearRect(0, 0, w, h);
      timeRef.current += 0.015;

      // ── SCREEN-WIDE TOP EMITTER (ऊपर से बारिश शुरू करना) ──
      if (particles.length < maxParticles) {
        if (normalizedPreset === 'VALENTINES_DAY' && Math.random() < 0.35) {
          // पूरी स्क्रीन की चौड़ाई में कहीं भी ऊपर से नया दिल गिराएं
          particles.push({
            x: rn(-20, w + 20),
            y: rn(-40, -10), // स्क्रीन के ठीक ऊपर छुपा हुआ
            vx: rn(-0.5, 0.5), // कोमल हवा का बहाव
            vy: rn(1.0, 2.5),  // ऊपर से नीचे गिरने की सुखद गति
            size: rn(7, 14),   // सुंदर और स्पष्ट साइज़
            alpha: 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 0,
            maxLife: rn(350, 550), // लंबी लाइफ ताकि नीचे तक गिरे
            spin: rn(0, Math.PI * 2),
            spinSpd: rn(-0.015, 0.015),
            tp: 'heart',
          });
        } else if (normalizedPreset === 'NEW_YEAR' && Math.random() < 0.32) {
          // न्यू ईयर के लिए ऊपर से गिरते सुनहरे सितारे
          particles.push({
            x: rn(-20, w + 20),
            y: rn(-30, -10),
            vx: rn(-0.6, 0.6),
            vy: rn(0.8, 2.2),
            size: rn(4, 9),
            alpha: 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 0,
            maxLife: rn(250, 450),
            spin: 0,
            spinSpd: 0,
            tp: 'sparkle',
          });
        }
      }

      // ── UPDATE & DRAW PARTICLES (अपडेट और रेंडर) ──
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;

        // कोमल हवा में झूलने का प्रभाव (Gentle swaying physics)
        if (p.tp === 'heart') {
          p.vx += Math.sin(timeRef.current + p.y * 0.01) * 0.02;
          p.spin += p.spinSpd;
        } else {
          p.vx += Math.sin(timeRef.current * 1.5 + p.y * 0.01) * 0.015;
        }

        const lt = p.life / p.maxLife;
        
        // कोमल फेड-आउट (नीचे जाने पर या लाइफ खत्म होने पर गायब होना)
        p.alpha = lt < 0.85 ? 1 : (1 - lt) / 0.15;

        // यदि पार्टिकल सीमा पार कर जाए या अपनी लाइफ पूरी कर ले, तो डिलीट करें
        if (p.life >= p.maxLife || p.y > h + 30 || p.x < -50 || p.x > w + 50) {
          particles.splice(i, 1);
          continue;
        }

        if (p.tp === 'heart') {
          drawHeartParticle(ctx, p.x, p.y, p.size, p.alpha, p.spin, p.color);
        } else {
          drawSparkleParticle(ctx, p.x, p.y, p.size, p.alpha, p.color);
        }
      }

      rafId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId.current);
      window.removeEventListener('resize', setSize);
    };
  }, [preset, customColors]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 4 }} />;
}
