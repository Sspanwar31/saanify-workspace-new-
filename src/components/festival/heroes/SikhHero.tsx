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
      className="relative w-full min-h-[260px] sm:min-h-[290px] flex flex-col items-center justify-center p-2 bg-transparent select-none overflow-visible transition-transform duration-300"
      style={{ transform: `scale(${userScale})` }}
    >
      {/* 🌟 AMBIENT SOLAR GOLD DIVINE GLOW */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] bg-amber-500/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] bg-yellow-400/25 rounded-full blur-2xl pointer-events-none" />

      {posterUrl ? (
        /* 🖼️ POSTER IMAGE (If provided in Supabase) */
        <div className="relative w-full max-w-[260px] aspect-[3/4] rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-[0_10px_40px_rgba(251,191,36,0.35)]">
          <img src={posterUrl} alt="Guru Nanak Jayanti" className="w-full h-full object-cover" />
        </div>
      ) : (
        /* ☬ TRANSPARENT 3D ACCURATE SIKH KHANDA & IK ONKAR (Pure Vector Art - No Box) */
        <div className="relative z-10 w-full max-w-[300px] sm:max-w-[360px] flex items-center justify-center filter drop-shadow-[0_10px_35px_rgba(251,191,36,0.6)]">
          <svg viewBox="0 0 280 210" className="w-full h-auto overflow-visible">
            <defs>
              {/* 24K Gold Metallic Gradient */}
              <linearGradient id="goldSikh2027" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFDF0" />
                <stop offset="25%" stopColor="#FFD700" />
                <stop offset="65%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#5B4302" />
              </linearGradient>

              <filter id="sikhGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* ੴ IK ONKAR (Gurmukhi Sacred Symbol at Top) */}
            <text
              x="140"
              y="30"
              textAnchor="middle"
              fill="url(#goldSikh2027)"
              fontSize="28"
              fontWeight="900"
              fontFamily="'Tiro Devanagari Hindi', serif"
              filter="url(#sikhGlow)"
            >
              ੴ
            </text>

            {/* ☬ AUTHENTIC ACCURATE 3D GOLDEN KHANDA */}
            <g transform="translate(140, 90) scale(0.95)" filter="url(#sikhGlow)">
              {/* 1. Center Double-Edged Sword (Khanda Blade) */}
              <path
                d="M 0 -52 L 4 -40 L 4 25 L 0 45 L -4 25 L -4 -40 Z"
                fill="url(#goldSikh2027)"
                stroke="#FFFDF0"
                strokeWidth="0.8"
              />
              {/* Blade Center Line */}
              <line x1="0" y1="-50" x2="0" y2="40" stroke="#FFFDF0" strokeWidth="1" opacity="0.8" />

              {/* 2. Circular Ring (Chakkar) */}
              <circle cx="0" cy="-5" r="24" fill="none" stroke="url(#goldSikh2027)" strokeWidth="5" />
              <circle cx="0" cy="-5" r="21.5" fill="none" stroke="#FFFDF0" strokeWidth="1" opacity="0.9" />

              {/* 3. Left Kirpan (Curved Sword) */}
              <path
                d="M -5 20 Q -28 5 -25 -32 Q -18 -32 -16 -12 Q -22 10 -5 20 Z"
                fill="url(#goldSikh2027)"
                stroke="#FFFDF0"
                strokeWidth="0.8"
              />

              {/* 4. Right Kirpan (Curved Sword) */}
              <path
                d="M 5 20 Q 28 5 25 -32 Q 18 -32 16 -12 Q 22 10 5 20 Z"
                fill="url(#goldSikh2027)"
                stroke="#FFFDF0"
                strokeWidth="0.8"
              />
            </g>

            {/* 🕌 GOLDEN TEMPLE DOME SILHOUETTE BASE */}
            <g transform="translate(0, 15)">
              <path d="M 60 160 L 220 160 L 210 138 Q 140 125 70 138 Z" fill="#2a1b05" stroke="url(#goldSikh2027)" strokeWidth="1.5" />
              <path d="M 110 138 Q 110 105 140 105 Q 170 105 170 138 Z" fill="url(#goldSikh2027)" filter="url(#sikhGlow)" opacity="0.9" />
              <circle cx="140" cy="102" r="3" fill="#FFFDF0" />
            </g>

            {/* 📜 GURBANI TEXT */}
            <text
              x="140"
              y="198"
              textAnchor="middle"
              fill="url(#goldSikh2027)"
              fontSize="16"
              fontWeight="900"
              fontFamily="'Tiro Devanagari Hindi', serif"
              filter="url(#sikhGlow)"
            >
              ੴ सतनाम श्री वाहेगुरु
            </text>
          </svg>
        </div>
      )}
    </div>
  );
}
