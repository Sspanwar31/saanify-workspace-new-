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
  type: 'petal' | 'gold';
  rotation: number;
  rotSpeed: number;
}

export default function ValentineVisual() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 🚀 Canvas Engine (Floating Petals & Golden Dust)
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
        size: Math.random() * 3.5 + 1.2,
        speedY: Math.random() * 0.45 + 0.15,
        speedX: Math.random() * 0.3 - 0.15,
        alpha: Math.random() * 0.65 + 0.25,
        type: Math.random() > 0.4 ? 'petal' : 'gold',
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

    const drawGoldSpark = (p: Particle) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ffd700';
      ctx.fillStyle = '#fff4cc';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, W, H);

      particles.forEach((p) => {
        p.y -= p.speedY;
        p.x += p.speedX + Math.sin(p.y * 0.02) * 0.25;
        p.rotation += p.rotSpeed;

        if (p.y < -15) {
          p.y = H + 15;
          p.x = Math.random() * W;
        }

        if (p.type === 'petal') drawPetal(p);
        else drawGoldSpark(p);
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
      
      {/* 🎆 1. FLOATING CANVAS */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10 pointer-events-none" />

      {/* 🌌 2. AMBIENT GLOW */}
      <div className="absolute w-52 h-52 bg-rose-600/20 rounded-full blur-3xl animate-[breatheGlow_4s_ease-in-out_infinite]" />

      {/* 💎 3. 3D VELVET RED HEART WITH GOLD TEXT & THIN GOLD RIM */}
      <div className="relative z-20 flex items-center justify-center animate-[heartBreathe_4s_ease-in-out_infinite]">
        
        {/* Soft Depth Shadow */}
        <div className="absolute -bottom-3 w-32 h-6 bg-black/50 blur-xl rounded-full" />

        {/* Main 3D Heart SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="w-48 h-48 filter drop-shadow-[0_15px_30px_rgba(225,29,72,0.6)]"
        >
          <defs>
            {/* 3D Velvet Red Gradient */}
            <radialGradient id="velvet3DGrad" cx="30%" cy="25%" r="70%">
              <stop offset="0%" stopColor="#ff4d79" />
              <stop offset="35%" stopColor="#e11d48" />
              <stop offset="70%" stopColor="#9f1239" />
              <stop offset="100%" stopColor="#4c0519" />
            </radialGradient>

            {/* Pure Shiny Metallic Gold Gradient */}
            <linearGradient id="goldMetallicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffeea8" />
              <stop offset="30%" stopColor="#ffd700" />
              <stop offset="70%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#996515" />
            </linearGradient>

            {/* Gloss Highlight Gradient */}
            <linearGradient id="glossGrad" x1="0%" y1="0%" x2="40%" y2="100%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.85)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </linearGradient>

            {/* Gold Text Glow Filter */}
            <filter id="goldTextGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#ffe066" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* 🔴 Main Heart Body with Thin Elegant Golden Border */}
          <path
            fill="url(#velvet3DGrad)"
            stroke="url(#goldMetallicGrad)"
            strokeWidth="0.6"
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />

          {/* ✨ 3D Top-Left Glass Reflection */}
          <path
            d="M7.5 4.8 C 5.5 4.8, 3.8 6.5, 3.8 8.5 C 3.8 11, 5.5 13.2, 7.5 15"
            stroke="url(#glossGrad)"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />

          {/* ✨ Top Glossy Reflection Spot */}
          <ellipse cx="7.5" cy="7" rx="2.5" ry="1.2" transform="rotate(-35 7.5 7)" fill="rgba(255,255,255,0.7)" />

          {/* 💛 Pinterest Style Little Golden Hearts */}
          <path d="M6 10.5 C5.5 9.8 4.8 10 4.8 10.5 C4.8 11.2 6 12 6 12 C6 12 7.2 11.2 7.2 10.5 C7.2 10 6.5 9.8 6 10.5Z" fill="url(#goldMetallicGrad)" opacity="0.85" />
          <path d="M17.5 9.5 C17.1 9 16.5 9.1 16.5 9.5 C16.5 10 17.5 10.7 17.5 10.7 C17.5 10.7 18.5 10 18.5 9.5 C18.5 9.1 17.9 9 17.5 9.5Z" fill="url(#goldMetallicGrad)" opacity="0.85" />
          <path d="M16 13.5 C15.6 13.1 15.2 13.2 15.2 13.5 C15.2 13.9 16 14.5 16 14.5 C16 14.5 16.8 13.9 16.8 13.5 C16.8 13.2 16.4 13.1 16 13.5Z" fill="url(#goldMetallicGrad)" opacity="0.7" />

          {/* ✍️ PINTEREST STYLE ELEGANT CURSIVE GOLDEN TEXT */}
          <g filter="url(#goldTextGlow)">
            {/* "Happy" */}
            <text
              x="12"
              y="9.2"
              textAnchor="middle"
              fill="url(#goldMetallicGrad)"
              style={{
                fontFamily: "'Brush Script MT', 'Dancing Script', 'Pacifico', 'Playfair Display', cursive",
                fontSize: '2.8px',
                fontStyle: 'italic',
                fontWeight: 'bold',
                letterSpacing: '0.2px'
              }}
            >
              Happy
            </text>

            {/* "Valentine's" */}
            <text
              x="12"
              y="12.5"
              textAnchor="middle"
              fill="url(#goldMetallicGrad)"
              style={{
                fontFamily: "'Brush Script MT', 'Dancing Script', 'Pacifico', 'Playfair Display', cursive",
                fontSize: '3.1px',
                fontStyle: 'italic',
                fontWeight: 'bold',
                letterSpacing: '0.1px'
              }}
            >
              Valentine's
            </text>

            {/* "Day" */}
            <text
              x="12"
              y="15.6"
              textAnchor="middle"
              fill="url(#goldMetallicGrad)"
              style={{
                fontFamily: "'Brush Script MT', 'Dancing Script', 'Pacifico', 'Playfair Display', cursive",
                fontSize: '2.8px',
                fontStyle: 'italic',
                fontWeight: 'bold',
                letterSpacing: '0.3px'
              }}
            >
              Day
            </text>
          </g>
        </svg>

      </div>

      {/* 🌬️ NATURAL BREATHING ANIMATION */}
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
