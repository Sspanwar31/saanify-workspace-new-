'use client';

import React, { useState } from 'react';

interface Props {
  imageUrl?: string;
  heroConfig?: any;
  scale?: number;
}

export default function DussehraHero({ heroConfig, scale, imageUrl }: Props) {
  const userScale = scale ?? heroConfig?.scale ?? 1.15;

  // यह सिर्फ तब इमेज दिखाएगा जब आप Supabase से कोई असली इमेज URL भेजेंगे।
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
        <div className="absolute inset-0 bg-gradient-radial from-amber-500/30 via-red-500/10 to-transparent rounded-full blur-3xl animate-aura-pulse" />
        <div className="absolute inset-16 bg-gradient-radial from-orange-500/20 to-transparent rounded-full blur-2xl animate-aura-pulse-2" />
      </div>

      {posterUrl && !imgError ? (
        /* 🖼️ CINEMATIC POSTER FRAME (सिर्फ तब दिखेगा जब आपकी अपनी इमेज होगी) */
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
        /* 🏹 DIVINE ARCHER SCENE: LORD RAM'S BOW & 10-HEADED RAVAN */
        <div className="relative z-10 w-full max-w-[300px] sm:max-w-[340px] flex items-center justify-center filter drop-shadow-[0_15px_45px_rgba(255,140,0,0.75)]">
          <svg viewBox="0 0 320 320" className="w-full h-auto overflow-visible">
            <defs>
              {/* 1. 24K Gold Metallic 3D Gradient */}
              <linearGradient id="goldDivine2027" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFDF0" />
                <stop offset="30%" stopColor="#FFD700" />
                <stop offset="60%" stopColor="#B8860B" />
                <stop offset="100%" stopColor="#3B2700" />
              </linearGradient>

              {/* 2. Realistic Magical Fire Gradient */}
              <radialGradient id="fireArrowCore2027" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="25%" stopColor="#FFEE55" />
                <stop offset="55%" stopColor="#FF8C00" />
                <stop offset="85%" stopColor="#FF4500" />
                <stop offset="100%" stopColor="rgba(204, 0, 0, 0)" />
              </radialGradient>

              {/* 3. Dark Silhouette Gradient */}
              <linearGradient id="silhouetteGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1a0500" />
                <stop offset="100%" stopColor="#000000" />
              </linearGradient>

              {/* 4. Advanced Cinematic Glow Filter */}
              <filter id="ultraGlow2027" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* 🏹 1. LORD RAM'S SILHOUETTE & DIVINE BOW (Diagonal Stance) */}
            <g transform="rotate(-15 160 160)">
              
              {/* A. Lord Ram's Silhouette (Archer Stance) */}
              <g fill="url(#silhouetteGrad)">
                {/* Head & Crown */}
                <circle cx="110" cy="120" r="12" />
                <path d="M 100 110 L 110 100 L 120 110 Z" fill="#FFD700" opacity="0.8" /> 
                {/* Torso & Legs */}
                <path d="M 110 132 L 120 180 L 110 240 L 125 240 L 130 180 L 140 130 Z" />
                <path d="M 110 132 L 95 180 L 80 240 L 95 240 L 110 180 Z" />
                {/* Arms pulling string */}
                <path d="M 110 135 L 140 150 L 140 160 L 105 145 Z" />
              </g>

              {/* B. 3D Golden Bow Arc (Pulled Back) */}
              <g filter="url(#ultraGlow2027)">
                <path d="M 105 40 C 40 40 40 280 105 280" fill="none" stroke="url(#goldDivine2027)" strokeWidth="14" strokeLinecap="round" />
                {/* 3D Highlight on Bow */}
                <path d="M 100 50 C 50 50 50 270 100 270" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="3" strokeLinecap="round" />
                
                {/* Bow String (Taut) */}
                <path d="M 105 40 Q 55 160 105 280" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" />
              </g>

              {/* C. BLAZING FIRE ARROW (Pointing towards Ravan) */}
              <g filter="url(#ultraGlow2027)">
                {/* Arrow Shaft */}
                <line x1="55" y1="160" x2="250" y2="160" stroke="url(#goldDivine2027)" strokeWidth="6" strokeLinecap="round" />
                {/* 3D Shaft Highlight */}
                <line x1="56" y1="158" x2="249" y2="158" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />

                {/* Arrowhead (Agnibaana) */}
                <polygon points="250,160 225,145 235,160 225,175" fill="url(#goldDivine2027)" />
                <polygon points="250,160 228,150 235,160" fill="rgba(255,255,255,0.9)" />

                {/* Arrow Feathers */}
                <polygon points="55,160 35,145 45,160 35,175" fill="#D4AF37" />
                <polygon points="55,160 40,155 45,160" fill="#FFD700" />

                {/* D. MAGICAL FIRE AURA AT ARROWHEAD */}
                <circle cx="250" cy="160" r="25" fill="url(#fireArrowCore2027)" className="animate-fire-flicker" style={{ transformOrigin: '250px 160px' }} />
                <path 
                  d="M 250 140 C 240 150, 240 170, 250 180 C 260 170, 260 150, 250 140 Z" 
                  fill="#FFFFFF" 
                  className="animate-fire-flicker-2"
                  style={{ transformOrigin: '250px 160px' }}
                />
              </g>
            </g>

            {/* 👹 2. 10-HEADED RAVAN SILHOUETTE (Distant Target) */}
            <g transform="translate(265, 130)" opacity="0.8">
              {/* 10 Heads Cluster */}
              <circle cx="0" cy="0" r="6" fill="url(#silhouetteGrad)" />
              <circle cx="-8" cy="-2" r="5" fill="url(#silhouetteGrad)" />
              <circle cx="8" cy="-2" r="5" fill="url(#silhouetteGrad)" />
              <circle cx="-14" cy="5" r="4.5" fill="url(#silhouetteGrad)" />
              <circle cx="14" cy="5" r="4.5" fill="url(#silhouetteGrad)" />
              <circle cx="-5" cy="-10" r="4.5" fill="url(#silhouetteGrad)" />
              <circle cx="5" cy="-10" r="4.5" fill="url(#silhouetteGrad)" />
              <circle cx="-12" cy="12" r="4" fill="url(#silhouetteGrad)" />
              <circle cx="12" cy="12" r="4" fill="url(#silhouetteGrad)" />
              <circle cx="0" cy="-15" r="4" fill="url(#silhouetteGrad)" />
              
              {/* Ravan Body */}
              <path d="M -15 10 L 15 10 L 25 60 L -25 60 Z" fill="url(#silhouetteGrad)" />
              
              {/* Small Flames on Ravan */}
              <path d="M -5 -20 C -8 -15, -8 -10, -5 -5 C -2 -10, -2 -15, -5 -20 Z" fill="#FF4500" className="animate-fire-flicker" />
              <path d="M 5 -20 C 2 -15, 2 -10, 5 -5 C 8 -10, 8 -15, 5 -20 Z" fill="#FF8C00" className="animate-fire-flicker-2" />
            </g>

            {/* ✨ FLOATING EMBERS & SPARKS */}
            <g className="animate-spark-rise">
              <circle cx="90" cy="220" r="2.5" fill="#FFD700" />
              <circle cx="150" cy="240" r="2" fill="#FF8C00" style={{ animationDelay: '1s' }} />
              <circle cx="110" cy="200" r="1.5" fill="#FFFFFF" style={{ animationDelay: '2s' }} />
              <circle cx="140" cy="260" r="3" fill="#FF4500" style={{ animationDelay: '0.5s' }} />
              <circle cx="80" cy="250" r="2" fill="#FFD700" style={{ animationDelay: '1.5s' }} />
            </g>

            {/* 📜 SANSKRIT VICTORY TEXT */}
            <text
              x="160"
              y="305"
              textAnchor="middle"
              fill="url(#goldDivine2027)"
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
