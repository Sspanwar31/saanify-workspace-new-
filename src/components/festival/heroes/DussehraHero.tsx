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
      className="relative w-full min-h-[250px] sm:min-h-[280px] flex flex-col items-center justify-center p-2 bg-transparent select-none overflow-visible transition-transform duration-300"
      style={{ transform: `scale(${userScale})` }}
    >
      {/* 🔥 DYNAMIC FIRE & GOLD AMBIENT GLOW */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-amber-500/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] bg-red-500/20 rounded-full blur-2xl pointer-events-none" />

      {posterUrl && !imgError ? (
        /* 🖼️ OPTION A: HIGH-RES POSTER IMAGE (If uploaded in Supabase) */
        <div className="relative w-full max-w-[260px] aspect-[3/4] rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-[0_10px_40px_rgba(251,191,36,0.35)]">
          <img 
            src={posterUrl} 
            alt="Dussehra" 
            onError={() => setImgError(true)}
            className="w-full h-full object-cover" 
          />
        </div>
      ) : (
        /* 🏹 OPTION B: 100% SYMMETRICAL 3D GOLDEN BOW & FIRE ARROW (Straight UP) */
        <div className="relative z-10 w-full max-w-[280px] sm:max-w-[340px] flex items-center justify-center filter drop-shadow-[0_12px_35px_rgba(255,140,0,0.65)]">
          <svg viewBox="0 0 240 210" className="w-full h-auto overflow-visible">
            <defs>
              {/* 24K Gold Metallic Gradient */}
              <linearGradient id="goldBow2027" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFDF0" />
                <stop offset="30%" stopColor="#FFD700" />
                <stop offset="70%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#4A2D00" />
              </linearGradient>

              {/* Fire Arrow Flame Gradient */}
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

            {/* 🛡️ 3D GOLDEN SHIELD / MANDALA BACKGROUND DISC */}
            <circle cx="120" cy="105" r="75" fill="none" stroke="url(#goldBow2027)" strokeWidth="1.5" opacity="0.35" strokeDasharray="4 4" />
            <circle cx="120" cy="105" r="62" fill="none" stroke="url(#goldBow2027)" strokeWidth="2" opacity="0.55" />

            {/* 🏹 1. SYMMETRICAL GOLDEN BOW (Pointing STRAIGHT UPWARDS ↑) */}
            <g filter="url(#ultraBowGlow)">
              {/* Curved Golden Bow Arc */}
              <path
                d="M 30 115 Q 120 185 210 115 Q 120 160 30 115 Z"
                fill="url(#goldBow2027)"
                stroke="#FFFDF0"
                strokeWidth="1"
              />

              {/* Bow String (Pratyanja) */}
              <line x1="30" y1="115" x2="210" y2="115" stroke="#FFE89C" strokeWidth="1.8" opacity="0.9" />

              {/* 🚀 2. BLAZING FIRE ARROW (Pointing STRAIGHT UP ↑) */}
              {/* Arrow Shaft */}
              <line x1="120" y1="175" x2="120" y2="28" stroke="url(#goldBow2027)" strokeWidth="4.5" strokeLinecap="round" />

              {/* Arrowhead (Agnibaana) */}
              <polygon points="120,12 110,38 120,30 130,38" fill="#FFFDF0" />

              {/* Fireball & Sparks at Arrowhead */}
              <circle cx="120" cy="18" r="14" fill="url(#fireArrowCore)" className="animate-pulse" />
              
              {/* Arrow Feathers / Nock */}
              <polygon points="120,175 110,188 120,182 130,188" fill="#D4AF37" />
            </g>

            {/* 🌸 FLOATING MARIGOLD PETALS & FIRE SPARKS */}
            <circle cx="50" cy="50" r="3.5" fill="#FF9900" className="animate-ping" />
            <circle cx="190" cy="55" r="3" fill="#FFD700" className="animate-pulse" />
            <circle cx="210" cy="150" r="3.5" fill="#FF4500" />
            <circle cx="35" cy="140" r="2.5" fill="#FFCC00" />

            {/* 📜 SANSKRIT VICTORY TEXT */}
            <text
              x="120"
              y="204"
              textAnchor="middle"
              fill="url(#goldBow2027)"
              fontSize="15"
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
