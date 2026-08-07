'use client';

import React from 'react';

interface Props {
  imageUrl?: string;
  heroConfig?: any;
  scale?: number;
  speed?: number;
}

export default function PongalHero({ imageUrl, heroConfig, scale, speed }: Props) {
  // 1. SUPABASE DYNAMIC CONFIGS (Controlled from Supabase Database)
  const userScale = scale ?? heroConfig?.scale ?? 0.7; // Scale value from Supabase (Default 0.7 for compact fit)
  const userSpeed = speed ?? heroConfig?.speed ?? 4;   // Speed value from Supabase (Default 4s pulse)

  // 2. SUPABASE IMAGE URL
  const posterUrl =
    heroConfig?.image_url ||
    imageUrl ||
    'https://cgntcihiwlzwkurkkarr.supabase.co/storage/v1/object/public/broadcasts/pongal/Screenshot%202026-08-07%20212935.png';

  return (
    <div 
      className="relative group flex items-center justify-center w-full mx-auto py-1 transition-transform duration-300 ease-out"
      style={{ transform: `scale(${userScale})` }}
    >
      {/* 🌟 AMBIENT GLOW AURA (Speed controlled by Supabase) */}
      <div 
        className="absolute -inset-2 bg-gradient-to-r from-amber-500/30 via-yellow-500/20 to-amber-600/30 rounded-3xl blur-xl pointer-events-none animate-pulse"
        style={{ animationDuration: `${userSpeed}s` }}
      />

      {/* 🖼️ FULL POSTER IMAGE (object-contain ensures NO CROPPING) */}
      <div className="relative w-[210px] sm:w-[240px] aspect-[3/4] rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-[0_8px_35px_rgba(251,191,36,0.35)] bg-black/40">
        <img
          src={posterUrl}
          alt="Happy Pongal 2027"
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    </div>
  );
}
