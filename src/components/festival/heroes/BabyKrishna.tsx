'use client';

import React from 'react';

interface Props {
  imageUrl?: string;
  size?: number;
}

export default function BabyKrishna({
  imageUrl = 'https://cgntcihiwlzwkurkkarr.supabase.co/storage/v1/object/public/broadcasts/janmashtami.png',
  size = 200,
}: Props) {
  return (
    <div className="relative flex items-center justify-center w-full h-56 select-none overflow-visible bg-transparent">
      
      {/* 🌌 1. DIVINE BLUE & GOLD AMBIENT GLOW AURA */}
      <div 
        className="absolute bg-gradient-to-tr from-cyan-500/30 via-blue-600/25 to-amber-400/20 rounded-full blur-3xl animate-[breatheGlow_4s_ease-in-out_infinite]"
        style={{ width: size * 1.1, height: size * 1.1 }}
      />
      
      {/* ✨ 2. FLOATING SPARKLE ORBIT RING */}
      <div 
        className="absolute rounded-full border border-dashed border-cyan-400/20 animate-[spin_20s_linear_infinite]"
        style={{ width: size * 1.05, height: size * 1.05 }}
      />

      {/* 🦚 3. 3D BABY KRISHNA PNG (Breathing Animation) */}
      <div className="relative z-20 flex items-center justify-center animate-[krishnaBreathe_4s_ease-in-out_infinite]">
        
        {/* Soft Ground Shadow */}
        <div 
          className="absolute -bottom-2 bg-black/60 blur-xl rounded-full"
          style={{ width: size * 0.75, height: size * 0.18 }}
        />

        {/* 🌟 Standard HTML <img> tag (Never Fails / Zero Security Block) */}
        <img
          src={imageUrl}
          alt="Little Krishna"
          style={{ width: `${size}px`, height: `${size}px` }}
          className="object-contain filter drop-shadow-[0_12px_28px_rgba(0,245,212,0.45)] drop-shadow-[0_0_15px_rgba(251,191,36,0.35)] pointer-events-none"
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
            transform: scale(1.04) translateY(-6px);
          }
        }

        @keyframes breatheGlow {
          0%, 100% {
            transform: scale(0.85);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.65;
          }
        }
      `}</style>

    </div>
  );
}
