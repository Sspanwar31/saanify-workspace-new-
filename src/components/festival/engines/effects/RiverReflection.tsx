'use client';

import { useEffect, useRef } from 'react';

function sr(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

interface Reflection {
  x: number;
  y: number;
  width: number;
  height: number;
  alpha: number;
  speed: number;
  phase: number;
  gold: boolean;
}

export default function RiverReflection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId = 0;
    let reflections: Reflection[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      reflections = [];

      const w = rect.width;
      const h = rect.height;

      // Broken cinematic reflections
      for (let i = 0; i < 45; i++) {
        reflections.push({
          x: sr(i * 17 + 3) * w,
          y: sr(i * 29 + 7) * h,
          width: 8 + sr(i * 41 + 11) * 55,
          height: 1 + sr(i * 53 + 17) * 3,
          alpha: 0.04 + sr(i * 61 + 23) * 0.18,
          speed: 0.15 + sr(i * 71 + 31) * 0.5,
          phase: sr(i * 83 + 37) * Math.PI * 2,
          gold: sr(i * 97 + 43) > 0.35,
        });
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const animate = (time: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      ctx.clearRect(0, 0, w, h);

      // 1. WATER DEPTH
      const waterGrad = ctx.createLinearGradient(0, 0, 0, h);
      waterGrad.addColorStop(0, 'rgba(5,15,30,0.05)');
      waterGrad.addColorStop(0.35, 'rgba(8,20,38,0.18)');
      waterGrad.addColorStop(1, 'rgba(2,8,18,0.55)');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. SOFT GOLDEN ATMOSPHERIC GLOW
      const glowX = w * 0.5;
      const glow = ctx.createRadialGradient(glowX, h * 0.15, 0, glowX, h * 0.15, w * 0.42);
      glow.addColorStop(0, 'rgba(255,215,120,0.12)');
      glow.addColorStop(0.45, 'rgba(255,190,80,0.045)');
      glow.addColorStop(1, 'rgba(255,180,60,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // 3. BROKEN LIGHT REFLECTIONS
      reflections.forEach((r, i) => {
        const wave = Math.sin(time * 0.001 * r.speed + r.phase) * 7;
        const x = r.x + wave;
        const depth = r.y / h;
        const alpha = r.alpha * (0.35 + depth * 0.9) * (0.75 + Math.sin(time * 0.0015 + i) * 0.25);

        ctx.globalAlpha = Math.max(0, alpha);

        const grad = ctx.createLinearGradient(x - r.width, 0, x + r.width, 0);

        if (r.gold) {
          grad.addColorStop(0, 'rgba(255,190,70,0)');
          grad.addColorStop(0.35, 'rgba(255,215,120,0.5)');
          grad.addColorStop(0.5, 'rgba(255,240,180,0.8)');
          grad.addColorStop(0.7, 'rgba(255,215,120,0.5)');
          grad.addColorStop(1, 'rgba(255,190,70,0)');
        } else {
          grad.addColorStop(0, 'rgba(160,200,230,0)');
          grad.addColorStop(0.5, 'rgba(180,215,240,0.22)');
          grad.addColorStop(1, 'rgba(160,200,230,0)');
        }

        ctx.fillStyle = grad;
        ctx.fillRect(x - r.width, r.y, r.width * 2, r.height);
      });

      ctx.globalAlpha = 1;

      // 4. MOVING RIPPLE BANDS
      for (let i = 0; i < 18; i++) {
        const y = ((i / 18) * h + time * (0.012 + i * 0.0007)) % h;
        const center = w * 0.5 + Math.sin(time * 0.0005 + i) * w * 0.08;
        const width = 50 + Math.sin(time * 0.001 + i * 2) * 30;
        const rippleAlpha = 0.035 + (i % 4) * 0.012;

        const gradient = ctx.createLinearGradient(center - width, 0, center + width, 0);
        gradient.addColorStop(0, 'rgba(255,220,140,0)');
        gradient.addColorStop(0.5, `rgba(255,225,150,${rippleAlpha})`);
        gradient.addColorStop(1, 'rgba(255,220,140,0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(center - width, y, width * 2, 1.5);
      }

      // 5. SMALL SHIMMER PARTICLES
      for (let i = 0; i < 18; i++) {
        const px = sr(i * 137 + 17) * w;
        const py = sr(i * 191 + 31) * h;
        const flicker = 0.2 + 0.8 * ((Math.sin(time * 0.002 + i * 2.7) + 1) / 2);

        ctx.globalAlpha = 0.08 * flicker;
        ctx.fillStyle = '#ffe8a8';
        ctx.beginPath();
        ctx.arc(px, py, 0.8 + sr(i * 43) * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;

      // 6. TOP FADE
      const fade = ctx.createLinearGradient(0, 0, 0, h);
      fade.addColorStop(0, 'rgba(0,0,0,0.92)');
      fade.addColorStop(0.18, 'rgba(0,0,0,0.45)');
      fade.addColorStop(0.45, 'rgba(0,0,0,0.08)');
      fade.addColorStop(1, 'rgba(0,0,0,0)');
      
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, w, h);

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute bottom-0 left-0 w-full pointer-events-none"
      style={{
        height: '32%',
        zIndex: 2,
      }}
    />
  );
}
