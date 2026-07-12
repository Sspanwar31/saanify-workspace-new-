'use client';

import { useEffect, useRef } from 'react';

// पार्टिकल का इंटरफ़ेस (🚀 विस्तारित विविधता)
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
  tp: 'heart' | 'tinyH' | 'sparkle' | 'bubble';
}

const DEFAULT_COLORS = ['#f43f5e', '#ec4899', '#fda4af'];

const PRESET_COLORS: Record<string, string[]> = {
  VALENTINES_DAY: ['#f43f5e', '#ec4899', '#fda4af', '#f43f5e'],
  NEW_YEAR: ['#fbbf24', '#f59e0b', '#ffffff']
};

export default function MorphEngine({
  preset,
  customColors,
  customScale, // 🚀 डेटाबेस स्केल को रीड करने के लिए एक्टिव किया गया
}: {
  preset?: string;
  customColors?: string[];
  customScale?: number;
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
    
    // डेटाबेस से स्केल प्राप्त करना (डिफ़ॉल्ट 0.55 जो कि बहुत नाजुक और सुंदर है)
    const scaleFactor = customScale ?? 0.55;

    const particles: Particle[] = [];
    const maxParticles = 120; // सघन और कोमल बारिश के लिए संतुलन

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

    // 1. कोमल 3D आउटलाइन दिल ड्रॉ करने की विधि
    const drawHeartParticle = (c: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number, spin: number, color: string) => {
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

    // 2. नन्हा सॉलिड डार्क-रेड दिल ड्रॉ करने की विधि (Tiny Solid Heart)
    const drawTinyHeartParticle = (c: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number, color: string) => {
      c.save();
      c.translate(x, y);
      c.globalAlpha = alpha;
      c.fillStyle = color;

      c.beginPath();
      const scale = size * 0.1;
      c.moveTo(0, -scale * 4);
      c.bezierCurveTo(-scale * 8, -scale * 10, -scale * 16, -scale * 1, 0, scale * 10);
      c.bezierCurveTo(scale * 16, -scale * 1, scale * 8, -scale * 10, 0, -scale * 4);
      c.closePath();
      c.fill();
      c.restore();
    };

    // 3. गिरते हुए टिमटिमाते सितारे ड्रॉ करने की विधि (Sparkles)
    const drawSparkleParticle = (c: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number, color: string) => {
      c.save();
      c.translate(x, y);
      c.globalAlpha = alpha * 0.8;
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

    // 4. पारदर्शी बोकेह सर्कल्स ड्रॉ करने की विधि (Bokeh Bubbles)
    const drawBubbleParticle = (c: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number, color: string) => {
      c.save();
      c.translate(x, y);
      c.globalAlpha = alpha * 0.25; // बहुत ही पारदर्शी और सॉफ्ट
      
      const grad = c.createRadialGradient(0, 0, 0, 0, 0, size);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      
      c.fillStyle = grad;
      c.beginPath();
      c.arc(0, 0, size, 0, Math.PI * 2);
      c.fill();
      c.restore();
    };

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width > 0 ? rect.width : window.innerWidth;
      const h = rect.height > 0 ? rect.height : window.innerHeight;

      ctx.clearRect(0, 0, w, h);
      timeRef.current += 0.015;

      // ── SCREEN-WIDE EMITTER (उत्सर्जन) ──
      if (particles.length < maxParticles) {
        if (normalizedPreset === 'VALENTINES_DAY' && Math.random() < 0.38) {
          const randType = Math.random();
          let tp: Particle['tp'] = 'heart';
          let size = rn(7, 14) * scaleFactor;
          let color = colors[Math.floor(Math.random() * colors.length)];

          if (randType < 0.4) {
            tp = 'heart'; // 40% Outline Glow Hearts
          } else if (randType < 0.7) {
            tp = 'tinyH';  // 30% Tiny Solid Red/Rose Hearts
            size = rn(4, 8) * scaleFactor;
            color = '#991b1b'; // गहरे लाल रंग का शेड
          } else if (randType < 0.85) {
            tp = 'sparkle'; // 15% Soft Sparkles
            size = rn(3, 7) * scaleFactor;
          } else {
            tp = 'bubble';  // 15% Deep Bokeh Bubbles
            size = rn(12, 22) * scaleFactor;
          }

          particles.push({
            x: rn(-20, w + 20),
            y: rn(-40, -10),
            vx: rn(-0.4, 0.4),
            vy: rn(0.8, 2.2), // कोमल गति
            size,
            alpha: 1,
            color,
            life: 0,
            maxLife: rn(350, 580),
            spin: rn(0, Math.PI * 2),
            spinSpd: rn(-0.012, 0.012),
            tp,
          });
        } else if (normalizedPreset === 'NEW_YEAR' && Math.random() < 0.32) {
          particles.push({
            x: rn(-20, w + 20),
            y: rn(-30, -10),
            vx: rn(-0.6, 0.6),
            vy: rn(0.8, 2.2),
            size: rn(4, 9) * scaleFactor,
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

      // ── UPDATE & DRAW PARTICLES ──
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;

        // कोमल हवा का बहाव
        if (p.tp === 'heart' || p.tp === 'tinyH') {
          p.vx += Math.sin(timeRef.current + p.y * 0.01) * 0.018;
          p.spin += p.spinSpd;
        } else if (p.tp === 'bubble') {
          p.vx += Math.sin(timeRef.current * 0.5 + p.y * 0.01) * 0.01;
        }

        const lt = p.life / p.maxLife;
        p.alpha = lt < 0.85 ? 1 : (1 - lt) / 0.15;

        if (p.life >= p.maxLife || p.y > h + 30 || p.x < -50 || p.x > w + 50) {
          particles.splice(i, 1);
          continue;
        }

        // टाइप के आधार पर रेंडर करें
        if (p.tp === 'heart') {
          drawHeartParticle(ctx, p.x, p.y, p.size, p.alpha, p.spin, p.color);
        } else if (p.tp === 'tinyH') {
          drawTinyHeartParticle(ctx, p.x, p.y, p.size, p.alpha, p.color);
        } else if (p.tp === 'sparkle') {
          drawSparkleParticle(ctx, p.x, p.y, p.size, p.alpha, p.color);
        } else if (p.tp === 'bubble') {
          drawBubbleParticle(ctx, p.x, p.y, p.size, p.alpha, p.color);
        }
      }

      rafId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId.current);
      window.removeEventListener('resize', setSize);
    };
  }, [preset, customColors, customScale]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 4 }} />;
}
