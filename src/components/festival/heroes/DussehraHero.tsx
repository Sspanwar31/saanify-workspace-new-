'use client';

import React, { useState } from 'react';

interface Props {
  imageUrl?: string;
  heroConfig?: any;
  scale?: number;
}

export default function DussehraHero({ heroConfig, scale, imageUrl }: Props) {
  // 🚀 Supabase DB Controlled Scale (Default 0.75 for compact fit in modal)
  const userScale = scale ?? heroConfig?.scale ?? 0.75;

  // 🏆 Supabase Image URL Fallback
  const rawUrl = imageUrl || heroConfig?.image_url;
  const posterUrl =
    (rawUrl && typeof rawUrl === 'string' && rawUrl.trim().length > 5 ? rawUrl.trim() : null) ||
    'https://cgntcihiwlzwkurkkarr.supabase.co/storage/v1/object/public/broadcasts/dussehra/Screenshot%202026-08-24%20220338.png';

  const [imgError, setImgError] = useState(false);

  return (
    <div 
      className="relative w-full flex flex-col items-center justify-center p-1 bg-transparent select-none overflow-visible transition-transform duration-300 ease-out"
      style={{ transform: `scale(${userScale})` }}
    >
      {/* 🔥 DYNAMIC FIRE & GOLD AMBIENT GLOW */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] bg-amber-500/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] bg-red-500/20 rounded-full blur-2xl pointer-events-none" />

      {/* 🖼️ HIGH-RES DUSSEHRA POSTER CARD FRAME */}
      <div className="relative z-20 w-[220px] sm:w-[250px] aspect-[3/4] rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-[0_12px_45px_rgba(239,68,68,0.45)] transition-transform duration-500 hover:scale-[1.02]">
        <img 
          src={posterUrl} 
          alt="Happy Dussehra Vijayadashami" 
          onError={() => setImgError(true)}
          className="w-full h-full object-cover" 
        />
        {/* Inner Lighting Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
