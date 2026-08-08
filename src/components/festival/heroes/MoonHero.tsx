'use client';

import React from 'react';

interface Props {
  imageUrl?: string;
  heroConfig?: any;
  scale?: number;
  speed?: number;
}

export default function MoonHero({ imageUrl, heroConfig, scale, speed }: Props) {
  // 1. SUPABASE DYNAMIC CONFIGS (Controlled from Supabase Database)
  const userScale = scale ?? heroConfig?.scale ?? 0.6; // Scale value from Supabase DB (Default 0.6)
  const userSpeed = speed ?? heroConfig?.speed ?? 4;   // Speed value from Supabase DB (Default 4s)

  // 2. EID POSTER IMAGE URL FROM SUPABASE
  const posterUrl =
    (heroConfig?.image_url && heroConfig.image_url.trim().length > 5 ? heroConfig.image_url : null) ||
    (imageUrl && imageUrl.trim().length > 5 ? imageUrl : null) ||
    'https://cgntcihiwlzwkurkkarr.supabase.co/storage/v1/object/public/broadcasts/Eid%20&%20Fitur/Screenshot%202026-08-08%20071020.png';

  return (
    <div 
      className="relative group flex items-center justify-center w-full mx-auto py-1 transition-transform duration-300 ease-out overflow-visible"
      style={{ transform: `scale(${userScale})` }}
    >
      {/* 🟢 SLEEK AMBIENT GLOW (Speed Controlled by Supabase) */}
      <div 
        className="absolute -inset-1 bg-gradient-to-r from-amber-500/25 via-emerald-500/20 to-amber-500/25 rounded-2xl blur-md pointer-events-none animate-pulse"
        style={{ animationDuration: `${userSpeed}s` }}
      />

      {/* 🖼️ THIN ELEGANT PICTURE FRAME (Thin 1.5px Gold/Emerald Border - No Heavy Black Padding) */}
      <div className="relative w-[210px] sm:w-[230px] aspect-[3/4] rounded-2xl overflow-hidden border-[1.5px] border-amber-400/60 shadow-[0_4px_25px_rgba(0,0,0,0.6)] bg-black/80 flex items-center justify-center">
        <img
          src={posterUrl}
          alt="Eid Mubarak 2027"
          className="w-full h-full object-contain transition-transform duration-500 hover:scale-[1.02]"
        />
      </div>
    </div>
  );
}
