'use client';

import React, { useState } from 'react';

interface Props {
  imageUrl?: string;
  heroConfig?: any;
}

export default function MoonHero({ imageUrl, heroConfig }: Props) {
  // Check if a valid non-empty image URL exists
  const rawUrl = imageUrl || heroConfig?.image_url;
  const validUrl = rawUrl && typeof rawUrl === 'string' && rawUrl.trim().length > 5 ? rawUrl : null;

  const [imgError, setImgError] = useState(false);

  return (
    <div className="relative w-full h-full min-h-[220px] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#021f12] via-[#073820] to-[#010d07]">
      
      {validUrl && !imgError ? (
        <img
          src={validUrl}
          alt="Eid Mubarak"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        /* 🌙 GUARANTEED 3D EID VISUAL FALLBACK */
        <div className="relative w-full h-full min-h-[220px] flex flex-col items-center justify-center p-4 space-y-3">
          
          {/* Ambient Glow */}
          <div className="absolute inset-0 bg-emerald-500/20 blur-2xl pointer-events-none animate-pulse" />

          {/* 3D Crescent Moon */}
          <div className="text-6xl sm:text-7xl filter drop-shadow-[0_0_30px_rgba(251,191,36,0.9)] transform -rotate-12 animate-hero-breathe z-10">
            🌙
          </div>

          {/* Arabic Calligraphy */}
          <div className="text-2xl sm:text-3xl font-black text-amber-300 tracking-widest font-serif drop-shadow-[0_2px_15px_rgba(251,191,36,0.7)] z-10">
            عيد مبارك
          </div>

          {/* Gold Badge */}
          <div className="px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-[10px] sm:text-xs font-bold text-amber-200 tracking-widest uppercase z-10 shadow-lg">
            ✦ EID MUBARAK 2027 ✦
          </div>

        </div>
      )}

    </div>
  );
}
