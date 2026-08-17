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
        /* 🌕 2027 ULTRA-REALISTIC 3D MOON & BRASS SIEVE */
        <div className="relative z-10 w-full max-w-[300px] sm:max-w-[360px] flex items-center justify-center filter drop-shadow-[0_15px_45px_rgba(255,255,255,0.25)]">
          <svg viewBox="0 0 240 220" className="w-full h-auto overflow-visible">
            <defs>
              {/* 1. REALISTIC 3D MOON SILVER GRADIENT */}
              <radialGradient id="realMoonSilver" cx="35%" cy="30%" r="75%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="30%" stopColor="#F8FAFC" />
                <stop offset="60%" stopColor="#E2E8F0" />
                <stop offset="85%" stopColor="#94A3B8" />
                <stop offset="100%" stopColor="#475569" />
              </radialGradient>

              {/* 2. MOON ATMOSPHERIC CORONA (Silver Glow) */}
              <radialGradient id="moonSilverCorona" cx="50%" cy="50%" r="50%">
                <stop offset="45%" stopColor="rgba(255, 255, 255, 0.8)" />
                <stop offset="70%" stopColor="rgba(226, 232, 240, 0.3)" />
                <stop offset="100%" stopColor="rgba(148, 163, 184, 0)" />
              </radialGradient>

              {/* 3. REALISTIC BRASS GOLD GRADIENT */}
              <linearGradient id="realBrass2027" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFDF0" />
                <stop offset="30%" stopColor="#FFD700" />
                <stop offset="70%" stopColor="#B8860B" />
                <stop offset="100%" stopColor="#5B4302" />
              </linearGradient>

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
            <circle cx="120" cy="85" r="85" fill="url(#moonSilverCorona)" className="animate-corona-pulse" />

            {/* 🌕 3D REALISTIC FULL MOON */}
            <g style={{ transformOrigin: '120px 85px', animation: 'float-y 5s ease-in-out infinite' }}>
              <circle cx="120" cy="85" r="46" fill="url(#realMoonSilver)" filter="url(#ultraMoonGlow)" />
              
              {/* 3D Spherical Highlight (Gives it a 3D Ball look) */}
              <ellipse cx="105" cy="68" rx="22" ry="15" fill="rgba(255,255,255,0.9)" filter="blur(8px)" transform="rotate(-25 105 68)" />
              <ellipse cx="105" cy="68" rx="8" ry="5" fill="rgba(255,255,255,1)" filter="blur(2px)" transform="rotate(-25 105 68)" />

              {/* REALISTIC LUNAR CRATERS (Soft Texture) */}
              {/* Big Crater */}
              <circle cx="135" cy="95" r="10" fill="#64748B" opacity="0.25" filter="blur(2px)" />
              <circle cx="133" cy="93" r="7" fill="#475569" opacity="0.2" filter="blur(1px)" />
              {/* Medium Crater */}
              <circle cx="105" cy="100" r="7" fill="#64748B" opacity="0.22" filter="blur(1.5px)" />
              {/* Small Craters */}
              <circle cx="125" cy="65" r="4" fill="#64748B" opacity="0.2" filter="blur(1px)" />
              <circle cx="95" cy="80" r="5" fill="#64748B" opacity="0.18" filter="blur(1px)" />
              <circle cx="140" cy="75" r="3" fill="#64748B" opacity="0.2" filter="blur(0.8px)" />
            </g>

            {/* 🪔 3D TRADITIONAL BRASS CHHANNI (SIEVE) */}
            <g transform="translate(120, 100) rotate(-8)">
              {/* Mesh Background */}
              <ellipse cx="0" cy="0" rx="62" ry="38" fill="rgba(20,10,0,0.4)" />
              
              {/* Curved Mesh Grid (Realistic Jali) */}
              <path
                d="M -60 0 Q 0 -25 60 0 M -60 0 Q 0 25 60 0 M -30 -35 Q -20 0 -30 35 M 0 -38 Q 10 0 0 38 M 30 -35 Q 20 0 30 35"
                stroke="rgba(255, 230, 150, 0.5)"
                strokeWidth="1"
                fill="none"
              />

              {/* Outer Brass Ring Frame (3D Thickness) */}
              <ellipse cx="0" cy="0" rx="62" ry="38" fill="none" stroke="url(#realBrass2027)" strokeWidth="8" filter="url(#ultraMoonGlow)" />
              {/* Inner Brass Rim Highlight */}
              <ellipse cx="0" cy="-2" rx="58" ry="34" fill="none" stroke="#FFFDF0" strokeWidth="1.5" opacity="0.8" />
              {/* Specular Highlight on Brass Ring */}
              <path d="M -45 -20 Q 0 -35 45 -20" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.6" />

              {/* Handle of Chhanni */}
              <path d="M 62 0 L 98 15" stroke="url(#realBrass2027)" strokeWidth="8" strokeLinecap="round" filter="url(#ultraMoonGlow)" />
              <path d="M 62 -1 L 96 14" stroke="#FFFDF0" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
            </g>

            {/* 🌹 FLOATING CRIMSON ROSE PETALS */}
            <path d="M 60 50 C 50 40, 40 55, 60 65 C 80 55, 70 40, 60 50 Z" fill="#F43F5E" opacity="0.85" transform="rotate(20 60 50)" />
            <path d="M 180 130 C 170 120, 160 135, 180 145 C 200 135, 190 120, 180 130 Z" fill="#E11D48" opacity="0.9" transform="rotate(-15 180 130)" />
            <path d="M 90 170 C 80 160, 70 175, 90 185 C 110 175, 100 160, 90 170 Z" fill="#BE123C" opacity="0.8" transform="rotate(45 90 170)" />
            
            {/* ✨ Twinkling Stars */}
            <circle cx="180" cy="60" r="2" fill="#FFFFFF" className="animate-twinkle" />
            <circle cx="50" cy="120" r="1.5" fill="#FFFFFF" className="animate-twinkle" style={{ animationDelay: '1s' }} />
            <circle cx="190" cy="150" r="2" fill="#FFFFFF" className="animate-twinkle" style={{ animationDelay: '2s' }} />
          </svg>
        </div>
      )}

      {/* Global Styles for 2027 Cinematic Animations */}
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
