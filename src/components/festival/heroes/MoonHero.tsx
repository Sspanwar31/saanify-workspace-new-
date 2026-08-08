'use client';

import React from 'react';

interface Props {
  imageUrl?: string;
  heroConfig?: any;
  scale?: number;
  speed?: number;
}

export default function MoonHero({ imageUrl, heroConfig }: Props) {
  // Supabase Storage Public Eid Poster Image URL
  const posterUrl =
    (heroConfig?.image_url && heroConfig.image_url.trim().length > 5 ? heroConfig.image_url : null) ||
    (imageUrl && imageUrl.trim().length > 5 ? imageUrl : null) ||
    'https://cgntcihiwlzwkurkkarr.supabase.co/storage/v1/object/public/broadcasts/Eid%20&%20Fitur/Screenshot%202026-08-08%20071020.png';

  return (
    <div className="relative w-full h-full min-h-[250px] sm:min-h-[300px] flex items-center justify-center overflow-hidden bg-black">
      
      {/* 🖼️ FULL-BLEED POSTER IMAGE (Fills 100% of top modal section - No empty black space) */}
      <img
        src={posterUrl}
        alt="Eid Mubarak 2027"
        className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
      />

      {/* ✨ SLEEK BOTTOM GOLDEN BORDER LINE */}
      <div className="absolute inset-x-0 bottom-0 border-b-2 border-amber-400/60 pointer-events-none z-20" />

      {/* 🖤 SEAMLESS GRADIENT BLEND AT BOTTOM */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#091016] via-[#091016]/60 to-transparent pointer-events-none z-10" />

    </div>
  );
}
