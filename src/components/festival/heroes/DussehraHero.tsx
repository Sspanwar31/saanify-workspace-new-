'use client';

import React from 'react';

interface Props {
  imageUrl?: string;
  heroConfig?: any;
  scale?: number;
}

export default function DussehraHero({ heroConfig, scale, imageUrl }: Props) {
  const userScale = scale ?? heroConfig?.scale ?? 1.15;
  const posterUrl = heroConfig?.image_url || imageUrl;

  return (
    <div 
      className="relative w-full min-h-[250px] sm:min-h-[280px] flex flex-col items-center justify-center p-2 bg-transparent select-none overflow-visible transition-transform duration-300"
      style={{ transform: `scale(${userScale})` }}
    >
      {/* 🔥 DYNAMIC FIRE & GOLD AMBIENT GLOW */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] bg-amber-500/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] bg-red-500/20 rounded-full blur-2xl pointer-events-none" />

      {posterUrl ? (
        /* 🖼️ POSTER IMAGE (If provided in Supabase) */
        <div className="relative w-full max-w-[260px] aspect-[3/4] rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-[0_10px_40px_rgba(251,191,36,0.35)]">
          <img src={posterUrl} alt="Dussehra" className="w-full h-full object-cover" />
        </div>
      ) : (
        /* 🏹 TRANSPARENT 3D GOLDEN BOW & BLAZING FIRE ARROW (Pure Vector Art - No Box Border) */
        <div className="relative z-10 w-full max-w-[280px] sm:max-w-[340px] flex items-center justify-center filter drop-shadow-[0_12px_35px_rgba(255,140,0,0.65)]">
          <svg viewBox="0 0 260 210" className="w-full h-auto overflow-visible">
            <defs>
              {/* 24K Gold Metallic Gradient */}
              <linearGradient id="goldBow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFDF0" />
                <stop offset="30%" stopColor="#FFD700" />
                <stop offset="70%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#4A2D00" />
              </linearGradient>

              {/* Fire Arrow Flame Gradient */}
              <radialGradient id="fireArrowGlow" cx="35%" cy="30%" r="75%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="20%" stopColor="#FFEE55" />
                <stop offset="55%" stopColor="#FF7700" />
                <stop offset="100%" stopColor="#DD0000" />
              </radialGradient>

              {/* Advanced Glow Filter */}
              <filter id="bowGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* 🏹 3D GOLDEN KODANDA BOW & BLAZING ARROW */}
            <g transform="translate(130, 105) rotate(-20)" filter="url(#bowGlow)">
              {/* Curved Golden Bow Body */}
              <path
                d="M -70 -70 C -10 -40, -10 40, -70 70 C -60 50, -25 30, -25 0 C -25 -30, -60 -50, -70 -70 Z"
                fill="url(#goldBow)"
                stroke="#FFFDF0"
                strokeWidth="1"
              />

              {/* Bow String */}
              <line x1="-70" y1="-68" x2="-70" y2="68" stroke="#FFE89C" strokeWidth="1.8" opacity="0.85" />

              {/* Arrow Shaft */}
              <line x1="-80" y1="0" x2="65" y2="0" stroke="url(#goldBow)" strokeWidth="4" strokeLinecap="round" />

              {/* Blazing Fire Arrowhead (Agnibaana) */}
              <path d="M 65 0 L 45 -12 L 52 0 L 45 12 Z" fill="#FFFDF0" />
              <circle cx="65" cy="0" r="14" fill="url(#fireArrowGlow)" filter="url(#bowGlow)" className="animate-pulse" />
              
              {/* Fire Sparks behind Arrowhead */}
              <path d="M 65 0 L 90 -8 L 78 0 L 90 8 Z" fill="#FF4500" opacity="0.8" />
              <path d="M 65 0 L 105 -4 L 92 0 L 105 4 Z" fill="#FFD700" opacity="0.6" />

              {/* Arrow Feathers/Nock */}
              <polygon points="-80,0 -92,-8 -88,0 -92,8" fill="#D4AF37" />
            </g>

            {/* 🌸 FLOATING MARIGOLD PETALS & FIRE SPARKS */}
            <circle cx="50" cy="45" r="4" fill="#FF9900" className="animate-ping" />
            <circle cx="210" cy="165" r="3" fill="#FFD700" className="animate-pulse" />
            <circle cx="220" cy="50" r="3.5" fill="#FF4500" />
            <circle cx="40" cy="160" r="2.5" fill="#FFCC00" />

            {/* 📜 SANSKRIT VICTORY TEXT */}
            <text
              x="130"
              y="198"
              textAnchor="middle"
              fill="url(#goldBow)"
              fontSize="16"
              fontWeight="900"
              fontFamily="'Tiro Devanagari Hindi', serif"
              filter="url(#bowGlow)"
            >
              सत्यमेव जयते • विजयदशमी
            </text>
          </svg>
        </div>
      )}
    </div>
  );
}
