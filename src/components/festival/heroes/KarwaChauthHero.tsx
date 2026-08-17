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
      {/* 🌕 DYNAMIC CINEMATIC SILVER AURA */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-rose-500/10 via-slate-300/10 to-transparent rounded-full blur-3xl animate-aurora-pulse" />
        <div className="absolute inset-16 bg-gradient-radial from-white/20 to-transparent rounded-full blur-2xl animate-aurora-pulse-2" />
      </div>

      {posterUrl ? (
        /* 🖼️ POSTER IMAGE (If provided in Supabase) */
        <div className="relative w-full max-w-[260px] aspect-[3/4] rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-[0_10px_40px_rgba(251,191,36,0.35)]">
          <img src={posterUrl} alt="Karwa Chauth" className="w-full h-full object-cover" />
        </div>
      ) : (
        /* 🌕 2027 ULTRA-REALISTIC 3D FULL MOON (Pure Silver & Glow) */
        <div className="relative z-10 w-full max-w-[300px] sm:max-w-[360px] flex items-center justify-center filter drop-shadow-[0_15px_50px_rgba(255,255,255,0.4)]">
          <svg viewBox="0 0 240 220" className="w-full h-auto overflow-visible">
            <defs>
              {/* 1. REALISTIC 3D MOON SILVER GRADIENT (High Contrast for 3D look) */}
              <radialGradient id="realMoonSilver2027" cx="32%" cy="28%" r="80%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="25%" stopColor="#F8FAFC" />
                <stop offset="55%" stopColor="#CBD5E1" />
                <stop offset="80%" stopColor="#64748B" />
                <stop offset="100%" stopColor="#1E293B" />
              </radialGradient>

              {/* 2. MOON ATMOSPHERIC CORONA (Cinematic Silver Glow) */}
              <radialGradient id="moonSilverCorona2027" cx="50%" cy="50%" r="50%">
                <stop offset="40%" stopColor="rgba(255, 255, 255, 0.9)" />
                <stop offset="65%" stopColor="rgba(226, 232, 240, 0.4)" />
                <stop offset="100%" stopColor="rgba(148, 163, 184, 0)" />
              </radialGradient>

              {/* 3. ULTRA GLOW FILTER */}
              <filter id="ultraMoonGlow2027" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* 4. STAR SPARKLE GRADIENT */}
              <radialGradient id="sparkleGrad">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </radialGradient>
            </defs>

            {/* 🌕 OUTER CINEMATIC CORONA GLOW */}
            <circle cx="120" cy="95" r="90" fill="url(#moonSilverCorona2027)" className="animate-corona-pulse" />
            {/* Inner Soft Halo */}
            <circle cx="120" cy="95" r="60" fill="rgba(255,255,255,0.1)" filter="blur(10px)" />

            {/* 🌕 3D REALISTIC FULL MOON (PURNIMA CHAND) */}
            <g style={{ transformOrigin: '120px 95px', animation: 'float-y 5s ease-in-out infinite' }}>
              <circle cx="120" cy="95" r="50" fill="url(#realMoonSilver2027)" filter="url(#ultraMoonGlow2027)" />
              
              {/* 3D Spherical Highlight (Gives it a Real 3D Ball look) */}
              <ellipse cx="104" cy="76" rx="28" ry="18" fill="rgba(255,255,255,0.95)" filter="blur(9px)" transform="rotate(-25 104 76)" />
              <ellipse cx="104" cy="76" rx="10" ry="6" fill="rgba(255,255,255,1)" filter="blur(3px)" transform="rotate(-25 104 76)" />

              {/* REALISTIC LUNAR CRATERS (Soft 3D Depth) */}
              {/* Large Crater */}
              <circle cx="138" cy="106" r="11" fill="#475569" opacity="0.35" filter="blur(3px)" />
              <circle cx="136" cy="104" r="8" fill="#1E293B" opacity="0.3" filter="blur(1.5px)" />
              {/* Medium Crater */}
              <circle cx="102" cy="112" r="8" fill="#475569" opacity="0.3" filter="blur(2px)" />
              {/* Small Craters */}
              <circle cx="125" cy="75" r="4.5" fill="#475569" opacity="0.25" filter="blur(1.5px)" />
              <circle cx="90" cy="90" r="5.5" fill="#475569" opacity="0.22" filter="blur(1.5px)" />
              <circle cx="145" cy="85" r="3.5" fill="#475569" opacity="0.25" filter="blur(1px)" />
            </g>

            {/* ✨ MAGICAL CINEMATIC SPARKLES (No Hearts, Just Glittering Stars) */}
            <g className="animate-twinkle">
              <circle cx="180" cy="50" r="3" fill="url(#sparkleGrad)" />
              <circle cx="180" cy="50" r="1.5" fill="#FFFFFF" />
              <path d="M 180 45 L 180 55 M 175 50 L 185 50" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />
            </g>
            <g className="animate-twinkle" style={{ animationDelay: '1.2s' }}>
              <circle cx="60" cy="140" r="2.5" fill="url(#sparkleGrad)" />
              <circle cx="60" cy="140" r="1" fill="#FFFFFF" />
              <path d="M 60 136 L 60 144 M 56 140 L 64 140" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" />
            </g>
            <g className="animate-twinkle" style={{ animationDelay: '2.1s' }}>
              <circle cx="190" cy="160" r="2.8" fill="url(#sparkleGrad)" />
              <circle cx="190" cy="160" r="1.2" fill="#FFFFFF" />
              <path d="M 190 155 L 190 165 M 185 160 L 195 160" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" />
            </g>
            <g className="animate-twinkle" style={{ animationDelay: '0.6s' }}>
              <circle cx="50" cy="70" r="2" fill="url(#sparkleGrad)" />
              <path d="M 50 67 L 50 73 M 47 70 L 53 70" stroke="#FFFFFF" strokeWidth="0.6" strokeLinecap="round" />
            </g>

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
          50% { opacity: 0.9; transform: scale(1); }
        }
        @keyframes corona-pulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
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
          animation: twinkle 2.5s ease-in-out infinite;
          transform-origin: center;
        }
      `}</style>
    </div>
  );
}
