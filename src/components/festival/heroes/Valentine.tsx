'use client';

import React, { useEffect, useRef } from 'react';

// Strict TypeScript Interface for Build Safety
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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 🚀 CANVAS PARTICLE ENGINE (Floating Petals & Magical Sparks)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let animationId = 0;

    const resize = () => {
      if (typeof window === 'undefined') return;
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const particles: Particle[] = [];

    // Create Petals & Sparks
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H + H, // Start from bottom
        size: Math.random() * 5 + 2,
        speedY: Math.random() * 0.8 + 0.3,
        speedX: Math.random() * 0.4 - 0.2,
        alpha: Math.random() * 0.6 + 0.2,
        type: Math.random() > 0.4 ? 'petal' : 'spark',
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.05,
      });
    }

    const drawPetal = (p: Particle) => {
      if (!ctx) return;
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
      if (!ctx) return;
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ff0080';
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const animate = () => {
      if (!ctx) return;
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
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', resize);
      }
    };
  }, []);

  return (
    <div className="relative flex items-center justify-center w-full h-72 my-1 select-none overflow-hidden">
      
      {/* 🎆 CANVAS PARTICLE LAYER (Petals & Sparks flying behind the heart) */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10" />

      {/* 💎 LARGE TRANSPARENT 3D LIQUID GLASS HEART */}
      <div className="relative z-20 flex items-center justify-center w-full h-full">
        
        {/* Ambient Pink Glow Behind Heart */}
        <div className="absolute w-48 h-48 bg-rose-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute w-32 h-32 bg-pink-400/30 rounded-full blur-2xl"></div>

        {/* Massive 3D Holographic Heart SVG */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          className="w-48 h-48 relative z-20 drop-shadow-[0_0_40px_rgba(244,63,94,0.6)] animate-[heartbeat_1.2s_ease-in-out_infinite]"
        >
          <defs>
            {/* Transparent Glass & Pink Neon Gradient */}
            <linearGradient id="glassHeart2027" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.2)" />
              <stop offset="30%" stopColor="rgba(244, 63, 94, 0.15)" />
              <stop offset="70%" stopColor="rgba(190, 18, 60, 0.2)" />
              <stop offset="100%" stopColor="rgba(255, 0, 122, 0.3)" />
            </linearGradient>

            {/* Neon Stroke Gradient */}
            <linearGradient id="neonStroke2027" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#ff5e88" />
              <stop offset="80%" stopColor="#ff007a" />
              <stop offset="100%" stopColor="#be123c" />
            </linearGradient>

            {/* Ultra Glow Filter */}
            <filter id="ultraHeartGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#f43f5e" floodOpacity="0.9"/>
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ff007a" floodOpacity="0.7"/>
            </filter>
          </defs>

          {/* Transparent Glass Heart Body with Neon Edges */}
          <path 
            fill="url(#glassHeart2027)" 
            stroke="url(#neonStroke2027)" 
            strokeWidth="1.5" 
            filter="url(#ultraHeartGlow)"
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />
          
          {/* 3D Top Gloss Reflection (Light Refraction on Glass) */}
          <path 
            d="M7.5 5C5.5 5 4 6.5 4 8.5c0 1 .5 2 1.5 3" 
            stroke="rgba(255,255,255,0.9)" 
            strokeWidth="2" 
            strokeLinecap="round" 
            fill="none" 
          />
          
          {/* Bottom Inner Glass Reflection */}
          <path 
            d="M14 16 C 16 14, 18 12, 19 10" 
            stroke="rgba(255, 94, 136, 0.4)" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            fill="none" 
          />

          {/* Highlight Dots for 3D Shine */}
          <circle cx="8" cy="7" r="1.5" fill="rgba(255,255,255,0.8)" />
          <circle cx="17" cy="9" r="0.8" fill="rgba(255,255,255,0.5)" />
        </svg>
      </div>

      {/* 🚀 ORGANIC SMOOTH HEARTBEAT ANIMATION */}
      <style jsx global>{`
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          10% { transform: scale(1.15); }
          20% { transform: scale(1); }
          30% { transform: scale(1.25); }
          50% { transform: scale(1); }
          100% { transform: scale(1); }
        }
      `}</style>

    </div>
  );
}
