'use client';

import React, { useState, useRef } from 'react';

export default function GlassmorphicHeartHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [shine, setShine] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: y * -25, y: x * 25 });
    setShine({ x: (x + 0.5) * 100, y: (y + 0.5) * 100 });
  };

  const handleMouseLeave = () => {
    setHovered(false);
    setTilt({ x: 0, y: 0 });
    setShine({ x: 50, y: 50 });
  };

  const sparkles = [
    { x: 12, y: 8, s: 4.5, d: 0, dur: 3.2 },
    { x: 85, y: 14, s: 3.5, d: 0.6, dur: 3.8 },
    { x: 8, y: 55, s: 3, d: 1.1, dur: 2.9 },
    { x: 88, y: 60, s: 3.5, d: 1.7, dur: 3.4 },
    { x: 50, y: 2, s: 4, d: 0.3, dur: 3.6 },
    { x: 25, y: 88, s: 3, d: 2.2, dur: 3.1 },
    { x: 72, y: 85, s: 3.5, d: 0.9, dur: 3.5 },
    { x: 4, y: 35, s: 2.5, d: 1.4, dur: 4.0 },
    { x: 94, y: 38, s: 2.5, d: 2.0, dur: 3.3 },
    { x: 50, y: 95, s: 3, d: 0.5, dur: 3.7 },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full select-none overflow-visible">

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes g-breathe {
          0%, 100% { opacity: 0.3; transform: translate(-50%,-50%) scale(1); }
          50% { opacity: 0.55; transform: translate(-50%,-50%) scale(1.12); }
        }
        @keyframes g-pulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.35; }
        }
        @keyframes ring-spin {
          0% { transform: translate(-50%,-50%) rotate(0deg); }
          100% { transform: translate(-50%,-50%) rotate(360deg); }
        }
        @keyframes ring-spin-r {
          0% { transform: translate(-50%,-50%) rotate(360deg); }
          100% { transform: translate(-50%,-50%) rotate(0deg); }
        }
        @keyframes spark-pop {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          15% { opacity: 1; transform: scale(1.3) rotate(60deg); }
          40% { opacity: 0.7; transform: scale(0.9) rotate(120deg); }
          60% { opacity: 0; transform: scale(0.3) rotate(160deg); }
        }
        @keyframes facet-shift {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes shimmer-move {
          0% { transform: translateX(-120%) skewX(-20deg); }
          25% { transform: translateX(120%) skewX(-20deg); }
          100% { transform: translateX(120%) skewX(-20deg); }
        }
        @keyframes orbit-dot {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.9; }
        }
      ` }} />

      {/* ── LAYER 1: Deep multi-color ambient glow ── */}
      <div
        className="absolute w-56 h-56 rounded-full pointer-events-none"
        style={{
          top: '50%', left: '50%',
          background: 'radial-gradient(circle, rgba(244,63,94,0.18) 0%, rgba(251,191,36,0.08) 35%, rgba(139,92,246,0.04) 55%, transparent 70%)',
          animation: 'g-breathe 4s ease-in-out infinite',
        }}
      />
      <div
        className="absolute w-44 h-44 rounded-full pointer-events-none"
        style={{
          top: '50%', left: '50%',
          background: 'radial-gradient(circle, rgba(251,113,133,0.12) 0%, transparent 60%)',
          animation: 'g-pulse 3s ease-in-out infinite 1.5s',
        }}
      />

      {/* ── LAYER 2: Rotating orbital rings ── */}
      <div
        className="absolute w-[200px] h-[200px] rounded-[50%] pointer-events-none"
        style={{
          top: '50%', left: '50%',
          border: '1.5px solid transparent',
          borderImage: 'linear-gradient(90deg, transparent 0%, rgba(251,191,36,0.25) 25%, transparent 50%, rgba(244,63,94,0.2) 75%, transparent 100%) 1',
          animation: 'ring-spin 18s linear infinite',
        }}
      />
      <div
        className="absolute w-[220px] h-[220px] rounded-[50%] pointer-events-none"
        style={{
          top: '50%', left: '50%',
          border: '1px solid transparent',
          borderImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 30%, transparent 60%, rgba(255,255,255,0.08) 80%, transparent 100%) 1',
          animation: 'ring-spin-r 25s linear infinite',
        }}
      />

      {/* ── LAYER 3: 3D Tilt container ── */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleMouseLeave}
        className="relative w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center cursor-pointer overflow-visible"
        style={{ perspective: '900px' }}
      >
        <div
          className="relative w-full h-full transition-transform duration-300 ease-out flex items-center justify-center"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${hovered ? 1.04 : 1})`,
          }}
        >

          {/* 3D Shadow */}
          <div
            className="absolute bottom-1 w-32 h-5 rounded-full pointer-events-none transition-all duration-300"
            style={{
              transform: 'translateZ(-40px)',
              background: 'radial-gradient(ellipse, rgba(219,39,119,0.35) 0%, rgba(0,0,0,0.25) 50%, transparent 70%)',
              filter: 'blur(8px)',
            }}
          />

          {/* ── HEART SVG ── */}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full overflow-visible"
            style={{
              transform: 'translateZ(10px)',
              filter: `drop-shadow(0 8px 28px rgba(244,63,94,${hovered ? 0.55 : 0.4})) drop-shadow(0 2px 8px rgba(251,191,36,${hovered ? 0.3 : 0.15}))`,
            }}
          >
            <defs>
              <clipPath id="h-clip">
                <path d="M50 86 C18 58, 6 38, 6 24 C6 12, 22 6, 38 14 C50 28, 50 28, 50 28 C50 28, 50 28, 66 14 C78 6, 94 12, 94 24 C94 38, 82 58, 50 86 Z" />
              </clipPath>

              {/* Multi-pass moving shimmer (CSS bg-position animation) */}
              <linearGradient id="shim-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                <stop offset="42%" stopColor="rgba(255,255,255,0)" />
                <stop offset="48%" stopColor="rgba(255,255,255,0.45)" />
                <stop offset="52%" stopColor="rgba(255,255,255,0.45)" />
                <stop offset="58%" stopColor="rgba(255,255,255,0)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>

              {/* Crystal facet lines */}
              <pattern id="facets" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="14" y2="14" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                <line x1="14" y1="0" x2="0" y2="14" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
              </pattern>

              {/* Border gradient: rose gold → white → pink → rose gold */}
              <linearGradient id="edge-g" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(251,191,36,0.7)" />
                <stop offset="18%" stopColor="rgba(255,250,230,0.85)" />
                <stop offset="35%" stopColor="rgba(255,255,255,0.95)" />
                <stop offset="50%" stopColor="rgba(255,200,220,0.9)" />
                <stop offset="65%" stopColor="rgba(255,255,255,0.95)" />
                <stop offset="82%" stopColor="rgba(255,250,230,0.85)" />
                <stop offset="100%" stopColor="rgba(244,63,94,0.7)" />
              </linearGradient>

              {/* Body fill: rich rose-gold metallic (🚀 FIXED: Added missing stop tags) */}
              <linearGradient id="body-g" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(180,50,80,0.3)" />
                <stop offset="15%" stopColor="rgba(244,63,94,0.2)" />
                <stop offset="30%" stopColor="rgba(251,191,36,0.15)" />
                <stop offset="45%" stopColor="rgba(255,250,240,0.22)" />
                <stop offset="55%" stopColor="rgba(255,255,255,0.25)" />
                <stop offset="70%" stopColor="rgba(251,191,36,0.18)" />
                <stop offset="85%" stopColor="rgba(244,63,94,0.22)" />
                <stop offset="100%" stopColor="rgba(160,30,60,0.3)" />
              </linearGradient>

              {/* Inner glow gradient */}
              <radialGradient id="inner-glow" cx="50%" cy="38%" r="35%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                <stop offset="30%" stopColor="rgba(255,200,220,0.15)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </radialGradient>
            </defs>

            {/* Glass body fill */}
            <path
              d="M50 86 C18 58, 6 38, 6 24 C6 12, 22 6, 38 14 C50 28, 50 28, 50 28 C50 28, 50 28, 66 14 C78 6, 94 12, 94 24 C94 38, 82 58, 50 86 Z"
              fill="rgba(255,255,255,0.06)"
              style={{
                backdropFilter: 'blur(22px) saturate(200%)',
                WebkitBackdropFilter: 'blur(22px) saturate(200%)',
              }}
            />

            {/* Metallic body gradient */}
            <path
              d="M50 86 C18 58, 6 38, 6 24 C6 12, 22 6, 38 14 C50 28, 50 28, 50 28 C50 28, 50 28, 66 14 C78 6, 94 12, 94 24 C94 38, 82 58, 50 86 Z"
              fill="url(#body-g)"
            />

            {/* Crystal facet lines (clipped) */}
            <g clipPath="url(#h-clip)">
              <rect width="100" height="100" fill="url(#facets)" style={{ animation: 'facet-shift 8s linear infinite', backgroundSize: '200% 100%' }} />
            </g>

            {/* Inner glow overlay */}
            <g clipPath="url(#h-clip)">
              <path
                d="M50 86 C18 58, 6 38, 6 24 C6 12, 22 6, 38 14 C50 28, 50 28, 50 28 C50 28, 50 28, 66 14 C78 6, 94 12, 94 24 C94 38, 82 58, 50 86 Z"
                fill="url(#inner-glow)"
                className="transition-opacity duration-500"
                style={{ opacity: hovered ? 1 : 0.7 }}
              />
            </g>

            {/* Moving shimmer sweep */}
            <g clipPath="url(#h-clip)">
              <rect
                x="-10%" y="-10%" width="50%" height="120%"
                fill="url(#shim-1)"
                style={{ animation: 'shimmer-move 3.5s ease-in-out infinite' }}
              />
            </g>

            {/* Mouse-following highlight */}
            <g clipPath="url(#h-clip)">
              <circle
                cx={shine.x} cy={shine.y}
                r="35"
                fill="url(#shim-1)"
                style={{ opacity: 0.6 }}
              />
            </g>

            {/* Top highlight reflection */}
            <g clipPath="url(#h-clip)">
              <ellipse cx="50" cy="25" rx="22" ry="18"
                fill="rgba(255,255,255,0.15)"
                className="transition-opacity duration-500"
                style={{ opacity: hovered ? 0.2 : 0.08 }}
              />
            </g>

            {/* Bottom warm glow */}
            <g clipPath="url(#h-clip)">
              <ellipse cx="50" cy="68" rx="20" ry="15"
                fill="rgba(251,191,36,0.1)"
                className="transition-opacity duration-500"
                style={{ opacity: hovered ? 0.15 : 0.05 }}
              />
            </g>

            {/* Pulsing core */}
            <g clipPath="url(#h-clip)">
              <circle cx="50" cy="40" r={hovered ? 14 : 10}
                fill="rgba(239,68,68,0.35)"
                className="blur-[6px] transition-all duration-500 animate-pulse"
              />
              <circle cx="50" cy="40" r="4"
                fill="rgba(255,255,255,0.9)"
                className="blur-[0.5px]"
              />
            </g>

            {/* Gold-pink-white-pink-gold border */}
            <path
              d="M50 86 C18 58, 6 38, 6 24 C6 12, 22 6, 38 14 C50 28, 50 28, 50 28 C50 28, 50 28, 66 14 C78 6, 94 12, 94 24 C94 38, 82 58, 50 86 Z"
              fill="none"
              stroke="url(#edge-g)"
              strokeWidth={hovered ? '2' : '1.2'}
              className="transition-all duration-300"
            />

            {/* Inner thin bright edge */}
            <path
              d="M50 86 C18 58, 6 38, 6 24 C6 12, 22 6, 38 14 C50 28, 50 28, 50 28 C50 28, 50 28, 66 14 C78 6, 94 12, 94 24 C94 38, 82 58, 50 86 Z"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="0.5"
            />
          </svg>

          {/* ── OVERLAY: Floating sparkles ── */}
          {sparkles.map((sp, i) => (
            <svg
              key={i}
              className="absolute pointer-events-none"
              style={{
                left: `${sp.x}%`, top: `${sp.y}%`,
                width: `${sp.s * 4}px`, height: `${sp.s * 4}px`,
                animation: `spark-pop ${sp.dur}s ease-in-out ${sp.d}s infinite`,
                transform: 'translate(-50%,-50%)',
                filter: `drop-shadow(0 0 ${sp.s * 1.5}px rgba(251,191,36,0.8))`,
              }}
              viewBox="0 0 20 20"
            >
              <line x1="10" y1="2" x2="10" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <line x1="2" y1="10" x2="18" y2="10" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <line x1="4" y1="4" x2="16" y2="16" stroke="rgba(251,191,36,0.6)" strokeWidth="1" strokeLinecap="round" />
              <line x1="16" y1="4" x2="4" y2="16" stroke="rgba(251,191,36,0.6)" strokeWidth="1" strokeLinecap="round" />
              <circle cx="10" cy="10" r="2" fill="white" />
            </svg>
          ))}
        </div>
      </div>
    </div>
  );
}
