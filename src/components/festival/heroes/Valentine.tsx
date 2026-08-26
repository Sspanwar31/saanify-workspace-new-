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
  type: 'gold' | 'petal';
  rotation: number;
  rotSpeed: number;
}

export default function ValentineVisual() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 🚀 Canvas Engine: Golden Glitter Dust & Rose Petals
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

    // Create Gold Sparks & Red Petals
    for (let i = 0; i < 35; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        size: Math.random() * 3 + 1,
        speedY: Math.random() * 0.4 + 0.15,
        speedX: Math.random() * 0.3 - 0.15,
        alpha: Math.random() * 0.7 + 0.3,
        type: Math.random() > 0.35 ? 'gold' : 'petal',
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.03,
      });
    }

    const drawGoldSpark = (p: Particle) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ffd700';
      ctx.fillStyle = '#fff4cc';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawPetal = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.alpha * 0.8;

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

        if (p.type === 'gold') drawGoldSpark(p);
        else drawPetal(p);
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
      
      {/* 🎆 1. FLOATING GOLDEN SPARKS & PETALS */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10 pointer-events-none" />

      {/* 🌌 2. AMBIENT GOLD & ROSE GLOW */}
      <div className="absolute w-52 h-52 bg-gradient-to-tr from-rose-600/25 to-amber-500/20 rounded-full blur-3xl animate-[breatheGlow_4s_ease-in-out_infinite]" />

      {/* 💎 3. PHOTO-2 STYLE 3D RED HEART WITH GOLD GLITTER BORDER */}
      <div className="relative z-20 flex items-center justify-center animate-[heartBreathe_4s_ease-in-out_infinite]">
        
        {/* Soft Shadow */}
        <div className="absolute -bottom-2 w-32 h-6 bg-black/60 blur-xl rounded-full" />

        {/* 🌟 SPARKLE GOLDEN OUTER BORDER (Behind Heart) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="w-48 h-48 absolute z-10 animate-[goldShimmer_3s_linear_infinite]"
        >
          <defs>
            <linearGradient id="goldGlitterBorder" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffd700" />
              <stop offset="25%" stopColor="#fff8db" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="75%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>

            <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#ffd700" floodOpacity="0.8" />
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#ffffff" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Dotted Golden Glitter Ring */}
          <path
            fill="none"
            stroke="url(#goldGlitterBorder)"
            strokeWidth="1.6"
            strokeDasharray="2 4"
            strokeLinecap="round"
            filter="url(#goldGlow)"
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />
        </svg>

        {/* 💖 MAIN 3D GLOSSY RED HEART (Foreground) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="w-40 h-40 relative z-20 filter drop-shadow-[0_12px_28px_rgba(225,29,72,0.65)]"
        >
          <defs>
            {/* Rich 3D Ruby Red Gradient */}
            <radialGradient id="ruby3DGrad" cx="30%" cy="25%" r="70%">
              <stop offset="0%" stopColor="#ff4d79" />
              <stop offset="35%" stopColor="#e11d48" />
              <stop offset="70%" stopColor="#9f1239" />
              <stop offset="100%" stopColor="#4c0519" />
            </radialGradient>

            {/* Gloss Highlight */}
            <linearGradient id="rubyGloss" x1="0%" y1="0%" x2="40%" y2="100%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.9)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </linearGradient>
          </defs>

          {/* Smooth Solid Heart Body */}
          <path
            fill="url(#ruby3DGrad)"
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />

          {/* 3D Curved Light Reflection (Left Top) */}
          <path
            d="M7.5 5 C 5.5 5, 4 6.8, 4 8.8 C 4 11.2, 5.8 13.5, 8 15.5"
            stroke="url(#rubyGloss)"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />

          {/* Glossy Sparkle Dot */}
          <ellipse cx="7.8" cy="7.2" rx="2.5" ry="1.4" transform="rotate(-35 7.8 7.2)" fill="rgba(255,255,255,0.75)" />

          {/* Golden Rim Accent */}
          <path
            d="M16.5 5 C 18.5 5, 20 6.8, 20 8.8"
            stroke="rgba(255, 215, 0, 0.4)"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>

      </div>

      {/* 🌬️ BREATHING & SHIMMER ANIMATION */}
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

        @keyframes goldShimmer {
          0% {
            filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.5));
          }
          50% {
            filter: drop-shadow(0 0 12px rgba(255, 215, 0, 0.9));
          }
          100% {
            filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.5));
          }
        }
      `}</style>

    </div>
  );
}
