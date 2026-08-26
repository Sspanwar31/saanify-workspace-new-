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

  // 🚀 Canvas Engine (Realistic Petals + Magical Sparks)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = (canvas.width = canvas.parentElement?.clientWidth || 340);
    let H = (canvas.height = canvas.parentElement?.clientHeight || 260);
    let animationId: number;

    const resize = () => {
      if (!canvas) return;
      W = canvas.width = canvas.parentElement?.clientWidth || 340;
      H = canvas.height = canvas.parentElement?.clientHeight || 260;
    };
    window.addEventListener('resize', resize);

    const particles: Particle[] = [];

    for (let i = 0; i < 28; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        size: Math.random() * 4 + 1.5,
        speedY: Math.random() * 0.45 + 0.15,
        speedX: Math.random() * 0.3 - 0.15,
        alpha: Math.random() * 0.6 + 0.25,
        type: Math.random() > 0.4 ? 'petal' : 'spark',
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.03,
      });
    }

    const drawPetal = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.alpha;

      const grad = ctx.createLinearGradient(0, -p.size * 2, 0, p.size * 2);
      grad.addColorStop(0, '#ff3366');
      grad.addColorStop(1, '#990024');
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
        p.x += p.speedX + Math.sin(p.y * 0.02) * 0.3;
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
    <div className="relative flex items-center justify-center w-full h-60 my-0 select-none overflow-visible bg-transparent">
      
      {/* 🎆 1. FLOATING PARTICLES & PETALS */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10 pointer-events-none" />

      {/* 🌌 2. DEEP ROSE GLOW AURA */}
      <div className="absolute w-52 h-52 bg-rose-600/20 rounded-full blur-3xl animate-[breatheGlow_4s_ease-in-out_infinite]" />

      {/* 💎 3. ULTRA 3D VELVET RED HEART */}
      <div className="relative z-20 flex items-center justify-center animate-[heartBreathe_4s_ease-in-out_infinite]">
        
        {/* Soft Depth Shadow */}
        <div className="absolute -bottom-3 w-32 h-6 bg-black/50 blur-xl rounded-full" />

        {/* 3D Heart SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="w-44 h-44 filter drop-shadow-[0_15px_30px_rgba(225,29,72,0.65)]"
        >
          <defs>
            {/* 3D Velvet Red Gradient */}
            <radialGradient id="velvet3DGrad" cx="30%" cy="25%" r="70%">
              <stop offset="0%" stopColor="#ff4d79" />
              <stop offset="35%" stopColor="#e11d48" />
              <stop offset="70%" stopColor="#9f1239" />
              <stop offset="100%" stopColor="#4c0519" />
            </radialGradient>

            {/* Gloss Highlight Gradient */}
            <linearGradient id="glossGrad" x1="0%" y1="0%" x2="40%" y2="100%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.85)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </linearGradient>
          </defs>

          {/* Smooth Symmetrical Heart Body */}
          <path
            fill="url(#velvet3DGrad)"
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />

          {/* Left Top Soft 3D Curve */}
          <path
            d="M7.5 5 C 5.5 5, 4 6.8, 4 8.8 C 4 11.2, 5.8 13.5, 8 15.5"
            stroke="url(#glossGrad)"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />

          {/* Top Left Glossy Highlight Spot */}
          <ellipse cx="7.8" cy="7.2" rx="2.8" ry="1.5" transform="rotate(-35 7.8 7.2)" fill="rgba(255,255,255,0.7)" />
          
          {/* Subtle Right Rim Light */}
          <path
            d="M16.5 5 C 18.5 5, 20 6.8, 20 8.8"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>

      </div>

      {/* 🌬️ BREATHING ANIMATION */}
      <style jsx global>{`
        @keyframes heartBreathe {
          0%, 100% {
            transform: scale(0.96) translateY(0px);
          }
          50% {
            transform: scale(1.05) translateY(-5px);
          }
        }

        @keyframes breatheGlow {
          0%, 100% {
            transform: scale(0.85);
            opacity: 0.2;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.5;
          }
        }
      `}</style>

    </div>
  );
}
