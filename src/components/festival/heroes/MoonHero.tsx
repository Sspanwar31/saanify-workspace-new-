'use client';

import React from 'react';

interface Props {
  imageUrl?: string;
  heroConfig?: any;
  scale?: number;
}

export default function MoonHero({ heroConfig, scale }: Props) {
  // Supabase scale control
  const userScale = scale ?? heroConfig?.scale ?? 0.85;

  return (
    <div 
      className="relative w-full min-h-[220px] sm:min-h-[250px] flex flex-col items-center justify-center p-2 bg-transparent select-none overflow-visible transition-transform duration-300"
      style={{ transform: `scale(${userScale})` }}
    >
      {/* 🟢 TRANSPARENT EMERALD & GOLD AMBIENT GLOW */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] bg-emerald-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[180px] bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

      {/* 🌙 3D GLOWING CRESCENT MOON */}
      <div className="relative z-10 text-5xl sm:text-6xl filter drop-shadow-[0_0_25px_rgba(251,191,36,0.85)] transform -rotate-12 animate-hero-breathe mb-1">
        🌙
      </div>

      {/* 🕌 TRANSPARENT ILLUMINATED 3D GOLD MOSQUE (Pure Vector Art - No Box Border) */}
      <div className="relative z-10 w-full max-w-[280px] sm:max-w-[320px] flex items-end justify-center filter drop-shadow-[0_8px_25px_rgba(16,185,129,0.4)]">
        <svg viewBox="0 0 300 150" className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="goldMosque" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFDF0" />
              <stop offset="25%" stopColor="#FFD700" />
              <stop offset="65%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#0a3d28" />
            </linearGradient>
            <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Outer Tall Minarets */}
          <rect x="22" y="25" width="12" height="115" rx="2" fill="url(#goldMosque)" />
          <polygon points="22,25 28,5 34,25" fill="#FFE39A" />
          
          <rect x="266" y="25" width="12" height="115" rx="2" fill="url(#goldMosque)" />
          <polygon points="266,25 272,5 278,25" fill="#FFE39A" />

          {/* Inner Minarets */}
          <rect x="45" y="45" width="10" height="95" rx="2" fill="url(#goldMosque)" opacity="0.9" />
          <polygon points="45,45 50,25 55,45" fill="#FFD700" />

          <rect x="245" y="45" width="10" height="95" rx="2" fill="url(#goldMosque)" opacity="0.9" />
          <polygon points="245,45 250,25 255,45" fill="#FFD700" />

          {/* Main Mosque Body */}
          <rect x="60" y="80" width="180" height="60" rx="4" fill="#042116" stroke="url(#goldMosque)" strokeWidth="1.5" />

          {/* Central Grand Onion Dome */}
          <path d="M 110 80 Q 110 15 150 15 Q 190 15 190 80 Z" fill="url(#goldMosque)" filter="url(#goldGlow)" />

          {/* Side Domes */}
          <path d="M 70 80 Q 70 42 95 42 Q 120 42 120 80 Z" fill="url(#goldMosque)" opacity="0.85" />
          <path d="M 180 80 Q 180 42 205 42 Q 230 42 240 80 Z" fill="url(#goldMosque)" opacity="0.85" />

          {/* Crescent Peak on Dome */}
          <circle cx="150" cy="12" r="3" fill="#FFFDF0" />

          {/* Entrance Arch Doorway (Warm Glowing Light) */}
          <path d="M 132 140 L 132 105 Q 150 85 168 105 L 168 140 Z" fill="#FFE39A" filter="url(#goldGlow)" />
        </svg>
      </div>

      {/* 📜 ARABIC CALLIGRAPHY */}
      <div className="relative z-10 text-2xl sm:text-3xl font-black text-amber-300 tracking-widest font-serif drop-shadow-[0_2px_15px_rgba(251,191,36,0.8)] mt-2">
        عيد مبارك
      </div>

    </div>
  );
}
