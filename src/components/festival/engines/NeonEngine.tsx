'use client';

import { useEffect, useRef } from 'react';

/* ═══════════════════════════════════════════════════════════════
   TYPES & CONSTANTS
   ═══════════════════════════════════════════════════════════════ */
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

const DEFAULT_COLORS = ['#f97316', '#fbbf24', '#ffffff'];

const PRESET_COLORS: Record<string, string[]> = {
  GANESH_CHATURTHI: ['#f97316', '#fbbf24', '#ffffff', '#ea580c'],
  HANUMAN_JAYANTI: ['#dc2626', '#f97316'],
  NAVRATRI: ['#f43f5e', '#fbcfe8', '#ffffff'],
  REPUBLIC_DAY: ['#ff9933', '#ffffff', '#128807'],
  INDEPENDENCE_DAY: ['#ff9933', '#ffffff', '#128807']
};

export default function NeonEngine({
  preset,
  customColors,
  customScale,     // 🚀 डेटाबेस 'scale' से जुड़ेगा (आकार नियंत्रक)
  customGravity,   // 🚀 डेटाबेस 'customGravity' से जुड़ेगा (नीचे गिरने का खिंचाव)
  customSpeed,     // 🚀 डेटाबेस 'customSpeed' से जुड़ेगा (गिरने की गति)
  customMinSize,   // 🚀 डेटाबेस 'customMinSize' से जुड़ेगा (न्यूनतम आकार)
  customMaxSize,   // 🚀 डेटाबेस 'customMaxSize' से जुड़ेगा (अधिकतम आकार)
  customMaxCount,  // 🚀 डेटाबेस 'customMaxCount' से जुड़ेगा (स्क्रीन पर पार्टिकल्स की अधिकतम संख्या)
}: {
  preset?: string;
  customColors?: string[];
  customScale?: number;
  customGravity?: number | null;
  customSpeed?: number | null;
  customMinSize?: number | null;
  customMaxSize?: number | null;
  customMaxCount?: number | null;
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

    // ── 🚀 DATABASE CONTROLLER WIRE-UP (बैकएंड सेटिंग्स मैपिंग) ──
    const scaleFactor = customScale ?? 0.55;
    const speedFactor = customSpeed ?? 1.0;
    const gravityFactor = customGravity ?? 0.003; // स्वाभाविक ग्रेविटी
    const maxParticles = customMaxCount ?? 90;

    const minPartSize = customMinSize ?? 5;
    const maxPartSize = customMaxSize ?? 11;

    // पार्टिकल पूल
    const particles: NeonParticle[] = [];
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

    // गेंदा/गुलाब की पंखुड़ी ड्रॉ करने की विधि
    const drawPetal = (c: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number, rot: number, color: string) => {
      c.save();
      c.translate(x, y);
      c.rotate(rot);
      c.globalAlpha = alpha;

      const grad = c.createLinearGradient(0, -size, 0, size);
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'rgba(0,0,0,0.15)');
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

      ctx.clearRect(0, 0, w, h);
      timeRef.current += 0.015;

      // ── SCREEN-WIDE EMITTER ──
      if (particles.length < maxParticles) {
        if (normalizedPreset === 'GANESH_CHATURTHI' && Math.random() < 0.35) {
          const isPetal = Math.random() < 0.7;
          particles.push({
            x: rn(-20, w + 20),
            y: rn(-30, -10),
            vx: rn(-0.5, 0.5),
            vy: rn(1.0, 2.4) * speedFactor, // 🚀 customSpeed से नियंत्रित
            size: isPetal ? rn(minPartSize, maxPartSize) * scaleFactor : rn(minPartSize * 0.6, maxPartSize * 0.6) * scaleFactor,
            alpha: 1,
            color: isPetal ? (Math.random() < 0.6 ? '#f97316' : '#ea580c') : '#fbbf24',
            rotation: rn(0, Math.PI * 2),
            rotSpeed: rn(-0.015, 0.015),
            life: 0,
            maxLife: rn(320, 520),
            tp: isPetal ? 'petal' : 'sparkle'
          });
        } else if (normalizedPreset === 'NAVRATRI' && Math.random() < 0.3) {
          particles.push({
            x: rn(-20, w + 20),
            y: rn(-30, -10),
            vx: rn(-0.4, 0.4),
            vy: rn(0.8, 2.0) * speedFactor,
            size: rn(minPartSize, maxPartSize) * scaleFactor,
            alpha: 1,
            color: Math.random() < 0.7 ? '#f43f5e' : '#fbcfe8',
            rotation: rn(0, Math.PI * 2),
            rotSpeed: rn(-0.01, 0.01),
            life: 0,
            maxLife: rn(350, 550),
            tp: 'petal'
          });
        } else if (['REPUBLIC_DAY', 'INDEPENDENCE_DAY'].includes(normalizedPreset) && Math.random() < 0.3) {
          const cols = ['#ff9933', '#ffffff', '#128807'];
          particles.push({
            x: rn(-20, w + 20),
            y: rn(-30, -10),
            vx: rn(-0.6, 0.6),
            vy: rn(1.2, 2.6) * speedFactor,
            size: rn(minPartSize, maxPartSize) * scaleFactor,
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

        // 🚀 customGravity को अप्लाई करना (ग्रेविटी फ़ोर्स)
        p.vy += gravityFactor;

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

      // ── 🚀 RINGS REMOVED (गोला यहाँ से पूरी तरह हटा दिया गया है) ──

      rafId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId.current);
      window.removeEventListener('resize', setSize);
    };
  }, [
    preset, 
    customRadius, 
    customSpeed, 
    customColors, 
    customGlow,
    customScale,
    customGravity,
    customMinSize,
    customMaxSize,
    customMaxCount
  ]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 4 }} />;
}
