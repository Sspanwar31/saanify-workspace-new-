'use client';

import React, { useState } from 'react';

interface Props {
  imageUrl?: string;
  heroConfig?: any;
  scale?: number;
}

export default function DussehraHero({ heroConfig, scale, imageUrl }: Props) {
  // 🚀 Scale boosted (1.25x) to fill the top modal slot prominently
  const userScale = scale ?? (heroConfig?.scale ? Math.max(heroConfig.scale * 1.5, 1.1) : 1.25);
  
  const rawUrl = imageUrl || heroConfig?.image_url;
  const posterUrl = rawUrl && typeof rawUrl === 'string' && rawUrl.trim().length > 5 ? rawUrl.trim() : null;

  const [imgError, setImgError] = useState(false);

  return (
    <div 
      className="relative w-full min-h-[270px] sm:min-h-[310px] flex flex-col items-center justify-center p-2 bg-transparent select-none overflow-visible transition-transform duration-300"
      style={{ transform: `scale(${userScale})` }}
    >
      {/* 🔥 DYNAMIC FIRE & GOLD AMBIENT GLOW */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-amber-500/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px] bg-red-500/20 rounded-full blur-2xl pointer-events-none" />

      {posterUrl && !imgError ? (
        /* 🖼️ OPTION A: HIGH-RES POSTER IMAGE (If uploaded in Supabase) */
        <div className="relative w-full max-w-[260px] aspect-[3/4] rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-[0_10px_40px_rgba(251,191,36,0.35)]">
          <img 
            src={posterUrl} 
            alt="Dussehra Vijayadashami" 
            onError={() => setImgError(true)}
            className="w-full h-full object-cover" 
          />
        </div>
      ) : (
        /* 🏹 OPTION B: PROMINENT 3D GOLDEN BOW & FIRE ARROW VICTORY EMBLEM */
        <div className="relative z-10 w-full max-w-[320px] sm:max-w-[380px] flex items-center justify-center filter drop-shadow-[0_12px_40px_rgba(255,140,0,0.7)]">
          <svg viewBox="0 0 260 210" className="w-full h-auto overflow-visible">
            <defs>
              {/* 24K Gold Metallic Gradient */}
              <linearGradient id="goldBow2027" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFDF0" />
                <stop offset="25%" stopColor="#FFD700" />
                <stop offset="65%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#5B4302" />
              </linearGradient>

              {/* Fire Flame Gradient */}
              <radialGradient id="fireArrowCore" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="25%" stopColor="#FFEE55" />
                <stop offset="60%" stopColor="#FF6600" />
                <stop offset="100%" stopColor="#CC0000" />
              </radialGradient>

              {/* Glow Filter */}
              <filter id="ultraBowGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* 🛡️ 10-POINT GOLDEN VICTORY SHIELD DISC (10 Heads Victory Symbol) */}
            <circle cx="130" cy="95" r="75" fill="none" stroke="url(#goldBow2027)" strokeWidth="1.5" opacity="0.35" strokeDasharray="4 4" />
            <circle cx="130" cy="95" r="62" fill="none" stroke="url(#goldBow2027)" strokeWidth="2" opacity="0.55" />

            {/* 10 Golden Rays on Shield Rim */}
            {[...Array(10)].map((_, i) => {
              const angle = (i / 10) * Math.PI * 2;
              const x1 = 130 + Math.cos(angle) * 62;
              const y1 = 95 + Math.sin(angle) * 62;
              const x2 = 130 + Math.cos(angle) * 72;
              const y2 = 95 + Math.sin(angle) * 72;
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFD700" strokeWidth="2" strokeLinecap="round" filter="url(#ultraBowGlow)" />;
            })}

            {/* 🏹 SYMMETRICAL GOLDEN BOW (Pointing STRAIGHT UP ↑) */}
            <g filter="url(#ultraBowGlow)">
              {/* Curved Golden Bow Arc */}
              <path
                d="M 40 105 Q 130 175 220 105 Q 130 150 40 105 Z"
                fill="url(#goldBow2027)"
                stroke="#FFFDF0"
                strokeWidth="1"
              />

              {/* Bow String (Pratyanja) */}
              <line x1="40" y1="105" x2="220" y2="105" stroke="#FFE89C" strokeWidth="2" opacity="0.9" />

              {/* 🚀 BLAZING FIRE ARROW (Pointing STRAIGHT UP ↑) */}
              {/* Arrow Shaft */}
              <line x1="130" y1="165" x2="130" y2="22" stroke="url(#goldBow2027)" strokeWidth="5" strokeLinecap="round" />

              {/* Arrowhead (Agnibaana) */}
              <polygon points="130,8 118,34 130,26 142,34" fill="#FFFDF0" />

              {/* Fireball & Sparks at Arrowhead */}
              <circle cx="130" cy="15" r="15" fill="url(#fireArrowCore)" className="animate-pulse" />
              
              {/* Arrow Feathers / Nock */}
              <polygon points="130,165 118,178 130,172 142,178" fill="#D4AF37" />
            </g>

            {/* 🌸 FLOATING MARIGOLD PETALS & FIRE SPARKS */}
            <circle cx="50" cy="45" r="4" fill="#FF9900" className="animate-ping" />
            <circle cx="210" cy="45" r="3.5" fill="#FFD700" className="animate-pulse" />
            <circle cx="220" cy="140" r="3" fill="#FF4500" />
            <circle cx="35" cy="130" r="2.5" fill="#FFCC00" />

            {/* 📜 SANSKRIT VICTORY TEXT */}
            <text
              x="130"
              y="198"
              textAnchor="middle"
              fill="url(#goldBow2027)"
              fontSize="16"
              fontWeight="900"
              fontFamily="'Tiro Devanagari Hindi', serif"
              filter="url(#ultraBowGlow)"
            >
              सत्यमेव जयते • विजयदशमी
            </text>
          </svg>
        </div>
      )}
    </div>
  );
}
