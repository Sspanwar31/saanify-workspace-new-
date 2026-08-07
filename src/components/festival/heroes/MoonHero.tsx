'use client';

import React from 'react';

interface Props {
  imageUrl?: string;
  heroConfig?: any;
}

export default function MoonHero({ imageUrl, heroConfig }: Props) {
  const posterUrl = imageUrl || heroConfig?.image_url;

  return (
    <div className="relative w-full h-full min-h-[280px] flex items-center justify-center overflow-hidden bg-[#020807]">
      
      {posterUrl ? (
        <img
          src={posterUrl}
          alt="Eid Mubarak"
          className="w-full h-full object-cover"
        />
      ) : (
        /* 🌙 FULL-BLEED CINEMATIC 3D EID ARTWORK */
        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-4 space-y-6">
          
          {/* 1. Cinematic Deep Space Background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,_#0a3d2e_0%,_#051c14_50%,_#000000_100%)]" />
          
          {/* 2. Divine Top Volumetric Light (God Rays) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-[100%] bg-[conic-gradient(from_180deg_at_50%_0%,_transparent_0deg,_rgba(16,185,129,0.1)_30deg,_transparent_60deg,_transparent_300deg,_rgba(16,185,129,0.1)_330deg,_transparent_360deg)] opacity-60 blur-2xl pointer-events-none" />

          {/* 3. Floating Gold Dust Particles */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[20%] left-[30%] w-1 h-1 bg-amber-300 rounded-full animate-pulse opacity-70 shadow-[0_0_10px_rgba(251,191,36,0.8)]"></div>
            <div className="absolute top-[70%] left-[70%] w-1.5 h-1.5 bg-emerald-300 rounded-full animate-ping opacity-50"></div>
            <div className="absolute top-[40%] left-[80%] w-1 h-1 bg-amber-200 rounded-full animate-pulse opacity-60 shadow-[0_0_8px_rgba(251,191,36,0.8)]" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-[80%] left-[20%] w-2 h-2 bg-amber-400/50 rounded-full blur-[2px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-[30%] left-[15%] w-1 h-1 bg-emerald-200 rounded-full animate-ping opacity-40" style={{ animationDelay: '0.5s' }}></div>
          </div>

          {/* 4. 3D Crescent Moon (Pure SVG) */}
          <div className="relative z-10 animate-[float_6s_ease-in-out_infinite]">
            <svg 
              viewBox="0 0 100 100" 
              className="w-28 h-28 sm:w-40 sm:h-40 drop-shadow-[0_10px_30px_rgba(251,191,36,0.5)]"
            >
              <defs>
                {/* 24K Gold Metallic Gradient */}
                <linearGradient id="moonGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFDF0" />
                  <stop offset="30%" stopColor="#FFC837" />
                  <stop offset="70%" stopColor="#B87B00" />
                  <stop offset="100%" stopColor="#3A1F00" />
                </linearGradient>
                {/* Glow Filter */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              {/* Crescent Shape Path */}
              <path 
                d="M 65 15 A 40 40 0 1 0 65 85 A 30 30 0 1 1 65 15 Z" 
                fill="url(#moonGold)" 
                stroke="#FFE8A3" 
                strokeWidth="0.5"
                filter="url(#glow)"
              />
              {/* Crater Details for Realism */}
              <circle cx="55" cy="35" r="3" fill="#8c451e" opacity="0.3" />
              <circle cx="48" cy="55" r="2" fill="#8c451e" opacity="0.2" />
              <circle cx="58" cy="65" r="4" fill="#8c451e" opacity="0.25" />
            </svg>
            
            {/* Lunar Glow Halo */}
            <div className="absolute inset-0 bg-amber-400/20 blur-3xl rounded-full scale-125 -z-10 animate-pulse"></div>
          </div>

          {/* 5. Arabic Calligraphy (Metallic Text) */}
          <div className="relative z-10 text-3xl sm:text-5xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-300 to-amber-700 drop-shadow-[0_4px_15px_rgba(0,0,0,0.8)]">
            عيد مبارك
          </div>

          {/* 6. Glassmorphism Live Badge */}
          <div className="relative z-10 mt-2 px-6 py-2 rounded-full border border-amber-300/20 bg-white/5 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center gap-3">
            {/* Live Blinking Dot */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            
            <span className="text-xs sm:text-sm font-bold text-amber-100 tracking-[0.3em] uppercase">
              Eid Mubarak 2027
            </span>
          </div>

        </div>
      )}

      {/* Custom CSS for Floating Animation (Inject via Style Tag) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}} />
    </div>
  );
}
