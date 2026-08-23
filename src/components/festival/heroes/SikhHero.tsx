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
      {/* 💜 ROYAL PURPLE & GOLD AMBIENT GLOW */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-purple-600/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] bg-amber-400/25 rounded-full blur-2xl pointer-events-none" />

      {posterUrl ? (
        /* 🖼️ POSTER IMAGE (If provided in Supabase) */
        <div className="relative w-full max-w-[260px] aspect-[3/4] rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-[0_10px_40px_rgba(251,191,36,0.35)]">
          <img src={posterUrl} alt="Guru Nanak Jayanti" className="w-full h-full object-cover" />
        </div>
      ) : (
        /* ☬ PINTEREST REPLICA: ROYAL PURPLE & GOLD SIKH MANDALA EMBLEM */
        <div className="relative z-10 w-full max-w-[320px] sm:max-w-[380px] flex items-center justify-center filter drop-shadow-[0_12px_40px_rgba(251,191,36,0.65)]">
          <svg viewBox="0 0 280 240" className="w-full h-auto overflow-visible">
            <defs>
              {/* Royal Purple Gradient Disc */}
              <radialGradient id="royalPurpleBg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#4a045c" />
                <stop offset="60%" stopColor="#21012b" />
                <stop offset="100%" stopColor="#0d0014" />
              </radialGradient>

              {/* 24K Gold Metallic Gradient */}
              <linearGradient id="royalGoldSikh" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFDF0" />
                <stop offset="25%" stopColor="#FFD700" />
                <stop offset="65%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#5B4302" />
              </linearGradient>

              <filter id="goldGlowEmblem" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* 💜 ROYAL PURPLE BACKDROP DISC (Exact Pinterest Match) */}
            <circle cx="140" cy="110" r="88" fill="url(#royalPurpleBg)" stroke="url(#royalGoldSikh)" strokeWidth="1.5" />

            {/* 🌟 1. OUTER SUNBURST RAYS (36 Tapered Light Rays) */}
            <g filter="url(#goldGlowEmblem)">
              {[...Array(36)].map((_, i) => {
                const angle = (i / 36) * Math.PI * 2;
                const r1 = 68;
                const r2 = i % 2 === 0 ? 86 : 76;
                const x1 = 140 + Math.cos(angle) * r1;
                const y1 = 110 + Math.sin(angle) * r1;
                const x2 = 140 + Math.cos(angle) * r2;
                const y2 = 110 + Math.sin(angle) * r2;
                return (
                  <line
                    key={i}
                    x1={x1} y1={y1}
                    x2={x2} y2={y2}
                    stroke="url(#royalGoldSikh)"
                    strokeWidth={i % 2 === 0 ? '2' : '1.2'}
                    strokeLinecap="round"
                  />
                );
              })}
            </g>

            {/* 🏵️ 2. INTRICATE MANDALA CONCENTRIC GOLD RINGS */}
            <circle cx="140" cy="110" r="66" fill="none" stroke="url(#royalGoldSikh)" strokeWidth="3" filter="url(#goldGlowEmblem)" />
            <circle cx="140" cy="110" r="60" fill="none" stroke="#FFE89C" strokeWidth="1.2" opacity="0.8" />
            <circle cx="140" cy="110" r="54" fill="none" stroke="url(#royalGoldSikh)" strokeWidth="2.5" />

            {/* Beaded Dots Ring */}
            {[...Array(24)].map((_, i) => {
              const angle = (i / 24) * Math.PI * 2;
              const bx = 140 + Math.cos(angle) * 57;
              const by = 110 + Math.sin(angle) * 55;
              return <circle key={i} cx={bx} cy={by} r="1.8" fill="#FFD700" />;
            })}

            {/* ☬ 3. RIGHT-SIDE UP ACCURATE 3D GOLDEN KHANDA */}
            <g transform="translate(140, 110) scale(0.9)" filter="url(#goldGlowEmblem)">
              {/* Center Double Blade (Points UP) */}
              <path d="M 0 -48 L 4 -36 L 4 22 L 0 42 L -4 22 L -4 -36 Z" fill="url(#royalGoldSikh)" stroke="#FFFDF0" strokeWidth="0.8" />
              <line x1="0" y1="-46" x2="0" y2="38" stroke="#FFFDF0" strokeWidth="1" opacity="0.8" />

              {/* Circular Ring (Chakkar) */}
              <circle cx="0" cy="-6" r="22" fill="none" stroke="url(#royalGoldSikh)" strokeWidth="5" />
              <circle cx="0" cy="-6" r="19.5" fill="none" stroke="#FFFDF0" strokeWidth="1" opacity="0.9" />

              {/* Left Curved Kirpan (Curves UPWARDS) */}
              <path d="M -5 18 C -22 10 -26 -12 -23 -32 C -18 -32 -16 -12 -5 18 Z" fill="url(#royalGoldSikh)" stroke="#FFFDF0" strokeWidth="0.8" />

              {/* Right Curved Kirpan (Curves UPWARDS) */}
              <path d="M 5 18 C 22 10 26 -12 23 -32 C 18 -32 16 -12 5 18 Z" fill="url(#royalGoldSikh)" stroke="#FFFDF0" strokeWidth="0.8" />
            </g>

            {/* 🚩 4. NISHAN SAHIB GOLDEN FLAGS (Symmetrical Outward) */}
            {/* Left Flag */}
            <g transform="translate(58, 175) rotate(-22)" filter="url(#goldGlowEmblem)">
              <line x1="0" y1="20" x2="0" y2="-28" stroke="url(#royalGoldSikh)" strokeWidth="2.5" />
              <path d="M 0 -28 L 30 -17 L 0 -6 Z" fill="url(#royalGoldSikh)" />
            </g>

            {/* Right Flag */}
            <g transform="translate(222, 175) rotate(22) scale(-1, 1)" filter="url(#goldGlowEmblem)">
              <line x1="0" y1="20" x2="0" y2="-28" stroke="url(#royalGoldSikh)" strokeWidth="2.5" />
              <path d="M 0 -28 L 30 -17 L 0 -6 Z" fill="url(#royalGoldSikh)" />
            </g>

            {/* 🪔 5. HANGING GOLD BEAD CHAINS (Pinterest Match) */}
            <g opacity="0.85" filter="url(#goldGlowEmblem)">
              <line x1="30" y1="0" x2="30" y2="45" stroke="url(#royalGoldSikh)" strokeWidth="1" />
              <circle cx="30" cy="45" r="4" fill="url(#royalGoldSikh)" />

              <line x1="250" y1="0" x2="250" y2="45" stroke="url(#royalGoldSikh)" strokeWidth="1" />
              <circle cx="250" cy="45" r="4" fill="url(#royalGoldSikh)" />
            </g>
          </svg>
        </div>
      )}
    </div>
  );
}
