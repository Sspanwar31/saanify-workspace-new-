'use client';

import React from 'react';

interface Props {
  imageUrl?: string;
  heroConfig?: any;
}

export default function PongalHero({ imageUrl, heroConfig }: Props) {
  // Supabase Storage Public Image URL
  const posterUrl =
    imageUrl ||
    heroConfig?.image_url ||
    'https://cgntcihiwlzwkurkkarr.supabase.co/storage/v1/object/public/broadcasts/pongal/Screenshot%202026-08-07%20212935.png';

  return (
    <div className="relative group flex items-center justify-center w-full max-w-[280px] sm:max-w-[320px] mx-auto py-2">
      {/* 🌟 AMBIENT GLOW AURA */}
      <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/30 via-yellow-500/20 to-amber-600/30 rounded-3xl blur-2xl group-hover:bg-amber-500/40 transition-all duration-500 pointer-events-none animate-pulse" />

      {/* 🖼️ ONLY CLEAN HIGH-RES POSTER IMAGE */}
      <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-[0_12px_45px_rgba(251,191,36,0.35)] transition-all duration-500 hover:scale-[1.03]">
        <img
          src={posterUrl}
          alt="Happy Pongal 2027"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Subtle Bottom Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
