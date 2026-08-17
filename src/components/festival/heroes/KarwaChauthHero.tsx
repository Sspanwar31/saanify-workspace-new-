'use client';

import React from 'react';

interface Props {
  imageUrl?: string;
  heroConfig?: any;
  scale?: number;
}

export default function KarwaChauthHero({ heroConfig, scale, imageUrl }: Props) {
  const userScale = scale ?? heroConfig?.scale ?? 1.15;
  const posterUrl = heroConfig?.image_url || imageUrl;

  return (
    <div 
      className="relative w-full min-h-[260px] sm:min-h-[290px] flex flex-col items-center justify-center p-2 bg-transparent select-none overflow-visible transition-transform duration-300"
      style={{ transform: `scale(${userScale})` }}
    >
      {/* 🔴 AMBIENT ROSE & GOLD GLOW */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-rose-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] bg-amber-400/25 rounded-full blur-2xl pointer-events-none" />

      {posterUrl ? (
        /* 🖼️ POSTER IMAGE (If provided in Supabase) */
        <div className="relative w-full max-w-[260px] aspect-[3/4] rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-[0_10px_40px_rgba(251,191,36,0.35)]">
          <img src={posterUrl} alt="Karwa Chauth" className="w-full h-full object-cover" />
        </div>
      ) : (
        /* 🌕 2027 KARWA CHAUTH: 3D FULL MOON & BRASS CHHANNI (SIEVE) */
        <div className="relative z-10 w-full max-w-[280px] sm:max-w-[340px] flex items-center justify-center filter drop-shadow-[0_12px_35px_rgba(244,63,94,0.45)]">
          <svg viewBox="0 0 240 200" className="w-full h-auto overflow-visible">
            <defs>
              {/* 3D Moon Spherical Gradient */}
              <radialGradient id="karwaMoonCore" cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="35%" stopColor="#FFF7D6" />
                <stop offset="70%" stopColor="#E2C785" />
                <stop offset="100%" stopColor="#8A6A32" />
              </radialGradient>

              {/* Brass Chhanni Metallic Gradient */}
              <linearGradient id="brassGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFDF0" />
                <stop offset="30%" stopColor="#FFD700" />
                <stop offset="70%" stopColor="#C59B27" />
                <stop offset="100%" stopColor="#4A3200" />
              </linearGradient>

              {/* Moon Halo Glow Filter */}
              <filter id="moonGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* 🌟 Radiant Silver-Gold Moon Halo */}
            <circle cx="120" cy="85" r="62" fill="rgba(255, 240, 190, 0.25)" filter="url(#moonGlow)" className="animate-pulse" />

            {/* 🌕 3D FULL MOON (Purnima Chand) */}
            <circle cx="120" cy="85" r="46" fill="url(#karwaMoonCore)" filter="url(#moonGlow)" />
            
            {/* Lunar Surface Texture/Craters */}
            <circle cx="108" cy="72" r="8" fill="#B89B5E" opacity="0.25" />
            <circle cx="132" cy="92" r="10" fill="#B89B5E" opacity="0.2" />
            <circle cx="100" cy="98" r="6" fill="#B89B5E" opacity="0.18" />

            {/* 🪔 3D TRADITIONAL BRASS CHHANNI (SIEVE) */}
            <g transform="translate(120, 100) rotate(-10)">
              {/* Outer Brass Ring Frame */}
              <ellipse cx="0" cy="0" rx="68" ry="42" fill="none" stroke="url(#brassGold)" strokeWidth="6" filter="url(#moonGlow)" />
              <ellipse cx="0" cy="0" rx="64" ry="38" fill="none" stroke="#FFE89C" strokeWidth="1.5" />

              {/* Mesh Grid Lines (Chhanni Jali) */}
              <path
                d="M -50 -15 L 50 -15 M -60 0 L 60 0 M -50 15 L 50 15 M -30 -30 L -30 30 M 0 -38 L 0 38 M 30 -30 L 30 30"
                stroke="rgba(255, 230, 150, 0.45)"
                strokeWidth="1.2"
              />

              {/* Handle of Chhanni */}
              <path d="M 68 0 L 95 15" stroke="url(#brassGold)" strokeWidth="6" strokeLinecap="round" />
            </g>

            {/* 🌹 FLOATING CRIMSON ROSE PETALS */}
            <path d="M 65 55 C 55 45, 45 60, 65 70 C 85 60, 75 45, 65 55 Z" fill="#F43F5E" opacity="0.85" transform="rotate(20 65 55)" />
            <path d="M 175 125 C 165 115, 155 130, 175 140 C 195 130, 185 115, 175 125 Z" fill="#E11D48" opacity="0.9" transform="rotate(-15 175 125)" />
            <circle cx="180" cy="60" r="3" fill="#FFE082" className="animate-ping" />
          </svg>
        </div>
      )}
    </div>
  );
}
