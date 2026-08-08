'use client';

import React from 'react';

interface Props {
  imageUrl?: string;
  heroConfig?: any;
}

export default function MoonHero({ imageUrl, heroConfig }: Props) {
  // Aapka Supabase Storage Eid Poster Image URL
  const posterUrl =
    heroConfig?.image_url ||
    imageUrl ||
    'https://cgntcihiwlzwkurkkarr.supabase.co/storage/v1/object/public/broadcasts/Eid%20&%20Fitur/Screenshot%202026-08-08%20071020.png';

  return (
    <div className="relative group flex items-center justify-center w-full max-w-[210px] sm:max-w-[240px] mx-auto py-1">
      {/* 🟢 ROYAL EMERALD & GOLD AMBIENT GLOW */}
      <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/35 via-amber-500/25 to-emerald-600/35 rounded-3xl blur-xl pointer-events-none animate-pulse" />

      {/* 🖼️ EID POSTER CARD (object-contain ensures FULL POSTER IS VISIBLE WITHOUT CROPPING) */}
      <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-[0_10px_40px_rgba(16,185,129,0.35)] bg-black/60 flex items-center justify-center">
        <img
          src={posterUrl}
          alt="Eid Mubarak 2027"
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    </div>
  );
}
