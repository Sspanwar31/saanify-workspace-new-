'use client';

import React from 'react';

interface Props {
  imageUrl?: string;
  heroConfig?: any;
  scale?: number;
}

export default function KarwaChauthHero({ heroConfig, scale, imageUrl }: Props) {
  const userScale = scale ?? heroConfig?.scale ?? 1.15;
  const posterUrl = heroConfig?.image_url || imageUrl;

  return (
    <div 
      className="relative w-full min-h-[260px] sm:min-h-[290px] flex flex-col items-center justify-center p-2 bg-transparent select-none overflow-visible transition-transform duration-300"
      style={{ transform: `scale(${userScale})` }}
    >
      {/* 🌕 DYNAMIC SILVER & ROSE CINEMATIC GLOW */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-rose-500/20 via-pink-500/5 to-transparent rounded-full blur-3xl animate-aurora-pulse" />
        <div className="absolute inset-12 bg-gradient-radial from-slate-200/20 to-transparent rounded-full blur-2xl animate-aurora-pulse-2" />
      </div>

      {posterUrl ? (
        /* 🖼️ POSTER IMAGE (If provided in Supabase) */
        <div className="relative w-full max-w-[260px] aspect-[3/4] rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-[0_10px_40px_rgba(251,191,36,0.35)]">
          <img src={posterUrl} alt="Karwa Chauth" className="w-full h-full object-cover" />
        </div>
      ) : (
        /* 🌕 2027 ULTRA-REALISTIC 3D FULL MOON (ONLY MOON & ROSE PETALS - NO CHHANNI) */
        <div className="relative z-10 w-full max-w-[300px] sm:max-w-[360px] flex items-center justify-center filter drop-shadow-[0_15px_45px_rgba(255,255,255,0.3)]">
          <svg viewBox="0 0 240 200" className="w-full h-auto overflow-visible">
            <defs>
              {/* REALISTIC 3D MOON SILVER GRADIENT */}
              <radialGradient id="realMoonSilver" cx="35%" cy="30%" r="75%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="30%" stopColor="#F8FAFC" />
                <stop offset="60%" stopColor="#E2E8F0" />
                <stop offset="85%" stopColor="#94A3B8" />
                <stop offset="100%" stopColor="#475569" />
              </radialGradient>

              {/* MOON ATMOSPHERIC CORONA (Silver Glow) */}
              <radialGradient id="moonSilverCorona" cx="50%" cy="50%" r="50%">
                <stop offset="45%" stopColor="rgba(255, 255, 255, 0.85)" />
                <stop offset="70%" stopColor="rgba(226, 232, 240, 0.35)" />
                <stop offset="100%" stopColor="rgba(148, 163, 184, 0)" />
              </radialGradient>

              {/* Advanced Glow Filter */}
              <filter id="ultraMoonGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* 🌕 OUTER SILVER CORONA GLOW */}
            <circle cx="120" cy="100" r="85" fill="url(#moonSilverCorona)" className="animate-corona-pulse" />

            {/* 🌕 3D REALISTIC FULL MOON (PURNIMA CHAND) */}
            <g style={{ transformOrigin: '120px 100px', animation: 'float-y 5s ease-in-out infinite' }}>
              <circle cx="120" cy="100" r="52" fill="url(#realMoonSilver)" filter="url(#ultraMoonGlow)" />
              
              {/* 3D Spherical Highlights */}
              <ellipse cx="104" cy="81" rx="25" ry="17" fill="rgba(255,255,255,0.9)" filter="blur(8px)" transform="rotate(-25 104 81)" />
              <ellipse cx="104" cy="81" rx="9" ry="5" fill="rgba(255,255,255,1)" filter="blur(2px)" transform="rotate(-25 104 81)" />

              {/* REALISTIC LUNAR CRATERS */}
              <circle cx="137" cy="111" r="11" fill="#64748B" opacity="0.25" filter="blur(2px)" />
              <circle cx="135" cy="109" r="8" fill="#475569" opacity="0.2" filter="blur(1px)" />
              <circle cx="103" cy="117" r="8" fill="#64748B" opacity="0.22" filter="blur(1.5px)" />
              <circle cx="125" cy="78" r="4.5" fill="#64748B" opacity="0.2" filter="blur(1px)" />
              <circle cx="92" cy="95" r="5.5" fill="#64748B" opacity="0.18" filter="blur(1px)" />
              <circle cx="143" cy="89" r="3.5" fill="#64748B" opacity="0.2" filter="blur(0.8px)" />
            </g>

            {/* 🌹 FLOATING CRIMSON ROSE PETALS */}
            <path d="M 55 55 C 45 45, 35 60, 55 70 C 75 60, 65 45, 55 55 Z" fill="#F43F5E" opacity="0.85" transform="rotate(20 55 55)" />
            <path d="M 185 140 C 175 130, 165 145, 185 155 C 205 145, 195 130, 185 140 Z" fill="#E11D48" opacity="0.9" transform="rotate(-15 185 140)" />
            <path d="M 85 165 C 75 155, 65 170, 85 180 C 105 170, 95 155, 85 165 Z" fill="#BE123C" opacity="0.8" transform="rotate(45 85 165)" />
            
            {/* ✨ Twinkling Stars */}
            <circle cx="185" cy="55" r="2.2" fill="#FFFFFF" className="animate-twinkle" />
            <circle cx="45" cy="115" r="1.8" fill="#FFFFFF" className="animate-twinkle" style={{ animationDelay: '1s' }} />
            <circle cx="195" cy="160" r="2.2" fill="#FFFFFF" className="animate-twinkle" style={{ animationDelay: '2s' }} />
          </svg>
        </div>
      )}

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes float-y {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes aurora-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes aurora-pulse-2 {
          0%, 100% { opacity: 0.5; transform: scale(1.1); }
          50% { opacity: 0.8; transform: scale(1); }
        }
        @keyframes corona-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.08); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .animate-aurora-pulse {
          animation: aurora-pulse 6s ease-in-out infinite;
        }
        .animate-aurora-pulse-2 {
          animation: aurora-pulse-2 8s ease-in-out infinite;
        }
        .animate-corona-pulse {
          animation: corona-pulse 4s ease-in-out infinite;
          transform-origin: center;
        }
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
