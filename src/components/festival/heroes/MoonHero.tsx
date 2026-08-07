'use client';

import React from 'react';

interface Props {
  imageUrl?: string;
  heroConfig?: any;
}

export default function MoonHero({ imageUrl, heroConfig }: Props) {
  const posterUrl = imageUrl || heroConfig?.image_url;

  return (
    <div className="relative group flex items-center justify-center w-full max-w-[260px] sm:max-w-[290px] mx-auto py-1">
      {/* 🟢 ROYAL EMERALD & GOLD AMBIENT GLOW */}
      <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/35 via-amber-500/25 to-emerald-600/35 rounded-3xl blur-xl pointer-events-none animate-pulse" />

      {/* 🖼️ ROYAL EID CARD */}
      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-[0_10px_40px_rgba(16,185,129,0.35)] bg-gradient-to-b from-[#021f12] via-[#083a21] to-[#010c07] flex flex-col items-center justify-center p-4">
        
        {posterUrl ? (
          <img
            src={posterUrl}
            alt="Eid Mubarak"
            className="w-full h-full object-cover rounded-xl"
          />
        ) : (
          /* 🌙 3D LUXURY CRESCENT & CALLIGRAPHY ARTWORK */
          <div className="flex flex-col items-center justify-center space-y-2">
            
            {/* 3D Crescent Moon */}
            <div className="text-6xl filter drop-shadow-[0_0_25px_rgba(251,191,36,0.9)] transform -rotate-12 animate-hero-breathe">
              🌙
            </div>

            {/* Arabic Calligraphy */}
            <div className="text-xl font-bold text-amber-300 tracking-widest font-serif drop-shadow-[0_2px_10px_rgba(251,191,36,0.6)]">
              عيد مبارك
            </div>

            {/* Subtitle Badge */}
            <div className="px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[10px] font-bold text-emerald-200 tracking-wider uppercase">
              ✦ SACRED LUNAR GLOW ✦
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
