'use client';

import React, { useEffect, useRef } from 'react';

// Strict TypeScript Interface for Vercel
interface Sparkle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  alpha: number;
  pulseSpeed: number;
}

export default function ValentineVisual() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 🚀 Floating Bokeh / Sparks (Lightweight Canvas)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = (canvas.width = canvas.parentElement?.clientWidth || 320);
    let H = (canvas.height = canvas.parentElement?.clientHeight || 240);
    let animationId: number;

    const resize = () => {
      if (!canvas) return;
      W = canvas.width = canvas.parentElement?.clientWidth || 320;
      H = canvas.height = canvas.parentElement?.clientHeight || 240;
    };
    window.addEventListener('resize', resize);

    const sparks: Sparkle[] = [];

    for (let i = 0; i < 22; i++) {
      sparks.push({
        x: Math.random() * W,
        y: Math.random() * H,
        size: Math.random() * 3 + 1,
        speedY: Math.random() * 0.4 + 0.15,
        speedX: Math.random() * 0.2 - 0.1,
        alpha: Math.random() * 0.7 + 0.3,
        pulseSpeed: Math.random() * 0.03 + 0.01,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, W, H);

      sparks.forEach((s) => {
        s.y -= s.speedY;
        s.x += s.speedX + Math.sin(s.y * 0.02) * 0.2;
        s.alpha += Math.sin(s.y * 0.05) * 0.02;

        if (s.y < -10) {
          s.y = H + 10;
          s.x = Math.random() * W;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0.1, Math.min(1, s.alpha));
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff2b5e';
        ctx.fillStyle = '#fff0f5';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
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
    <div className="relative flex items-center justify-center w-full h-56 my-0 select-none overflow-visible bg-transparent">
      
      {/* 🎆 1. FLOATING BOKEH/SPARKS LAYER */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10 pointer-events-none" />

      {/* 🌌 2. NATURAL RED AMBIENT GLOW */}
      <div className="absolute w-44 h-44 bg-rose-600/20 rounded-full blur-3xl animate-[breatheGlow_4.5s_ease-in-out_infinite]" />

      {/* 💎 3. CINEMATIC 3D VELVET RED HEART */}
      <div className="relative z-20 flex items-center justify-center animate-[heartBreathe_4.5s_ease-in-out_infinite]">
        
        {/* Soft Shadow Base */}
        <div className="absolute -bottom-2 w-28 h-6 bg-black/40 blur-lg rounded-full" />

        {/* Photorealistic 3D Heart Visual */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="w-40 h-40 filter drop-shadow-[0_12px_28px_rgba(225,29,72,0.55)]"
        >
          <defs>
            {/* Rich Velvet 3D Red Shading */}
            <radialGradient id="velvet3D" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#ff4d6d" />
              <stop offset="40%" stopColor="#e11d48" />
              <stop offset="75%" stopColor="#9f1239" />
              <stop offset="100%" stopColor="#4c0519" />
            </radialGradient>

            {/* Top Gloss Reflection */}
            <linearGradient id="softGloss" x1="0%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.7)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </linearGradient>
          </defs>

          {/* Solid 3D Curvature Heart Body */}
          <path
            fill="url(#velvet3D)"
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />

          {/* 3D Highlight Curve */}
          <path
            d="M7.5 4.5 C 5 4.5, 3.8 6.5, 3.8 8.5 C 3.8 11.5, 6.5 14, 9 16"
            stroke="url(#softGloss)"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Center Light Reflection */}
          <ellipse cx="8.5" cy="7.5" rx="3.5" ry="2" transform="rotate(-30 8.5 7.5)" fill="url(#softGloss)" />
        </svg>

      </div>

      {/* 🌬️ SMOOTH BREATHING ANIMATION */}
      <style jsx global>{`
        @keyframes heartBreathe {
          0%, 100% {
            transform: scale(0.96) translateY(0px);
          }
          50% {
            transform: scale(1.05) translateY(-4px);
          }
        }

        @keyframes breatheGlow {
          0%, 100% {
            transform: scale(0.9);
            opacity: 0.25;
          }
          50% {
            transform: scale(1.25);
            opacity: 0.55;
          }
        }
      `}</style>

    </div>
  );
}
