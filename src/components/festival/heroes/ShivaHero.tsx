'use client';

import React from 'react';

interface Props {
  imageUrl?: string;
  heroConfig?: any;
  scale?: number;
}

export default function ShivaHero({ heroConfig, scale, imageUrl }: Props) {
  const userScale = scale ?? heroConfig?.scale ?? 1.15;
  const posterUrl = heroConfig?.image_url || imageUrl;

  return (
    <div 
      className="relative w-full min-h-[250px] sm:min-h-[280px] flex flex-col items-center justify-center p-2 bg-transparent select-none overflow-visible transition-transform duration-300"
      style={{ transform: `scale(${userScale})` }}
    >
      {/* 💙 ROYAL DIVINE BLUE & GOLD AMBIENT GLOW */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] bg-sky-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

      {posterUrl ? (
        /* 🖼️ OPTION A: POSTER IMAGE (If provided in Supabase) */
        <div className="relative w-full max-w-[260px] aspect-[3/4] rounded-2xl overflow-hidden border-2 border-sky-400/50 shadow-[0_10px_40px_rgba(56,189,248,0.35)]">
          <img src={posterUrl} alt="Maha Shivratri" className="w-full h-full object-cover" />
        </div>
      ) : (
        /* 🔱 OPTION B: TRANSPARENT 3D DECORATED SHIVALINGA (Pure Vector Art - No Box Border) */
        <div className="relative z-10 w-full max-w-[280px] sm:max-w-[320px] flex items-center justify-center filter drop-shadow-[0_10px_30px_rgba(56,189,248,0.45)]">
          <svg viewBox="0 0 240 200" className="w-full h-auto overflow-visible">
            <defs>
              {/* Black Marble Stone Gradient */}
              <linearGradient id="shivaStone" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="40%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>

              {/* 24K Gold Metallic Gradient */}
              <linearGradient id="shivaGold" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFDF0" />
                <stop offset="30%" stopColor="#FFD700" />
                <stop offset="100%" stopColor="#B87B00" />
              </linearGradient>

              <filter id="iceGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* 🌙 Crescent Moon Background Halo */}
            <path d="M 120 18 A 20 20 0 1 0 120 54 A 16 16 0 1 1 120 18 Z" fill="#E0F7FF" filter="url(#iceGlow)" transform="rotate(-15 120 36)" />

            {/* Base Pedestal (Jaladhari Spout) */}
            <ellipse cx="120" cy="165" rx="85" ry="22" fill="url(#shivaStone)" stroke="#38bdf8" strokeWidth="1.5" />
            <ellipse cx="120" cy="148" rx="70" ry="18" fill="url(#shivaStone)" stroke="#38bdf8" strokeWidth="1.5" />

            {/* Main Shivalinga Stone (Pind) */}
            <path d="M 85 148 L 85 95 Q 85 45 120 45 Q 155 45 155 95 L 155 148 Z" fill="url(#shivaStone)" stroke="url(#shivaGold)" strokeWidth="1.5" />

            {/* Tripundra Bhasma Lines */}
            <rect x="96" y="72" width="48" height="3" fill="#E0F7FF" filter="url(#iceGlow)" />
            <rect x="96" y="79" width="48" height="3" fill="#E0F7FF" filter="url(#iceGlow)" />
            <rect x="96" y="86" width="48" height="3" fill="#E0F7FF" filter="url(#iceGlow)" />

            {/* Red Kumkum Bindu */}
            <circle cx="120" cy="80" r="4.5" fill="#EF4444" filter="url(#iceGlow)" />

            {/* Marigold Flower Garland at Base */}
            <path d="M 70 148 Q 120 170 170 148" fill="none" stroke="#F59E0B" strokeWidth="10" strokeLinecap="round" strokeDasharray="8 6" />
            <path d="M 70 148 Q 120 170 170 148" fill="none" stroke="#EF4444" strokeWidth="6" strokeLinecap="round" strokeDasharray="4 10" />
          </svg>
        </div>
      )}
    </div>
  );
}
