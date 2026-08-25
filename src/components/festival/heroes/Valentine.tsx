'use client';

import React, { useEffect, useRef } from 'react';

// 🚀 Particle Type Definition (Fixes TypeScript Build Errors)
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

  useEffect(() => {
    // Check for window/browser environment (Prevents SSR errors)
    if (typeof window === 'undefined') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = (canvas.width = canvas.parentElement?.clientWidth || 300);
    let H = (canvas.height = canvas.parentElement?.clientHeight || 256);
    let animationId: number;

    const particles: Particle[] = [];

    const resize = () => {
      if (!canvas) return;
      W = canvas.width = canvas.parentElement?.clientWidth || 300;
      H = canvas.height = canvas.parentElement?.clientHeight || 256;
    };
    window.addEventListener('resize', resize);

    // Initialize Particles
    for (let i = 0; i < 25; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H + H,
        size: Math.random() * 4 + 1,
        speedY: Math.random() * 0.8 + 0.3,
        speedX: Math.random() * 0.4 - 0.2,
        alpha: Math.random() * 0.6 + 0.2,
        type: Math.random() > 0.4 ? 'petal' : 'spark',
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.05,
      });
    }

    const drawPetal = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.alpha;

      const grad = ctx.createLinearGradient(0, -p.size * 2, 0, p.size * 2);
      grad.addColorStop(0, '#ff4d8d');
      grad.addColorStop(1, '#c40e4e');
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
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff0080';
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, W, H);

      particles.forEach((p) => {
        p.y -= p.speedY;
        p.x += p.speedX + Math.sin(p.y * 0.01) * 0.5;
        p.rotation += p.rotSpeed;

        if (p.y < -20) {
          p.y = H + 20;
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
    <div className="relative flex items-center justify-center w-full h-64 my-1 select-none overflow-hidden rounded-2xl">
      
      {/* 🌌 1. CINEMATIC DEEP NEBULA BACKGROUND */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a0111] via-[#0a0a0a] to-[#000000] z-0" />

      {/* 🎆 2. CANVAS PARTICLE LAYER */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10 pointer-events-none" />

      {/* 🪐 3. FUTURISTIC HOLOGRAPHIC ORBITING RINGS */}
      <div
        className="absolute z-20 w-52 h-52 rounded-full border border-pink-500/10 animate-[spin_25s_linear_infinite]"
        style={{ boxShadow: '0 0 30px rgba(244, 63, 94, 0.15) inset' }}
      />

      <div className="absolute z-20 w-40 h-40 rounded-full border border-rose-500/20 animate-[spin_15s_linear_infinite_reverse] flex items-start justify-center">
        <div className="w-2.5 h-2.5 bg-rose-500 rounded-full shadow-[0_0_12px_#f43f5e] -translate-y-1" />
      </div>

      {/* 💎 4. LIQUID GLASS POD & HEART */}
      <div className="relative z-30 flex items-center justify-center">
        
        {/* Ripple Waves */}
        <div className="absolute w-28 h-28 rounded-full border border-pink-400/30 animate-ping opacity-30" style={{ animationDuration: '2.5s' }} />
        <div className="absolute w-24 h-24 rounded-full border border-rose-500/20 animate-ping opacity-20" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />

        {/* Liquid Glass Container */}
        <div className="relative flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-b from-white/[0.08] to-pink-500/[0.02] backdrop-blur-xl border border-white/10 shadow-[0_10px_35px_0_rgba(244,63,94,0.35),inset_0_0_15px_rgba(255,255,255,0.05)]">
          
          {/* Inner Glow */}
          <div className="absolute w-16 h-16 bg-rose-600/30 rounded-full blur-xl animate-pulse" />

          {/* 3D SVG Heart */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="w-14 h-14 relative z-20 animate-[heartbeat_1.5s_ease-in-out_infinite]"
          >
            <defs>
              <linearGradient id="heartGradientVercel" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ff5e88" />
                <stop offset="40%" stopColor="#f43f5e" />
                <stop offset="80%" stopColor="#be123c" />
                <stop offset="100%" stopColor="#881337" />
              </linearGradient>

              <filter id="ultraHeartGlowVercel" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#f43f5e" floodOpacity="0.8" />
              </filter>
            </defs>

            <path
              fill="url(#heartGradientVercel)"
              filter="url(#ultraHeartGlowVercel)"
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            />
            <path
              d="M7.5 5C5.5 5 4 6.5 4 8.5c0 1 .5 2 1.5 3"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="8" cy="7" r="0.8" fill="rgba(255,255,255,0.9)" />
          </svg>
        </div>
      </div>

      {/* 🚀 5. HEARTBEAT CSS ANIMATION */}
      <style jsx>{`
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          12% { transform: scale(1.15); }
          24% { transform: scale(1); }
          36% { transform: scale(1.2); }
          55% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
