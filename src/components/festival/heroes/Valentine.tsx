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

  // 🚀 Canvas Engine (Floating Petals & Real Gold Sparks)
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
        size: Math.random() * 3.2 + 1.2,
        speedY: Math.random() * 0.4 + 0.15,
        speedX: Math.random() * 0.3 - 0.15,
        alpha: Math.random() * 0.7 + 0.2,
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
      ctx.shadowColor = '#DFBA6B';
      ctx.fillStyle = '#F3D899';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.45, 0, Math.PI * 2);
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
      
      {/* 🔤 Google Cursive Font Import */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');

        .cursive-gold-text {
          font-family: 'Great Vibes', cursive !important;
        }
      `}</style>

      {/* 🎆 1. FLOATING CANVAS */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10 pointer-events-none" />

      {/* 🌌 2. AMBIENT GLOW */}
      <div className="absolute w-52 h-52 bg-rose-600/20 rounded-full blur-3xl animate-[breatheGlow_4s_ease-in-out_infinite]" />

      {/* 💎 3. 3D VELVET RED HEART WITH PURE GOLD GRADIENT */}
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
            {/* 3D Velvet Red Background */}
            <radialGradient id="velvet3DGrad" cx="30%" cy="25%" r="70%">
              <stop offset="0%" stopColor="#ff4d79" />
              <stop offset="35%" stopColor="#e11d48" />
              <stop offset="70%" stopColor="#9f1239" />
              <stop offset="100%" stopColor="#4c0519" />
            </radialGradient>

            {/* ✨ Exact Pinterest Top-to-Bottom Gold Linear Gradient */}
            <linearGradient id="pinterestGold" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F3D899" />
              <stop offset="50%" stopColor="#DFBA6B" />
              <stop offset="100%" stopColor="#BD8D39" />
            </linearGradient>

            {/* Ultra-Gloss Top Reflection */}
            <linearGradient id="glossGrad" x1="0%" y1="0%" x2="40%" y2="100%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.85)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </linearGradient>

            {/* Gold Text Depth Shadow Filter */}
            <filter id="goldDepthGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0.4" stdDeviation="0.4" floodColor="#401000" floodOpacity="0.9" />
              <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#DFBA6B" floodOpacity="0.7" />
            </filter>
          </defs>

          {/* 🔴 Main Heart Body with Thin Elegant Golden Border */}
          <path
            fill="url(#velvet3DGrad)"
            stroke="url(#pinterestGold)"
            strokeWidth="0.55"
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />

          {/* ✨ 3D Top-Left Glass Reflection */}
          <path
            d="M7.5 4.8 C 5.5 4.8, 3.8 6.5, 3.8 8.5 C 3.8 11, 5.5 13.2, 7.5 15"
            stroke="url(#glossGrad)"
            strokeWidth="1.3"
            strokeLinecap="round"
            fill="none"
          />

          {/* ✨ Top Gloss Spot */}
          <ellipse cx="7.5" cy="7" rx="2.5" ry="1.2" transform="rotate(-35 7.5 7)" fill="rgba(255,255,255,0.7)" />

          {/* 💛 Little Pinterest Golden Hearts */}
          <path d="M5.8 10.5 C5.3 9.8 4.6 10 4.6 10.5 C4.6 11.2 5.8 12 5.8 12 C5.8 12 7 11.2 7 10.5 C7 10 6.3 9.8 5.8 10.5Z" fill="url(#pinterestGold)" opacity="0.9" />
          <path d="M17.8 9.2 C17.4 8.7 16.8 8.8 16.8 9.2 C16.8 9.7 17.8 10.4 17.8 10.4 C17.8 10.4 18.8 9.7 18.8 9.2 C18.8 8.8 18.2 8.7 17.8 9.2Z" fill="url(#pinterestGold)" opacity="0.9" />
          <path d="M16.5 13.8 C16.1 13.4 15.7 13.5 15.7 13.8 C15.7 14.2 16.5 14.8 16.5 14.8 C16.5 14.8 17.3 14.2 17.3 13.8 C17.3 13.5 16.9 13.4 16.5 13.8Z" fill="url(#pinterestGold)" opacity="0.8" />

          {/* ✍️ PURE GOLD CURSIVE TYPOGRAPHY */}
          <g filter="url(#goldDepthGlow)">
            {/* "Happy" */}
            <text
              x="12"
              y="9.6"
              textAnchor="middle"
              fill="url(#pinterestGold)"
              className="cursive-gold-text"
              style={{
                fontSize: '4.2px',
                fontWeight: 'normal',
                letterSpacing: '0.2px',
              }}
            >
              Happy
            </text>

            {/* "Valentine's" */}
            <text
              x="12"
              y="13.2"
              textAnchor="middle"
              fill="url(#pinterestGold)"
              className="cursive-gold-text"
              style={{
                fontSize: '4.4px',
                fontWeight: 'normal',
                letterSpacing: '0.1px',
              }}
            >
              Valentine's
            </text>

            {/* "Day" */}
            <text
              x="12"
              y="16.6"
              textAnchor="middle"
              fill="url(#pinterestGold)"
              className="cursive-gold-text"
              style={{
                fontSize: '4.2px',
                fontWeight: 'normal',
                letterSpacing: '0.3px',
              }}
            >
              Day
            </text>
          </g>
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
