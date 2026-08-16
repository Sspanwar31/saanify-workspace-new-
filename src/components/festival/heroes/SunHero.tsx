'use client';

import React from 'react';

interface Props {
  imageUrl?: string;
  heroConfig?: any;
  scale?: number;
}

export default function SunHero({ heroConfig, scale, imageUrl }: Props) {
  const userScale = scale ?? heroConfig?.scale ?? 1.15;
  const posterUrl = heroConfig?.image_url || imageUrl;

  return (
    <div 
      className="relative w-full min-h-[250px] sm:min-h-[280px] flex flex-col items-center justify-center p-2 bg-transparent select-none overflow-visible transition-transform duration-300"
      style={{ transform: `scale(${userScale})` }}
    >
      {/* ☀️ SOLAR GOLDEN AMBIENT GLOW */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-amber-500/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] bg-yellow-400/25 rounded-full blur-2xl pointer-events-none" />

      {posterUrl ? (
        <div className="relative w-full max-w-[260px] aspect-[3/4] rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-[0_10px_40px_rgba(251,191,36,0.35)]">
          <img src={posterUrl} alt="Chhath Puja" className="w-full h-full object-cover" />
        </div>
      ) : (
        /* ☀️ TRANSPARENT 3D SOLAR SURYA DEV & ARGHYA SOOP (Pure Vector Art - No Box) */
        <div className="relative z-10 w-full max-w-[280px] sm:max-w-[340px] flex items-center justify-center filter drop-shadow-[0_10px_35px_rgba(251,191,36,0.5)]">
          <svg viewBox="0 0 240 210" className="w-full h-auto overflow-visible">
            <defs>
              <linearGradient id="sunGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFDF0" />
                <stop offset="40%" stopColor="#FFD700" />
                <stop offset="80%" stopColor="#FF9900" />
                <stop offset="100%" stopColor="#B87B00" />
              </linearGradient>

              <filter id="sunGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* ☀️ Glowing Sun Disc */}
            <circle cx="120" cy="75" r="42" fill="url(#sunGold)" filter="url(#sunGlow)" />

            {/* Solar Ray Blades */}
            {[...Array(12)].map((_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              const x1 = 120 + Math.cos(angle) * 48;
              const y1 = 75 + Math.sin(angle) * 48;
              const x2 = 120 + Math.cos(angle) * 64;
              const y2 = 75 + Math.sin(angle) * 64;
              return (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFD700" strokeWidth="3" strokeLinecap="round" filter="url(#sunGlow)" />
              );
            })}

            {/* 🌾 Bamboo Winnowing Basket (Soop/Supa) */}
            <path d="M 60 145 Q 120 185 180 145 L 170 120 Q 120 135 70 120 Z" fill="#D4AF37" stroke="#FFE39A" strokeWidth="1.5" />
            
            {/* Offerings in Soop (Thekua & Coconut) */}
            <ellipse cx="120" cy="132" rx="14" ry="9" fill="#8C451E" />
            <ellipse cx="95" cy="135" rx="12" ry="7" fill="#F59E0B" />
            <ellipse cx="145" cy="135" rx="12" ry="7" fill="#F59E0B" />

            {/* 📜 SANSKRIT SURYA MANTRA */}
            <text x="120" y="200" textAnchor="middle" fill="#FFD700" fontSize="16" fontWeight="900" fontFamily="Tiro Devanagari Hindi, serif" filter="url(#sunGlow)">
              ॐ घृणिः सूर्याय नमः
            </text>
          </svg>
        </div>
      )}
    </div>
  );
}
