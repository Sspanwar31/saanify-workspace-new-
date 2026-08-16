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
      {/* ☀️ DYNAMIC AURORA GLOW (Realistic Sun Atmosphere) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-orange-500/30 via-amber-500/10 to-transparent rounded-full blur-3xl animate-aurora-pulse" />
        <div className="absolute inset-16 bg-gradient-radial from-yellow-300/20 to-transparent rounded-full blur-2xl animate-aurora-pulse-2" />
      </div>

      {posterUrl ? (
        <div className="relative w-full max-w-[260px] aspect-[3/4] rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-[0_10px_40px_rgba(251,191,36,0.35)]">
          <img src={posterUrl} alt="Chhath Puja" className="w-full h-full object-cover" />
        </div>
      ) : (
        /* ☀️ ULTRA-REALISTIC 3D SUN & BAMBOO SOOP */
        <div className="relative z-10 w-full max-w-[300px] sm:max-w-[360px] flex items-center justify-center filter drop-shadow-[0_15px_45px_rgba(255,140,0,0.7)]">
          <svg viewBox="0 0 240 240" className="w-full h-auto overflow-visible">
            <defs>
              {/* Realistic 3D Sun Core Gradient */}
              <radialGradient id="realSunCore" cx="35%" cy="30%" r="75%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="15%" stopColor="#FFFFE0" />
                <stop offset="40%" stopColor="#FFD700" />
                <stop offset="75%" stopColor="#FF8C00" />
                <stop offset="100%" stopColor="#FF4500" />
              </radialGradient>

              {/* Solar Corona (Outer Atmospheric Glow) */}
              <radialGradient id="sunCorona" cx="50%" cy="50%" r="50%">
                <stop offset="40%" stopColor="rgba(255, 200, 50, 0.8)" />
                <stop offset="70%" stopColor="rgba(255, 140, 0, 0.3)" />
                <stop offset="100%" stopColor="rgba(255, 69, 0, 0)" />
              </radialGradient>

              {/* Advanced Realistic Glow Filter */}
              <filter id="ultraSunGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
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

            {/* Outer Glowing Corona (Atmosphere) */}
            <circle cx="120" cy="80" r="85" fill="url(#sunCorona)" className="animate-corona-pulse" />

            {/* Dynamic Rotating Sun Rays (24 Tapered Rays for realism) */}
            <g style={{ transformOrigin: '120px 80px', animation: 'spin-slow 30s linear infinite' }}>
              {[...Array(24)].map((_, i) => {
                const angle = (i / 24) * Math.PI * 2;
                const isLong = i % 2 === 0;
                const rayLength = isLong ? 115 : 85;
                
                // Calculate points for tapered triangle rays
                const baseAngle1 = angle - 0.04;
                const baseAngle2 = angle + 0.04;
                
                const x1 = 120 + Math.cos(baseAngle1) * 50;
                const y1 = 80 + Math.sin(baseAngle1) * 50;
                const x2 = 120 + Math.cos(angle) * rayLength;
                const y2 = 80 + Math.sin(angle) * rayLength;
                const x3 = 120 + Math.cos(baseAngle2) * 50;
                const y3 = 80 + Math.sin(baseAngle2) * 50;

                return (
                  <path 
                    key={i} 
                    d={`M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} Z`} 
                    fill={isLong ? "#FFD700" : "#FFA500"}
                    opacity={isLong ? 0.6 : 0.4}
                    filter="url(#ultraSunGlow)" 
                  />
                );
              })}
            </g>

            {/* Glowing 3D Sun Disc */}
            <circle cx="120" cy="80" r="48" fill="url(#realSunCore)" filter="url(#ultraSunGlow)" />
            
            {/* 3D Spherical Core Highlight (Gives it a 3D Ball look) */}
            <ellipse cx="105" cy="62" rx="25" ry="18" fill="rgba(255,255,255,0.8)" filter="blur(8px)" transform="rotate(-20 105 62)" />
            <ellipse cx="105" cy="62" rx="10" ry="6" fill="rgba(255,255,255,1)" filter="blur(2px)" transform="rotate(-20 105 62)" />

            {/* 🌾 3D Bamboo Winnowing Basket (Soop) - Floating Animation */}
            <g style={{ transformOrigin: '120px 165px', animation: 'float-y 4s ease-in-out infinite' }}>
              {/* Soop Base with Weave */}
              <path d="M 45 165 Q 120 220 195 165 L 175 130 Q 120 145 65 130 Z" fill="url(#bambooWeave)" stroke="#FCD34D" strokeWidth="2" />
              {/* Dark Overlay for 3D Depth */}
              <path d="M 45 165 Q 120 220 195 165 L 175 130 Q 120 145 65 130 Z" fill="url(#soopDepth)" />
              
              {/* Glossy Rim */}
              <path d="M 65 130 Q 120 145 175 130" fill="none" stroke="#FEF3C7" strokeWidth="3" strokeLinecap="round" opacity="0.8" />

              {/* 3D Offerings in Soop (Thekua & Coconut) */}
              {/* Coconut */}
              <circle cx="120" cy="150" r="14" fill="#3F2817" />
              <ellipse cx="115" cy="145" rx="5" ry="4" fill="#92400E" />
              <ellipse cx="114" cy="144" rx="2.5" ry="2" fill="#D97706" />
              {/* Thekua Left */}
              <ellipse cx="85" cy="153" rx="16" ry="9" fill="#7C2D12" transform="rotate(-10 85 153)" />
              <ellipse cx="83" cy="151" rx="11" ry="5" fill="#A0522D" transform="rotate(-10 83 151)" />
              {/* Thekua Right */}
              <ellipse cx="155" cy="153" rx="16" ry="9" fill="#7C2D12" transform="rotate(10 155 153)" />
              <ellipse cx="157" cy="151" rx="11" ry="5" fill="#A0522D" transform="rotate(10 157 151)" />
            </g>

            {/* 📜 MODERN SANSKRIT SURYA MANTRA */}
            <text 
              x="120" y="232" 
              textAnchor="middle" 
              fill="url(#realSunCore)" 
              fontSize="14" 
              fontWeight="900" 
              fontFamily="'Tiro Devanagari Hindi', serif"
              style={{ filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.9))' }}
            >
              ॐ घृणिः सूर्याय नमः
            </text>
          </svg>
        </div>
      )}

      {/* Global Styles for 2027 Realistic Animations */}
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
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes aurora-pulse-2 {
          0%, 100% { opacity: 0.6; transform: scale(1.1); }
          50% { opacity: 0.9; transform: scale(1); }
        }
        @keyframes corona-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.08); }
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
      `}</style>
    </div>
  );
}
