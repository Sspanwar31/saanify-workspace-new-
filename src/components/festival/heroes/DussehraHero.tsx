'use client';

import React, { useState } from 'react';

interface Props {
  imageUrl?: string;
  heroConfig?: any;
  scale?: number;
}

export default function DussehraHero({ heroConfig, scale, imageUrl }: Props) {
  const userScale = scale ?? heroConfig?.scale ?? 1.15;

  // 🚫 Unsplash वाला डिफ़ॉल्ट लिंक हटा दिया गया है। 
  // अब यह सिर्फ तब इमेज दिखाएगा जब आप Supabase से कोई असली इमेज URL भेजेंगे।
  const rawUrl = imageUrl || heroConfig?.image_url;
  const posterUrl = rawUrl && typeof rawUrl === 'string' && rawUrl.trim().length > 5 ? rawUrl.trim() : null;

  const [imgError, setImgError] = useState(false);

  return (
    <div 
      className="relative w-full min-h-[280px] sm:min-h-[320px] flex flex-col items-center justify-center p-2 bg-transparent select-none overflow-visible transition-transform duration-300"
      style={{ transform: `scale(${userScale})` }}
    >
      {/* 🔥 DYNAMIC CINEMATIC FIRE & GOLD AURA */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-amber-500/20 via-orange-500/10 to-transparent rounded-full blur-3xl animate-aura-pulse" />
        <div className="absolute inset-12 bg-gradient-radial from-red-500/15 to-transparent rounded-full blur-2xl animate-aura-pulse-2" />
      </div>

      {posterUrl && !imgError ? (
        /* 🖼️ 2027 CINEMATIC POSTER FRAME (सिर्फ तब दिखेगा जब आपकी अपनी इमेज होगी) */
        <div className="relative z-20 w-full max-w-[270px] aspect-[3/4] rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-[0_15px_55px_rgba(239,68,68,0.45)] transition-transform duration-500 hover:scale-[1.02] animate-float-y">
          <img 
            src={posterUrl} 
            alt="Happy Dussehra Vijayadashami" 
            onError={() => setImgError(true)}
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
          <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] pointer-events-none" />
        </div>
      ) : (
        /* 🏹 DEFAULT: 2027 ULTRA-REALISTIC 3D GOLDEN BOW & BLAZING ARROW */
        <div className="relative z-10 w-full max-w-[300px] sm:max-w-[360px] flex items-center justify-center filter drop-shadow-[0_15px_45px_rgba(255,140,0,0.75)]">
          <svg viewBox="0 0 240 220" className="w-full h-auto overflow-visible">
            <defs>
              {/* 24K Gold Metallic 3D Gradient */}
              <linearGradient id="goldMetal2027" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFDF0" />
                <stop offset="30%" stopColor="#FFD700" />
                <stop offset="60%" stopColor="#B8860B" />
                <stop offset="80%" stopColor="#FFD700" />
                <stop offset="100%" stopColor="#3B2700" />
              </linearGradient>

              {/* Realistic Magical Fire Gradient */}
              <radialGradient id="fireCore2027" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="25%" stopColor="#FFEE55" />
                <stop offset="55%" stopColor="#FF8C00" />
                <stop offset="85%" stopColor="#FF4500" />
                <stop offset="100%" stopColor="rgba(204, 0, 0, 0)" />
              </radialGradient>

              {/* Advanced Cinematic Glow Filter */}
              <filter id="ultraDussehraGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* 🛡️ FUTURISTIC GEOMETRIC MANDALA (Background Halo) */}
            <g style={{ transformOrigin: '120px 105px', animation: 'spin-slow 40s linear infinite' }}>
              <circle cx="120" cy="105" r="85" fill="none" stroke="url(#goldMetal2027)" strokeWidth="1.5" opacity="0.3" strokeDasharray="8 4" />
              <circle cx="120" cy="105" r="70" fill="none" stroke="url(#goldMetal2027)" strokeWidth="2" opacity="0.5" strokeDasharray="4 8" />
              {[...Array(8)].map((_, i) => {
                const angle = (i / 8) * Math.PI * 2;
                const x1 = 120 + Math.cos(angle) * 60;
                const y1 = 105 + Math.sin(angle) * 60;
                const x2 = 120 + Math.cos(angle) * 85;
                const y2 = 105 + Math.sin(angle) * 85;
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#goldMetal2027)" strokeWidth="1" opacity="0.4" />;
              })}
            </g>

            {/* 🏹 3D SYMMETRICAL GOLDEN BOW & ARROW (Floating Animation) */}
            <g style={{ transformOrigin: '120px 105px', animation: 'float-y 4s ease-in-out infinite' }} filter="url(#ultraDussehraGlow)">
              {/* 1. CURVED GOLDEN BOW ARC (3D Thickness) */}
              <path d="M 35 105 Q 120 195 205 105" fill="none" stroke="url(#goldMetal2027)" strokeWidth="14" strokeLinecap="round" />
              {/* 3D Highlight on Bow */}
              <path d="M 38 98 Q 120 188 202 98" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="3" strokeLinecap="round" />

              {/* Bow String */}
              <path d="M 35 105 Q 120 140 205 105" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" />

              {/* 2. BLAZING FIRE ARROW */}
              {/* Arrow Shaft */}
              <line x1="120" y1="165" x2="120" y2="50" stroke="url(#goldMetal2027)" strokeWidth="5" strokeLinecap="round" />
              <line x1="121" y1="165" x2="121" y2="50" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />

              {/* Arrowhead */}
              <polygon points="120,25 110,55 120,45 130,55" fill="url(#goldMetal2027)" />
              <polygon points="120,25 114,48 126,48" fill="rgba(255,255,255,0.9)" />

              {/* Arrow Feathers */}
              <polygon points="120,165 108,185 120,178 132,185" fill="#D4AF37" />
              <polygon points="120,165 114,180 126,180" fill="#FFD700" />

              {/* 3. MAGICAL FIRE AURA AT ARROWHEAD */}
              <path 
                d="M 120 20 C 110 35, 105 50, 120 60 C 135 50, 130 35, 120 20 Z" 
                fill="url(#fireCore2027)" 
                className="animate-fire-flicker" 
                style={{ transformOrigin: '120px 40px' }}
              />
              <path 
                d="M 120 30 C 115 40, 115 50, 120 55 C 125 50, 125 40, 120 30 Z" 
                fill="#FFFFFF" 
                className="animate-fire-flicker-2"
                style={{ transformOrigin: '120px 40px' }}
              />
            </g>

            {/* ✨ FLOATING EMBERS & SPARKS */}
            <g className="animate-spark-rise">
              <circle cx="90" cy="80" r="2.5" fill="#FFD700" />
              <circle cx="150" cy="90" r="2" fill="#FF8C00" style={{ animationDelay: '1s' }} />
              <circle cx="110" cy="60" r="1.5" fill="#FFFFFF" style={{ animationDelay: '2s' }} />
              <circle cx="140" cy="70" r="3" fill="#FF4500" style={{ animationDelay: '0.5s' }} />
              <circle cx="80" cy="110" r="2" fill="#FFD700" style={{ animationDelay: '1.5s' }} />
            </g>

            {/* 📜 SANSKRIT VICTORY TEXT */}
            <text
              x="120"
              y="215"
              textAnchor="middle"
              fill="url(#goldMetal2027)"
              fontSize="16"
              fontWeight="900"
              fontFamily="'Tiro Devanagari Hindi', serif"
              style={{ filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.9))' }}
            >
              सत्यमेव जयते • विजयदशमी
            </text>
          </svg>
        </div>
      )}

      {/* Global Styles for 2027 Cinematic Animations */}
      <style jsx global>{`
        @keyframes float-y {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes aura-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes aura-pulse-2 {
          0%, 100% { opacity: 0.5; transform: scale(1.1); }
          50% { opacity: 0.8; transform: scale(1); }
        }
        @keyframes fire-flicker {
          0%, 100% { transform: scale(1) rotate(-2deg); opacity: 0.9; }
          50% { transform: scale(1.1) rotate(2deg); opacity: 1; }
        }
        @keyframes fire-flicker-2 {
          0%, 100% { transform: scale(0.9); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        @keyframes spark-rise {
          0% { transform: translateY(0px); opacity: 1; }
          100% { transform: translateY(-30px); opacity: 0; }
        }
        .animate-aura-pulse { animation: aura-pulse 6s ease-in-out infinite; }
        .animate-aura-pulse-2 { animation: aura-pulse-2 8s ease-in-out infinite; }
        .animate-fire-flicker { animation: fire-flicker 0.5s ease-in-out infinite alternate; }
        .animate-fire-flicker-2 { animation: fire-flicker-2 0.3s ease-in-out infinite alternate; }
        .animate-spark-rise { animation: spark-rise 2s ease-out infinite; }
      `}</style>
    </div>
  );
}
