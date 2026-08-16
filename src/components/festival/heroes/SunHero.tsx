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
        /* ☀️ ULTRA-REALISTIC 3D GLOWING SURYA DEV (ONLY SUN & RAYS) */
        <div className="relative z-10 w-full max-w-[280px] sm:max-w-[340px] flex items-center justify-center filter drop-shadow-[0_15px_45px_rgba(255,140,0,0.75)]">
          <svg viewBox="0 0 240 200" className="w-full h-auto overflow-visible">
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
                <stop offset="40%" stopColor="rgba(255, 200, 50, 0.85)" />
                <stop offset="70%" stopColor="rgba(255, 140, 0, 0.35)" />
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
            </defs>

            {/* Outer Glowing Corona (Atmosphere) */}
            <circle cx="120" cy="95" r="90" fill="url(#sunCorona)" className="animate-corona-pulse" />

            {/* Dynamic Rotating Sun Rays (24 Tapered Golden Rays) */}
            <g style={{ transformOrigin: '120px 95px', animation: 'spin-slow 30s linear infinite' }}>
              {[...Array(24)].map((_, i) => {
                const angle = (i / 24) * Math.PI * 2;
                const isLong = i % 2 === 0;
                const rayLength = isLong ? 115 : 85;
                
                const baseAngle1 = angle - 0.04;
                const baseAngle2 = angle + 0.04;
                
                const x1 = 120 + Math.cos(baseAngle1) * 52;
                const y1 = 95 + Math.sin(baseAngle1) * 52;
                const x2 = 120 + Math.cos(angle) * rayLength;
                const y2 = 95 + Math.sin(angle) * rayLength;
                const x3 = 120 + Math.cos(baseAngle2) * 52;
                const y3 = 95 + Math.sin(baseAngle2) * 52;

                return (
                  <path 
                    key={i} 
                    d={`M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} Z`} 
                    fill={isLong ? "#FFD700" : "#FFA500"}
                    opacity={isLong ? 0.65 : 0.45}
                    filter="url(#ultraSunGlow)" 
                  />
                );
              })}
            </g>

            {/* Glowing 3D Sun Disc */}
            <circle cx="120" cy="95" r="50" fill="url(#realSunCore)" filter="url(#ultraSunGlow)" />
            
            {/* 3D Spherical Core Highlights */}
            <ellipse cx="104" cy="76" rx="26" ry="19" fill="rgba(255,255,255,0.85)" filter="blur(8px)" transform="rotate(-20 104 76)" />
            <ellipse cx="104" cy="76" rx="11" ry="6" fill="rgba(255,255,255,1)" filter="blur(2px)" transform="rotate(-20 104 76)" />

            {/* 📜 MODERN SANSKRIT SURYA MANTRA */}
            <text 
              x="120" y="192" 
              textAnchor="middle" 
              fill="url(#realSunCore)" 
              fontSize="15" 
              fontWeight="900" 
              fontFamily="'Tiro Devanagari Hindi', serif"
              style={{ filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.95))' }}
            >
              ॐ घृणिः सूर्याय नमः
            </text>
          </svg>
        </div>
      )}

      {/* Global Animations */}
      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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
