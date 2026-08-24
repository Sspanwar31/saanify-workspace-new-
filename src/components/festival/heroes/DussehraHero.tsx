'use client';

import React, { useState } from 'react';

interface Props {
  imageUrl?: string;
  heroConfig?: any;
  scale?: number;
}

export default function DussehraHero({ heroConfig, scale, imageUrl }: Props) {
  const userScale = scale ?? heroConfig?.scale ?? 1.15;

  // 🏆 SUPABASE STORAGE HIGH-RES DUSSEHRA POSTER IMAGE INTEGRATED
  const rawUrl = imageUrl || heroConfig?.image_url;
  const posterUrl =
    (rawUrl && typeof rawUrl === 'string' && rawUrl.trim().length > 5 ? rawUrl.trim() : null) ||
    'https://cgntcihiwlzwkurkkarr.supabase.co/storage/v1/object/public/broadcasts/dussehra/Screenshot%202026-08-24%20220338.png';

  const [imgError, setImgError] = useState(false);

  return (
    <div 
      className="relative w-full min-h-[280px] sm:min-h-[320px] flex flex-col items-center justify-center p-2 bg-transparent select-none overflow-visible transition-transform duration-300"
      style={{ transform: `scale(${userScale})` }}
    >
      {/* 🔥 DYNAMIC FIRE & GOLD AMBIENT GLOW */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] bg-amber-500/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px] bg-red-500/20 rounded-full blur-2xl pointer-events-none" />

      {/* 🖼️ HIGH-RES DUSSEHRA POSTER CARD FRAME */}
      <div className="relative z-20 w-full max-w-[270px] aspect-[3/4] rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-[0_15px_55px_rgba(239,68,68,0.45)] transition-transform duration-500 hover:scale-[1.02]">
        <img 
          src={posterUrl} 
          alt="Happy Dussehra Vijayadashami" 
          onError={() => setImgError(true)}
          className="w-full h-full object-cover" 
        />
        {/* Subtle Inner Lighting Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
