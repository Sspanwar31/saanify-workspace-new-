'use client';

import React from 'react';

export default function LohriBonfireHero({ size = 200 }: { size?: number }) {
  return (
    <div className="relative flex items-center justify-center w-full h-56 select-none overflow-visible bg-transparent">
      
      {/* 🌌 1. WARM AMBER AMBIENT GLOW */}
      <div 
        className="absolute bg-gradient-to-t from-orange-600/35 via-amber-500/25 to-transparent rounded-full blur-3xl animate-[bonfireGlow_3s_ease-in-out_infinite]"
        style={{ width: size * 1.2, height: size * 1.2 }}
      />

      {/* ✨ 2. FLOATING SPARKS & EMBERS */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="absolute top-4 left-10 text-amber-400 text-xs animate-ping opacity-60" style={{ animationDuration: '2s' }}>✦</span>
        <span className="absolute top-8 right-12 text-orange-400 text-xs animate-bounce opacity-70" style={{ animationDuration: '2.5s' }}>🔥</span>
        <span className="absolute bottom-12 left-8 text-yellow-300 text-xs animate-pulse opacity-80">✨</span>
      </div>

      {/* 🪵 3. 3D TRADITIONAL BONFIRE & FLAMES */}
      <div className="relative z-20 flex items-center justify-center animate-[bonfireBreathe_3.5s_ease-in-out_infinite]">
        
        {/* Soft Floor Shadow */}
        <div 
          className="absolute -bottom-2 bg-black/60 blur-xl rounded-full"
          style={{ width: size * 0.8, height: size * 0.18 }}
        />

        {/* 🌟 Master 3D Flame SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
          style={{ width: `${size}px`, height: `${size}px` }}
          className="filter drop-shadow-[0_12px_28px_rgba(249,115,22,0.55)] drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]"
        >
          <defs>
            {/* Outer Flame Gradient */}
            <linearGradient id="outerFlame" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#c2410c" />
              <stop offset="40%" stopColor="#ea580c" />
              <stop offset="70%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#facc15" />
            </linearGradient>

            {/* Inner Core Flame Gradient */}
            <linearGradient id="innerFlame" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="60%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>

            {/* Wood Texture Gradient */}
            <linearGradient id="woodLog" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#451a03" />
              <stop offset="50%" stopColor="#78350f" />
              <stop offset="100%" stopColor="#291002" />
            </linearGradient>
          </defs>

          {/* 🪵 Crossing Wood Logs Base */}
          <g>
            {/* Left Log */}
            <rect x="18" y="74" width="64" height="10" rx="5" transform="rotate(-14 50 78)" fill="url(#woodLog)" stroke="#1c0a00" strokeWidth="1" />
            {/* Right Log */}
            <rect x="18" y="74" width="64" height="10" rx="5" transform="rotate(14 50 78)" fill="url(#woodLog)" stroke="#1c0a00" strokeWidth="1" />
            {/* Center Front Log */}
            <rect x="25" y="78" width="50" height="8" rx="4" fill="#361502" />
          </g>

          {/* 🔥 Main Outer Fire Tongue */}
          <path
            d="M50 15 C40 32, 28 45, 28 62 C28 76, 38 84, 50 84 C62 84, 72 76, 72 62 C72 45, 60 32, 50 15 Z"
            fill="url(#outerFlame)"
          />

          {/* 🔥 Inner Roaring Fire Core */}
          <path
            d="M50 32 C43 45, 36 54, 36 66 C36 76, 42 82, 50 82 C58 82, 64 76, 64 66 C64 54, 57 45, 50 32 Z"
            fill="url(#innerFlame)"
            opacity="0.9"
          />

          {/* 💡 White Hot Core Glow */}
          <ellipse cx="50" cy="70" rx="6" ry="10" fill="#ffffff" opacity="0.95" />

          {/* 🍯 Little Rewari/Popcorn Offerings at base */}
          <circle cx="36" cy="80" r="2.5" fill="#fef08a" />
          <circle cx="64" cy="80" r="2.2" fill="#fed7aa" />
          <circle cx="50" cy="82" r="2.2" fill="#ffffff" />
        </svg>

      </div>

      {/* 🌬️ FLAME BREATHING KEYFRAMES */}
      <style jsx global>{`
        @keyframes bonfireBreathe {
          0%, 100% {
            transform: scale(0.96) translateY(0px);
          }
          50% {
            transform: scale(1.04) translateY(-5px);
          }
        }

        @keyframes bonfireGlow {
          0%, 100% {
            transform: scale(0.88);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.65;
          }
        }
      `}</style>

    </div>
  );
}
