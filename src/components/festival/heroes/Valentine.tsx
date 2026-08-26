'use client';

import React, { useEffect, useRef } from 'react';

// Strict TypeScript Interface for Vercel
interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  alpha: number;
  type: 'petal' | 'spark';
  rotation: number;
  rotSpeed: number;
}

export default function ValentineVisual() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 🚀 SUBTLE FLOATING PARTICLES (Canvas Engine)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = (canvas.width = canvas.parentElement?.clientWidth || 320);
    let H = (canvas.height = canvas.parentElement?.clientHeight || 280);
    let animationId: number;

    const resize = () => {
      if (!canvas) return;
      W = canvas.width = canvas.parentElement?.clientWidth || 320;
      H = canvas.height = canvas.parentElement?.clientHeight || 280;
    };
    window.addEventListener('resize', resize);

    const particles: Particle[] = [];

    for (let i = 0; i < 20; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        size: Math.random() * 3.5 + 1.5,
        speedY: Math.random() * 0.5 + 0.2, // Smooth slow floating
        speedX: Math.random() * 0.3 - 0.15,
        alpha: Math.random() * 0.5 + 0.2,
        type: Math.random() > 0.5 ? 'petal' : 'spark',
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
      });
    }

    const drawPetal = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.alpha;

      const grad = ctx.createLinearGradient(0, -p.size * 2, 0, p.size * 2);
      grad.addColorStop(0, '#ff1a53');
      grad.addColorStop(1, '#990026');
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.moveTo(0, -p.size * 2);
      ctx.bezierCurveTo(p.size * 1.5, -p.size, p.size * 1.5, p.size, 0, p.size * 2);
      ctx.bezierCurveTo(-p.size * 1.5, p.size, -p.size * 1.5, -p.size, 0, -p.size * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawSpark = (p: Particle) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ff2b5e';
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, W, H);

      particles.forEach((p) => {
        p.y -= p.speedY;
        p.x += p.speedX + Math.sin(p.y * 0.015) * 0.3;
        p.rotation += p.rotSpeed;

        if (p.y < -15) {
          p.y = H + 15;
          p.x = Math.random() * W;
        }

        if (p.type === 'petal') drawPetal(p);
        else drawSpark(p);
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="relative flex items-center justify-center w-full h-64 my-2 select-none overflow-visible bg-transparent">
      
      {/* 🎆 FLOATING PARTICLES (Transparent Canvas) */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10 pointer-events-none" />

      {/* 💎 BIG TRANSPARENT RED 3D GLASS HEART */}
      <div className="relative z-20 flex items-center justify-center w-full h-full">
        
        {/* Soft Red Breathing Aura (Behind Heart) */}
        <div className="absolute w-44 h-44 bg-red-600/15 rounded-full blur-3xl animate-[breatheGlow_4s_ease-in-out_infinite]" />

        {/* 🌟 Massive 3D Transparent Red Heart */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="w-48 h-48 relative z-20 animate-[heartBreathe_4s_ease-in-out_infinite]"
        >
          <defs>
            {/* Transparent Red Liquid Glass Gradient */}
            <linearGradient id="redGlass2027" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.3)" />
              <stop offset="25%" stopColor="rgba(255, 30, 80, 0.25)" />
              <stop offset="70%" stopColor="rgba(220, 20, 60, 0.4)" />
              <stop offset="100%" stopColor="rgba(140, 10, 30, 0.55)" />
            </linearGradient>

            {/* Glowing Red Neon Stroke */}
            <linearGradient id="redStrokeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#ff3366" />
              <stop offset="75%" stopColor="#e60039" />
              <stop offset="100%" stopColor="#800020" />
            </linearGradient>

            {/* Realistic Neon Glow Shadow */}
            <filter id="pureRedGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#ff003c" floodOpacity="0.65" />
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ffffff" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Main Transparent Heart */}
          <path
            fill="url(#redGlass2027)"
            stroke="url(#redStrokeGlow)"
            strokeWidth="1.2"
            filter="url(#pureRedGlow)"
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />

          {/* 3D Curved Gloss Light Reflection (Top Left) */}
          <path
            d="M7.5 5.5C5.8 5.5 4.5 6.8 4.5 8.5c0 1.2.6 2.4 1.8 3.5"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />

          {/* 3D Curved Light Reflection (Top Right) */}
          <path
            d="M16.5 5.5C17.5 5.5 18.5 6.2 19 7"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />

          {/* Gloss Sparkle Dot */}
          <circle cx="8" cy="7.2" r="1.2" fill="rgba(255,255,255,0.9)" />
        </svg>
      </div>

      {/* 🌬️ ORGANIC SLOW NATURAL BREATHING ANIMATION */}
      <style jsx global>{`
        @keyframes heartBreathe {
          0%, 100% {
            transform: scale(0.95);
            filter: drop-shadow(0 0 15px rgba(255, 0, 60, 0.4));
          }
          50% {
            transform: scale(1.06);
            filter: drop-shadow(0 0 35px rgba(255, 0, 60, 0.8));
          }
        }

        @keyframes breatheGlow {
          0%, 100% {
            transform: scale(0.85);
            opacity: 0.2;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.45;
          }
        }
      `}</style>

    </div>
  );
}
