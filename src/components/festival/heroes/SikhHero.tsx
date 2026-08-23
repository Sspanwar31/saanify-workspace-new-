'use client';

import React from 'react';

interface Props {
  imageUrl?: string;
  heroConfig?: any;
  scale?: number;
}

export default function SikhHero({ heroConfig, scale, imageUrl }: Props) {
  const userScale = scale ?? heroConfig?.scale ?? 1.15;
  const posterUrl = heroConfig?.image_url || imageUrl;

  return (
    <div 
      className="relative w-full min-h-[250px] sm:min-h-[280px] flex flex-col items-center justify-center p-2 bg-transparent select-none overflow-visible transition-transform duration-300"
      style={{ transform: `scale(${userScale})` }}
    >
      {/* 🌟 AMBIENT GOLD & AMBER DIVINE GLOW */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-amber-500/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] bg-yellow-400/25 rounded-full blur-2xl pointer-events-none" />

      {posterUrl ? (
        /* 🖼️ POSTER IMAGE (If provided in Supabase) */
        <div className="relative w-full max-w-[260px] aspect-[3/4] rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-[0_10px_40px_rgba(251,191,36,0.35)]">
          <img src={posterUrl} alt="Guru Nanak Jayanti" className="w-full h-full object-cover" />
        </div>
      ) : (
        /* ☬ TRANSPARENT 3D GOLD KHANDA & GOLDEN TEMPLE (Pure Vector Art - No Box Border) */
        <div className="relative z-10 w-full max-w-[280px] sm:max-w-[340px] flex items-center justify-center filter drop-shadow-[0_10px_35px_rgba(251,191,36,0.55)]">
          <svg viewBox="0 0 240 210" className="w-full h-auto overflow-visible">
            <defs>
              {/* 24K Gold Metallic Gradient */}
              <linearGradient id="goldSikh" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFDF0" />
                <stop offset="25%" stopColor="#FFD700" />
                <stop offset="65%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#4A3200" />
              </linearGradient>

              <filter id="goldGlowSikh" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* ☬ 3D GOLDEN KHANDA SYMBOL */}
            <g transform="translate(120, 65) scale(0.85)">
              {/* Double Edged Sword (Khanda Center) */}
              <path d="M 0 -50 L -6 -10 L -3 30 L 3 30 L 6 -10 Z" fill="url(#goldSikh)" filter="url(#goldGlowSikh)" />
              <polygon points="0,-55 -3,-50 3,-50" fill="#FFFDF0" />

              {/* Circle (Chakkar) */}
              <circle cx="0" cy="-5" r="22" fill="none" stroke="url(#goldSikh)" strokeWidth="4.5" filter="url(#goldGlowSikh)" />

              {/* Left Curved Sword (Kirpan) */}
              <path d="M -8 18 Q -28 -5 -25 -32 Q -18 -30 -16 -12 Q -22 8 -8 18 Z" fill="url(#goldSikh)" filter="url(#goldGlowSikh)" />

              {/* Right Curved Sword (Kirpan) */}
              <path d="M 8 18 Q 28 -5 25 -32 Q 18 -30 16 -12 Q 22 8 8 18 Z" fill="url(#goldSikh)" filter="url(#goldGlowSikh)" />
            </g>

            {/* 🕌 GOLDEN TEMPLE DOME SILHOUETTE BASE */}
            <path d="M 50 160 L 190 160 L 180 135 Q 120 120 60 135 Z" fill="#2a1b05" stroke="url(#goldSikh)" strokeWidth="1.5" />
            
            {/* Central Temple Dome */}
            <path d="M 100 135 Q 100 100 120 100 Q 140 100 140 135 Z" fill="url(#goldSikh)" filter="url(#goldGlowSikh)" opacity="0.9" />

            {/* 📜 GURBANI TEXT (ੴ सतनाम श्री वाहेगुरु) */}
            <text
              x="120"
              y="192"
              textAnchor="middle"
              fill="#FFD700"
              fontSize="16"
              fontWeight="900"
              fontFamily="'Tiro Devanagari Hindi', serif"
              filter="url(#goldGlowSikh)"
            >
              ੴ सतनाम श्री वाहेगुरु
            </text>
          </svg>
        </div>
      )}
    </div>
  );
}
