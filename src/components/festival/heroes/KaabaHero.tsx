'use client';

import React from 'react';

interface Props {
  imageUrl?: string;
  heroConfig?: any;
  scale?: number;
}

export default function KaabaHero({ heroConfig, scale }: Props) {
  const userScale = scale ?? heroConfig?.scale ?? 1.1;

  return (
    <div 
      className="relative w-full min-h-[250px] sm:min-h-[290px] flex flex-col items-center justify-center p-2 bg-transparent select-none overflow-visible transition-transform duration-300"
      style={{ transform: `scale(${userScale})` }}
    >
      {/* 🟢 ROYAL EMERALD & GOLD GLOW AURA */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-emerald-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

      {/* 🕋 3D ILLUMINATED HOLY KAABA SHARIF (Pure Vector Art with Gold Kiswah) */}
      <div className="relative z-10 w-full max-w-[260px] sm:max-w-[300px] flex items-center justify-center filter drop-shadow-[0_12px_35px_rgba(251,191,36,0.45)]">
        <svg viewBox="0 0 200 200" className="w-full h-auto overflow-visible">
          <defs>
            {/* 24K Gold Metallic Gradient */}
            <linearGradient id="goldKiswah" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFFDF0" />
              <stop offset="50%" stopColor="#FFD700" />
              <stop offset="100%" stopColor="#B87B00" />
            </linearGradient>

            <filter id="goldGlowKaaba" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Isometric Kaaba Cuboid */}
          {/* Front Right Wall */}
          <polygon points="100,45 170,78 170,155 100,122" fill="#101014" stroke="#2a2a35" strokeWidth="1" />
          
          {/* Front Left Wall */}
          <polygon points="100,45 30,78 30,155 100,122" fill="#181820" stroke="#2a2a35" strokeWidth="1" />
          
          {/* Top Roof */}
          <polygon points="100,45 170,78 100,110 30,78" fill="#252532" />

          {/* Golden Kiswah Band (Hizam) */}
          <polygon points="100,65 170,98 170,109 100,77" fill="url(#goldKiswah)" filter="url(#goldGlowKaaba)" />
          <polygon points="100,65 30,98 30,109 100,77" fill="url(#goldKiswah)" filter="url(#goldGlowKaaba)" />

          {/* Kaaba Door (Bab al-Kaaba) */}
          <polygon points="122,104 148,116 148,140 122,128" fill="url(#goldKiswah)" filter="url(#goldGlowKaaba)" />
        </svg>
      </div>

      {/* 📜 ARABIC CALLIGRAPHY FOR EID AL-ADHA */}
      <div className="relative z-10 text-2xl sm:text-3xl font-black text-amber-300 tracking-widest font-serif drop-shadow-[0_2px_15px_rgba(251,191,36,0.8)] mt-2">
        عيد الأضحى مبارك
      </div>

    </div>
  );
}
