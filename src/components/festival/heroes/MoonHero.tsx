'use client';

import React from 'react';

interface Props {
  imageUrl?: string;
  heroConfig?: any;
  scale?: number;
}

export default function MoonHero({ heroConfig, scale }: Props) {
  // Supabase dynamic scale control
  const userScale = scale ?? heroConfig?.scale ?? 1.1;

  return (
    <div 
      className="relative w-full min-h-[260px] sm:min-h-[300px] flex flex-col items-center justify-center p-2 bg-transparent select-none overflow-visible transition-transform duration-300"
      style={{ transform: `scale(${userScale})` }}
    >
      {/* 🟢 AMBIENT EMERALD & GOLD GLOW */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-emerald-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

      {/* 🕌 PROPORTIONAL 3D GOLD MOSQUE & CRESCENT SKYLINE */}
      <div className="relative z-10 w-full max-w-[320px] sm:max-w-[380px] flex items-center justify-center filter drop-shadow-[0_10px_30px_rgba(16,185,129,0.45)]">
        <svg viewBox="0 0 300 200" className="w-full h-auto overflow-visible">
          <defs>
            {/* 24K Gold Metallic Gradient */}
            <linearGradient id="goldMosque" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFDF0" />
              <stop offset="25%" stopColor="#FFD700" />
              <stop offset="65%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#0a3d28" />
            </linearGradient>

            {/* Moon Gold Gradient */}
            <linearGradient id="goldMoon" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFDF0" />
              <stop offset="50%" stopColor="#FFD700" />
              <stop offset="100%" stopColor="#B87B00" />
            </linearGradient>

            <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* 🌙 PERFECTLY PROPORTIONED CRESCENT MOON (Floating above Mosque) */}
          <g transform="translate(150, 32) rotate(-15)">
            <path
              d="M 12 -18 A 18 18 0 1 0 12 18 A 14 14 0 1 1 12 -18 Z"
              fill="url(#goldMoon)"
              filter="url(#goldGlow)"
            />
          </g>

          {/* Outer Tall Minarets */}
          <rect x="22" y="65" width="12" height="115" rx="2" fill="url(#goldMosque)" />
          <polygon points="22,65 28,45 34,65" fill="#FFE39A" />
          
          <rect x="266" y="65" width="12" height="115" rx="2" fill="url(#goldMosque)" />
          <polygon points="266,65 272,45 278,65" fill="#FFE39A" />

          {/* Inner Minarets */}
          <rect x="45" y="85" width="10" height="95" rx="2" fill="url(#goldMosque)" opacity="0.9" />
          <polygon points="45,85 50,65 55,85" fill="#FFD700" />

          <rect x="245" y="85" width="10" height="95" rx="2" fill="url(#goldMosque)" opacity="0.9" />
          <polygon points="245,85 250,65 255,85" fill="#FFD700" />

          {/* Main Mosque Body */}
          <rect x="60" y="120" width="180" height="60" rx="4" fill="#042116" stroke="url(#goldMosque)" strokeWidth="1.5" />

          {/* Central Grand Onion Dome */}
          <path d="M 110 120 Q 110 55 150 55 Q 190 55 190 120 Z" fill="url(#goldMosque)" filter="url(#goldGlow)" />

          {/* Side Domes */}
          <path d="M 70 120 Q 70 82 95 82 Q 120 82 120 120 Z" fill="url(#goldMosque)" opacity="0.85" />
          <path d="M 180 120 Q 180 82 205 82 Q 230 82 240 120 Z" fill="url(#goldMosque)" opacity="0.85" />

          {/* Dome Finial Peak */}
          <circle cx="150" cy="52" r="3" fill="#FFFDF0" />

          {/* Entrance Arch Doorway (Warm Glowing Light) */}
          <path d="M 132 180 L 132 145 Q 150 125 168 145 L 168 180 Z" fill="#FFE39A" filter="url(#goldGlow)" />

          {/* 📜 ARABIC CALLIGRAPHY INSIDE SVG */}
          <text
            x="150"
            y="198"
            textAnchor="middle"
            fill="#FFD700"
            fontSize="18"
            fontWeight="900"
            fontFamily="Amiri, serif"
            filter="url(#goldGlow)"
          >
            عيد مبارك
          </text>
        </svg>
      </div>

    </div>
  );
}
