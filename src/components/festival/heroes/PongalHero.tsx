'use client';

import React from 'react';

interface Props {
  heroConfig?: any;
  themeColor?: string;
  onCtaClick?: () => void;
}

export default function PongalHero({ heroConfig, themeColor = '#f59e0b', onCtaClick }: Props) {
  // Supabase Storage Public Image URL
  const imageUrl =
    heroConfig?.image_url ||
    'https://cgntcihiwlzwkurkkarr.supabase.co/storage/v1/object/public/broadcasts/pongal/Screenshot%202026-08-07%20212935.png';

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-amber-500/40 bg-gradient-to-r from-[#140802] via-[#1f0d03] to-black p-4 sm:p-6 md:p-8 shadow-[0_0_60px_rgba(251,191,36,0.2)]">
      
      {/* 🌟 AMBIENT GLOW BACKGROUND */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-amber-500/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[250px] h-[250px] bg-emerald-500/10 rounded-full blur-[90px] pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-center">
        
        {/* 🖼️ LEFT / TOP: HERO POSTER CARD */}
        <div className="md:col-span-5 flex justify-center">
          <div className="relative group w-full max-w-[280px] sm:max-w-[320px] aspect-[3/4] rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-[0_0_40px_rgba(251,191,36,0.3)] transition-transform duration-500 hover:scale-[1.02]">
            <img
              src={imageUrl}
              alt="Happy Pongal Festival"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Subtle Inner Lighting */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

        {/* 📜 RIGHT / BOTTOM: FESTIVAL CONTENT & CTA */}
        <div className="md:col-span-7 flex flex-col items-center md:items-start text-center md:text-left space-y-4 md:space-y-5">
          
          {/* BADGE */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold tracking-widest uppercase backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            🌾 HARVEST FESTIVAL CELEBRATION 2027
          </div>

          {/* TAMIL TITLE */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-yellow-300 to-amber-500 leading-tight font-['Noto_Sans_Tamil']">
            பொங்கல் திருநாள் வாழ்த்துக்கள்
          </h1>

          {/* ENGLISH SUBTITLE */}
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-yellow-500 font-serif tracking-wide">
            Happy Pongal 2027
          </h2>

          {/* DESCRIPTION */}
          <p className="text-sm sm:text-base text-amber-100/80 max-w-lg leading-relaxed font-medium">
            Samriddhi, achhi fasal aur khushiyon ka ye utsav aapke aur aapke parivaar ke jeevan me nayi umang aur safalta laaye.
          </p>

          {/* CTA BUTTON */}
          <div className="pt-2 w-full sm:w-auto">
            <button
              onClick={onCtaClick}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 hover:from-emerald-500 hover:to-green-400 text-white font-black text-base tracking-wider shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:shadow-[0_0_45px_rgba(16,185,129,0.8)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3"
            >
              <span>Celebrate Now</span>
              <span className="text-xl">🌾</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
