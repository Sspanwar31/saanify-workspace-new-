'use client';

import { useEffect, useRef } from 'react';

interface WaveParticle {
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
  type: 'petal' | 'stardust';
}

export default function WaveEngine({ preset }: { preset?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafId = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const particles = useRef<WaveParticle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rn = (min: number, max: number) => min + Math.random() * (max - min);

    const setSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setSize();
    window.addEventListener('resize', setSize);

    // Pre-fill particles on load
    const wInit = canvas.getBoundingClientRect().width;
    const hInit = canvas.getBoundingClientRect().height;
    for (let i = 0; i < 55; i++) {
      const isPetal = Math.random() < 0.4;
      particles.current.push({
        x: rn(0, wInit),
        y: rn(0, hInit),
        vx: rn(-0.4, 0.4),
        vy: rn(0.8, 1.8),
        size: isPetal ? rn(4, 7) : rn(1.0, 2.5),
        alpha: rn(0.3, 0.8),
        color: isPetal ? (Math.random() < 0.6 ? '#f43f5e' : '#fbcfe8') : '#e2e8f0',
        rotation: rn(0, Math.PI * 2),
        rotSpeed: rn(-0.02, 0.02),
        life: rn(0, 200),
        maxLife: rn(300, 500),
        type: isPetal ? 'petal' : 'stardust',
      });
    }

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);
      timeRef.current += 0.018;

      // 1. DELICATE MOONLIGHT RIPPLE LINES (NO HEAVY SOLID FILLS!)
      const baseHeight = h * 0.84;
      ctx.save();
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.18)'; // Soft Silver Lines
      ctx.lineWidth = 1.0;

      for (let i = 0; i < 5; i++) {
        const y = baseHeight + i * 12;
        const currentOffset = timeRef.current * (1 + i * 0.2);
        const currentAmp = 5 * (1 - i * 0.15);

        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= w; x += 15) {
          const waveY = y + Math.sin(x * 0.01 + currentOffset) * currentAmp;
          ctx.lineTo(x, waveY);
        }
        ctx.stroke();
      }
      ctx.restore();

      // 2. FLOATING ROSE PETALS & SILVER STARDUST
      if (particles.current.length < 75 && Math.random() < 0.4) {
        const isPetal = Math.random() < 0.4;
        particles.current.push({
          x: rn(-10, w + 10),
          y: -10,
          vx: rn(-0.5, 0.5),
          vy: rn(0.8, 2.0),
          size: isPetal ? rn(4, 7) : rn(1.0, 2.5),
          alpha: rn(0.4, 0.85),
          color: isPetal ? (Math.random() < 0.6 ? '#f43f5e' : '#fbcfe8') : '#e2e8f0',
          rotation: rn(0, Math.PI * 2),
          rotSpeed: rn(-0.02, 0.02),
          life: 0,
          maxLife: rn(300, 500),
          type: isPetal ? 'petal' : 'stardust',
        });
      }

      particles.current = particles.current.filter((p) => {
        p.life++;
        p.x += p.vx + Math.sin(timeRef.current + p.y * 0.01) * 0.2;
        p.y += p.vy;
        p.rotation += p.rotSpeed;

        const lt = p.life / p.maxLife;
        const currentAlpha = lt < 0.8 ? p.alpha : p.alpha * ((1 - lt) / 0.2);

        if (p.life < p.maxLife && p.y < h + 20 && currentAlpha > 0.01) {
          ctx.save();
          ctx.globalAlpha = currentAlpha;

          if (p.type === 'petal') {
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = currentAlpha * 0.35;
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
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
    };
  }, [preset]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[4]"
    />
  );
}
