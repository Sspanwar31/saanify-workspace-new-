'use client';

import React, { useState } from 'react';

interface Props {
  imageUrl?: string;
  heroConfig?: any;
  scale?: number;
}

export default function DussehraHero({ heroConfig, scale, imageUrl }: Props) {
  const userScale = scale ?? heroConfig?.scale ?? 1.15;
  
  // Safe Image URL Check
  const rawUrl = imageUrl || heroConfig?.image_url;
  const posterUrl = rawUrl && typeof rawUrl === 'string' && rawUrl.trim().length > 5 ? rawUrl.trim() : null;

  const [imgError, setImgError] = useState(false);

  return (
    <div 
      className="relative w-full min-h-[250px] sm:min-h-[290px] flex flex-col items-center justify-center p-2 bg-transparent select-none overflow-visible transition-transform duration-300"
      style={{ transform: `scale(${userScale})` }}
    >
      {/* 🔥 DYNAMIC RAVAN DAHAN FIRE & GOLD GLOW */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[340px] bg-red-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] bg-amber-400/25 rounded-full blur-2xl pointer-events-none" />

      {posterUrl && !imgError ? (
        /* 🖼️ OPTION A: HIGH-RES POSTER IMAGE (If uploaded in Supabase) */
        <div className="relative w-full max-w-[260px] aspect-[3/4] rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-[0_10px_40px_rgba(251,191,36,0.35)]">
          <img 
            src={posterUrl} 
            alt="Dussehra Ravan Dahan" 
            onError={() => setImgError(true)}
            className="w-full h-full object-cover" 
          />
        </div>
      ) : (
        /* 🔥 OPTION B: 3D 10-HEADED RAVAN EFFIGY & FIREWORKS (Pure Vector Art - No Box) */
        <div className="relative z-10 w-full max-w-[290px] sm:max-w-[350px] flex items-center justify-center filter drop-shadow-[0_12px_35px_rgba(239,68,68,0.6)]">
          <svg viewBox="0 0 260 210" className="w-full h-auto overflow-visible">
            <defs>
              {/* 24K Gold Crown Gradient */}
              <linearGradient id="ravanGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFDF0" />
                <stop offset="30%" stopColor="#FFD700" />
                <stop offset="70%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#4A2D00" />
              </linearGradient>

              {/* Fire Explosion Flame Gradient */}
              <radialGradient id="fireBurstGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="25%" stopColor="#FFD700" />
                <stop offset="60%" stopColor="#FF4500" />
                <stop offset="100%" stopColor="#800000" />
              </radialGradient>

              {/* Glow Filter */}
              <filter id="ravanGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* 💥 RAVAN DAHAN FIRE EXPLOSION BURST */}
            <circle cx="130" cy="95" r="75" fill="url(#fireBurstGlow)" opacity="0.3" className="animate-pulse" />

            {/* 👑 10 GOLDEN CROWNS ARC (Ravan's 10 Heads) */}
            <g filter="url(#ravanGlow)">
              {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((i) => {
                const cx = 130 + i * 16;
                const cy = 60 + Math.abs(i) * 3;
                const isMain = i === 0;
                const scale = isMain ? 1.2 : 0.8;

                return (
                  <g key={i} transform={`translate(${cx}, ${cy}) scale(${scale})`}>
                    {/* Golden Crown (Mukut) */}
                    <polygon points="0,-16 -7,0 7,0" fill="url(#ravanGold)" />
                    <polygon points="-7,0 -10,-8 -4,-3 0,-12 4,-3 10,-8 7,0" fill="#FFFDF0" />
                    
                    {/* Red Gem on Crown */}
                    <circle cx="0" cy="-4" r="2" fill="#EF4444" />
                  </g>
                );
              })}
            </g>

            {/* 👹 10-HEADED RAVAN SILHOUETTE */}
            <g transform="translate(130, 115)">
              {/* Central Body & Shoulders */}
              <path
                d="M -45 40 L -25 0 L 25 0 L 45 40 Z"
                fill="#180408"
                stroke="url(#ravanGold)"
                strokeWidth="1.5"
              />

              {/* 10 Head Circles */}
              {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((i) => {
                const cx = i * 16;
                const cy = -35 + Math.abs(i) * 3;
                const r = i === 0 ? 11 : 8;

                return (
                  <g key={i}>
                    <circle cx={cx} cy={cy} r={r} fill="#1a050a" stroke="url(#ravanGold)" strokeWidth="1" />
                    {/* Fiery Red Eyes */}
                    <circle cx={cx - r * 0.35} cy={cy - 1} r={r * 0.18} fill="#EF4444" />
                    <circle cx={cx + r * 0.35} cy={cy - 1} r={r * 0.18} fill="#EF4444" />
                  </g>
                );
              })}
            </g>

            {/* 🎆 FIREWORK SPARKS & EMBERS */}
            <circle cx="50" cy="40" r="3" fill="#FF9900" className="animate-ping" />
            <circle cx="210" cy="45" r="3.5" fill="#FFD700" className="animate-pulse" />
            <circle cx="220" cy="140" r="2.5" fill="#FF4500" />
            <circle cx="40" cy="150" r="3" fill="#FFCC00" />

            {/* 📜 SANSKRIT VICTORY SHLOKA */}
            <text
              x="130"
              y="198"
              textAnchor="middle"
              fill="url(#ravanGold)"
              fontSize="15"
              fontWeight="900"
              fontFamily="'Tiro Devanagari Hindi', serif"
              filter="url(#ravanGlow)"
            >
              अधर्म पर धर्म की विजय • विजयदशमी
            </text>
          </svg>
        </div>
      )}
    </div>
  );
}
