'use client';

import React from 'react';

interface Props {
  imageUrl?: string;
  size?: number;
}

export default function BabyKrishna({
  imageUrl = 'https://cgntcihiwlzwkurkkarr.supabase.co/storage/v1/object/public/broadcasts/janmashtami.png',
  size = 210,
}: Props) {
  return (
    <div className="relative flex items-center justify-center w-full h-56 select-none overflow-visible bg-transparent">
      
      {/* 🌌 1. SOFT DIVINE GOLD & CYAN RADIAL SHADOW (No hard circles) */}
      <div 
        className="absolute bg-gradient-to-tr from-cyan-500/25 via-blue-600/20 to-amber-400/20 rounded-full blur-3xl animate-[breatheGlow_4s_ease-in-out_infinite]"
        style={{ width: size * 1.15, height: size * 1.15 }}
      />
      
      {/* 🦚 2. 3D BABY KRISHNA PNG (Breathing Animation + Soft Ground Depth) */}
      <div className="relative z-20 flex items-center justify-center animate-[krishnaBreathe_4s_ease-in-out_infinite]">
        
        {/* Soft Floor Shadow Behind Feet */}
        <div 
          className="absolute -bottom-2 bg-black/60 blur-xl rounded-full"
          style={{ width: size * 0.7, height: size * 0.15 }}
        />

        {/* 🌟 3D Little Krishna Image (Clean Glow, Zero Border/Boxes) */}
        <img
          src={imageUrl}
          alt="Little Krishna"
          style={{ width: `${size}px`, height: `${size}px` }}
          className="object-contain filter drop-shadow-[0_10px_25px_rgba(0,245,212,0.4)] drop-shadow-[0_0_20px_rgba(251,191,36,0.3)] pointer-events-none"
          loading="eager"
        />

      </div>

      {/* 🌬️ ORGANIC BREATHING KEYFRAMES */}
      <style jsx global>{`
        @keyframes krishnaBreathe {
          0%, 100% {
            transform: scale(0.97) translateY(0px);
          }
          50% {
            transform: scale(1.04) translateY(-5px);
          }
        }

        @keyframes breatheGlow {
          0%, 100% {
            transform: scale(0.85);
            opacity: 0.25;
          }
          50% {
            transform: scale(1.18);
            opacity: 0.6;
          }
        }
      `}</style>

    </div>
  );
}
