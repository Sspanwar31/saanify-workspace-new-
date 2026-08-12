'use client';

import React from 'react';

interface Props {
  imageUrl?: string;
  heroConfig?: any;
  scale?: number;
}

export default function ShivaHero({ heroConfig, scale, imageUrl }: Props) {
  const userScale = scale ?? heroConfig?.scale ?? 1.2;
  const posterUrl = heroConfig?.image_url || imageUrl;

  return (
    <div 
      className="relative w-full min-h-[250px] sm:min-h-[290px] flex flex-col items-center justify-center p-2 bg-transparent select-none overflow-visible transition-transform duration-300"
      style={{ transform: `scale(${userScale})` }}
    >
      {/* 💙 ROYAL DIVINE BLUE & GOLD AMBIENT GLOW */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-sky-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] bg-amber-400/25 rounded-full blur-2xl pointer-events-none" />

      {posterUrl ? (
        /* 🖼️ POSTER IMAGE (If provided in Supabase) */
        <div className="relative w-full max-w-[260px] aspect-[3/4] rounded-2xl overflow-hidden border-2 border-sky-400/50 shadow-[0_10px_40px_rgba(56,189,248,0.35)]">
          <img src={posterUrl} alt="Maha Shivratri" className="w-full h-full object-cover" />
        </div>
      ) : (
        /* 🔱 3D SHIVALINGA WITH BEL PATRA LEAF & FRESH FLOWERS */
        <div className="relative z-10 w-full max-w-[280px] sm:max-w-[340px] flex items-center justify-center filter drop-shadow-[0_12px_35px_rgba(56,189,248,0.5)]">
          <svg viewBox="0 0 240 210" className="w-full h-auto overflow-visible">
            <defs>
              {/* Black Marble Stone Gradient */}
              <linearGradient id="shivaStone" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#64748b" />
                <stop offset="35%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>

              {/* 24K Gold Gradient */}
              <linearGradient id="shivaGold" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFDF0" />
                <stop offset="30%" stopColor="#FFD700" />
                <stop offset="100%" stopColor="#B87B00" />
              </linearGradient>

              {/* Ice Glow Filter */}
              <filter id="iceGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* 🌙 Crescent Moon Background Halo */}
            <path d="M 120 12 A 22 22 0 1 0 120 52 A 17 17 0 1 1 120 12 Z" fill="#E0F7FF" filter="url(#iceGlow)" transform="rotate(-15 120 32)" />

            {/* Jaladhari Pedestal Base */}
            <ellipse cx="120" cy="172" rx="90" ry="24" fill="url(#shivaStone)" stroke="#38bdf8" strokeWidth="1.5" />
            <ellipse cx="120" cy="154" rx="75" ry="19" fill="url(#shivaStone)" stroke="#38bdf8" strokeWidth="1.5" />

            {/* Main Shivalinga Pind Stone */}
            <path d="M 82 154 L 85 98 Q 85 48 120 48 Q 155 48 155 98 L 155 154 Z" fill="url(#shivaStone)" stroke="url(#shivaGold)" strokeWidth="1.5" />

            {/* Tripundra Bhasma Lines */}
            <rect x="94" y="78" width="52" height="3.5" fill="#E0F7FF" filter="url(#iceGlow)" rx="1" />
            <rect x="94" y="86" width="52" height="3.5" fill="#E0F7FF" filter="url(#iceGlow)" rx="1" />
            <rect x="94" y="94" width="52" height="3.5" fill="#E0F7FF" filter="url(#iceGlow)" rx="1" />

            {/* Red Kumkum Bindu */}
            <circle cx="120" cy="87" r="5" fill="#EF4444" filter="url(#iceGlow)" />

            {/* 🍃 BEL PATRA LEAF ON TOP OF SHIVALINGA (Trifoliate Bael Leaf) */}
            <g transform="translate(120, 48) scale(0.95)" filter="url(#iceGlow)">
              {/* Center Leaf */}
              <path d="M 0 0 C -6 -12, -8 -22, 0 -30 C 8 -22, 6 -12, 0 0 Z" fill="#22c55e" stroke="#15803d" strokeWidth="0.8" />
              {/* Left Leaf */}
              <path d="M -2 -4 C -14 -12, -22 -8, -25 3 C -18 10, -10 6, -2 -4 Z" fill="#16a34a" stroke="#15803d" strokeWidth="0.8" />
              {/* Right Leaf */}
              <path d="M 2 -4 C 14 -12, 22 -8, 25 3 C 18 10, 10 6, 2 -4 Z" fill="#16a34a" stroke="#15803d" strokeWidth="0.8" />
              {/* Veins */}
              <path d="M 0 0 L 0 -24 M -2 -4 L -18 -2 M 2 -4 L 18 -2" stroke="#86efac" strokeWidth="0.8" />
            </g>

            {/* 🌸 FRESH MARIGOLD FLOWER OFFERING ON TOP */}
            <circle cx="105" cy="52" r="5" fill="#FF9900" />
            <circle cx="105" cy="52" r="2.8" fill="#FFCC00" />

            {/* Marigold Garland Around Base */}
            <path d="M 68 154 Q 120 178 172 154" fill="none" stroke="#F59E0B" strokeWidth="11" strokeLinecap="round" strokeDasharray="9 6" />
            <path d="M 68 154 Q 120 178 172 154" fill="none" stroke="#EF4444" strokeWidth="7" strokeLinecap="round" strokeDasharray="4 11" />
          </svg>
        </div>
      )}
    </div>
  );
}
