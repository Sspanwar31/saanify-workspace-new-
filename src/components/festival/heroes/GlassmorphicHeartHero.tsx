'use client';

import React, { useState, useRef } from 'react';

export default function GlassmorphicHeartHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [shine, setShine] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  // 3D Tilt और शाइन की गणना (केवल कॉम्पैक्ट बॉक्स के अंदर)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    setRotate({
      x: y * -30, // 3D झुकाव
      y: x * 30,
    });

    setShine({
      x: (x + 0.5) * 100,
      y: (y + 0.5) * 100,
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
    setShine({ x: 50, y: 50 });
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full select-none overflow-visible">
      
      {/* ── 1. AMBIENT BACK GLOW (दिलों के पीछे की कोमल रोशनी) ── */}
      <div className="absolute w-40 h-44 rounded-full bg-pink-500/25 blur-3xl pointer-events-none animate-pulse" />

      {/* ── 2. COMPACT 3D TILT WRAPPER (निश्चित आकार का बॉक्स) ── */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center cursor-pointer overflow-visible"
        style={{
          perspective: '800px',
        }}
      >
        {/* Preserving 3D space */}
        <div
          className="relative w-full h-full transition-all duration-300 ease-out flex items-center justify-center overflow-visible"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
          }}
        >
          {/* 3D Soft Shadow (दिल के नीचे तैरने का अहसास कराने वाली परछाई) */}
          <div 
            className="absolute bottom-2 w-28 h-4 bg-black/40 rounded-full blur-md transition-all duration-300 transform" 
            style={{
              transform: `translateZ(-30px) scale(${isHovered ? 0.85 : 0.95})`,
            }}
          />

          {/* ── 3. PERFECTLY PROPORTIONED SVG HEART ── */}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-[0_15px_30px_rgba(219,39,119,0.45)] overflow-visible"
            style={{ transform: 'translateZ(10px)' }}
          >
            <defs>
              {/* Clip mask */}
              <clipPath id="hero-heart-clip">
                <path d="M50 85 C15 55, 5 35, 5 22 C5 10, 20 5, 35 12 C50 25, 50 25, 50 25 C50 25, 50 25, 65 12 C80 5, 95 10, 95 22 C95 35, 85 55, 50 85 Z" />
              </clipPath>

              {/* Shimmer gradient */}
              <linearGradient id="hero-shine-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.01)" />
                <stop offset={`${shine.x - 15}%`} stopColor="rgba(255,255,255,0.0)" />
                <stop offset={`${shine.x}%`} stopColor="rgba(255,255,255,0.32)" />
                <stop offset={`${shine.x + 15}%`} stopColor="rgba(255,255,255,0.0)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.01)" />
              </linearGradient>

              {/* Gold & Pink border */}
              <linearGradient id="hero-edge-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.55)" />
                <stop offset="50%" stopColor="rgba(244, 63, 94, 0.25)" />
                <stop offset="100%" stopColor="rgba(251, 191, 36, 0.55)" />
              </linearGradient>
            </defs>

            {/* Frosted Glass Base */}
            <path
              d="M50 85 C15 55, 5 35, 5 22 C5 10, 20 5, 35 12 C50 25, 50 25, 50 25 C50 25, 50 25, 65 12 C80 5, 95 10, 95 22 C95 35, 85 55, 50 85 Z"
              fill="rgba(255, 255, 255, 0.05)"
              style={{
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              }}
            />

            {/* Reflection Shine overlay */}
            <path
              d="M50 85 C15 55, 5 35, 5 22 C5 10, 20 5, 35 12 C50 25, 50 25, 50 25 C50 25, 50 25, 65 12 C80 5, 95 10, 95 22 C95 35, 85 55, 50 85 Z"
              fill="url(#hero-shine-grad)"
            />

            {/* Core Glow (धड़कता हुआ लाल केंद्र) */}
            <g clipPath="url(#hero-heart-clip)">
              <circle
                cx={50}
                cy={40}
                r={isHovered ? 12 : 9}
                fill="rgba(239, 68, 68, 0.45)"
                className="transition-all duration-500 blur-[5px] animate-pulse"
              />
              <circle
                cx={50}
                cy={40}
                r={4}
                fill="rgba(255, 255, 255, 0.9)"
                className="blur-[0.5px]"
              />
            </g>

            {/* Shiny Bezel/Border */}
            <path
              d="M50 85 C15 55, 5 35, 5 22 C5 10, 20 5, 35 12 C50 25, 50 25, 50 25 C50 25, 50 25, 65 12 C80 5, 95 10, 95 22 C95 35, 85 55, 50 85 Z"
              fill="none"
              stroke="url(#hero-edge-grad)"
              strokeWidth="1.2"
              className="opacity-95"
            />
          </svg>

          {/* Subtle elegant label inside the glass heart */}
          <div
            className="absolute z-10 flex flex-col items-center pointer-events-none"
            style={{
              transform: 'translateZ(22px)',
            }}
          >
            <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-pink-200/90 drop-shadow-md">
              LOVE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
