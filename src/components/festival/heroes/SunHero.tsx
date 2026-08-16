'use client';

import React from 'react';

interface Props {
  imageUrl?: string;
  heroConfig?: any;
  scale?: number;
}

export default function SunHero({ heroConfig, scale, imageUrl }: Props) {
  const userScale = scale ?? heroConfig?.scale ?? 1.15;
  const posterUrl = heroConfig?.image_url || imageUrl;

  return (
    <div 
      className="relative w-full min-h-[250px] sm:min-h-[280px] flex flex-col items-center justify-center p-2 bg-transparent select-none overflow-visible transition-transform duration-300"
      style={{ transform: `scale(${userScale})` }}
    >
      {/* ☀️ ULTRA-MODERN 2027 DYNAMIC AURORA GLOW */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-amber-500/30 via-orange-500/10 to-transparent rounded-full blur-3xl animate-aurora-pulse" />
        <div className="absolute inset-10 bg-gradient-radial from-yellow-300/20 to-transparent rounded-full blur-2xl animate-aurora-pulse-2" />
      </div>

      {posterUrl ? (
        <div className="relative w-full max-w-[260px] aspect-[3/4] rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-[0_10px_40px_rgba(251,191,36,0.35)]">
          <img src={posterUrl} alt="Chhath Puja" className="w-full h-full object-cover" />
        </div>
      ) : (
        /* ☀️ 3D REALISTIC SURYA DEV & ARGHYA SOOP (2027 Modern Vector Art) */
        <div className="relative z-10 w-full max-w-[280px] sm:max-w-[340px] flex items-center justify-center filter drop-shadow-[0_15px_45px_rgba(251,191,36,0.6)]">
          <svg viewBox="0 0 240 220" className="w-full h-auto overflow-visible">
            <defs>
              {/* 3D Solar Gold Gradient */}
              <radialGradient id="sunGold2027" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="20%" stopColor="#FFFDF0" />
                <stop offset="50%" stopColor="#FFD700" />
                <stop offset="80%" stopColor="#FF8C00" />
                <stop offset="100%" stopColor="#CC5500" />
              </radialGradient>

              {/* Advanced Glow Filter */}
              <filter id="sunGlow2027" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>

              {/* Realistic Bamboo Weave Pattern */}
              <pattern id="bambooWeave" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
                <rect width="12" height="12" fill="#92400e"/>
                <path d="M0,6 Q3,0 6,6 T12,6" fill="none" stroke="#FCD34D" strokeWidth="1.5"/>
                <path d="M0,12 Q3,6 6,12 T12,12" fill="none" stroke="#D97706" strokeWidth="1.5"/>
              </pattern>
              
              {/* 3D Depth for Soop */}
              <linearGradient id="soopDepth" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(0,0,0,0)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0.6)" />
              </linearGradient>
            </defs>

            {/* Dynamic Rotating Sun Rays */}
            <g style={{ transformOrigin: '120px 75px', animation: 'spin-slow 20s linear infinite' }}>
              {[...Array(12)].map((_, i) => {
                const angle = (i / 12) * Math.PI * 2;
                const x1 = 120 + Math.cos(angle) * 48;
                const y1 = 75 + Math.sin(angle) * 48;
                const x2 = 120 + Math.cos(angle) * 70;
                const y2 = 75 + Math.sin(angle) * 70;
                const isEven = i % 2 === 0;
                return (
                  <line 
                    key={i} 
                    x1={x1} y1={y1} x2={x2} y2={y2} 
                    stroke={isEven ? "#FFFFFF" : "#FFD700"} 
                    strokeWidth={isEven ? 4 : 2} 
                    strokeLinecap="round" 
                    filter="url(#sunGlow2027)" 
                    opacity={isEven ? 0.9 : 0.6}
                  />
                );
              })}
            </g>

            {/* Glowing 3D Sun Disc */}
            <circle cx="120" cy="75" r="40" fill="url(#sunGold2027)" filter="url(#sunGlow2027)" />
            {/* Sun Core Highlight */}
            <circle cx="110" cy="65" r="15" fill="rgba(255,255,255,0.6)" filter="blur(5px)" />

            {/* 🌾 3D Bamboo Winnowing Basket (Soop) */}
            <g style={{ transformOrigin: '120px 145px', animation: 'float-y 4s ease-in-out infinite' }}>
              {/* Soop Base with Weave */}
              <path d="M 50 145 Q 120 195 190 145 L 175 115 Q 120 130 65 115 Z" fill="url(#bambooWeave)" stroke="#FCD34D" strokeWidth="2" />
              {/* Dark Overlay for 3D Depth */}
              <path d="M 50 145 Q 120 195 190 145 L 175 115 Q 120 130 65 115 Z" fill="url(#soopDepth)" />
              
              {/* Glossy Rim */}
              <path d="M 65 115 Q 120 130 175 115" fill="none" stroke="#FEF3C7" strokeWidth="3" strokeLinecap="round" opacity="0.8" />

              {/* 3D Offerings in Soop (Thekua & Coconut) */}
              {/* Coconut */}
              <circle cx="120" cy="135" r="12" fill="#3F2817" />
              <ellipse cx="116" cy="131" rx="4" ry="3" fill="#92400E" />
              <ellipse cx="115" cy="130" rx="2" ry="1.5" fill="#D97706" />
              {/* Thekua Left */}
              <ellipse cx="90" cy="138" rx="14" ry="8" fill="#7C2D12" transform="rotate(-10 90 138)" />
              <ellipse cx="88" cy="136" rx="10" ry="5" fill="#A0522D" transform="rotate(-10 88 136)" />
              {/* Thekua Right */}
              <ellipse cx="150" cy="138" rx="14" ry="8" fill="#7C2D12" transform="rotate(10 150 138)" />
              <ellipse cx="152" cy="136" rx="10" ry="5" fill="#A0522D" transform="rotate(10 152 136)" />
            </g>

            {/* 📜 MODERN SANSKRIT SURYA MANTRA */}
            <text 
              x="120" y="210" 
              textAnchor="middle" 
              fill="url(#sunGold2027)" 
              fontSize="14" 
              fontWeight="900" 
              fontFamily="'Tiro Devanagari Hindi', serif"
              style={{ filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.8))' }}
            >
              ॐ घृणिः सूर्याय नमः
            </text>
          </svg>
        </div>
      )}

      {/* Global Styles for 2027 Animations */}
      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes float-y {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes aurora-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes aurora-pulse-2 {
          0%, 100% { opacity: 0.6; transform: scale(1.1); }
          50% { opacity: 0.9; transform: scale(1); }
        }
        .animate-aurora-pulse {
          animation: aurora-pulse 6s ease-in-out infinite;
        }
        .animate-aurora-pulse-2 {
          animation: aurora-pulse-2 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
