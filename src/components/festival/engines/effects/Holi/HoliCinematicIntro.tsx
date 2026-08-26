'use client';

import React, { useRef, useEffect } from 'react';
import HoliColorBlast from './effects/HoliColorBlast';

interface HoliCinematicIntroProps {
  phase: string;
}

export default function HoliCinematicIntro({ phase }: HoliCinematicIntroProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <div className="relative w-full h-full min-h-screen flex items-center justify-center overflow-hidden bg-black select-none">
      
      {/* 🎬 1. CINEMATIC VIDEO BACKGROUND */}
      <video
        ref={videoRef}
        src="/festivals/holi-intro.mp4"
        autoPlay
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          phase === 'HANDOVER' ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* 🎆 2. DYNAMIC PARTICLE ENGINE (HoliColorBlast) */}
      <HoliColorBlast phase={phase} />

      {/* 💎 3. 3D GOLD GREETING TEXT OVERLAY */}
      {(phase === 'COLOR_DHAMAKA' || phase === 'TEXT_GREETING') && (
        <div className="relative z-30 flex flex-col items-center justify-center text-center px-4 animate-[zoomFadeIn_1s_ease-out_forwards]">
          
          {/* Ambient Text Glow */}
          <div className="absolute w-72 h-32 bg-amber-500/25 rounded-full blur-3xl" />

          {/* Devanagari Greeting */}
          <h2 
            className="text-2xl sm:text-4xl font-bold tracking-wide drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] text-transparent bg-clip-text bg-gradient-to-b from-[#FFF0C2] via-[#DFBA6B] to-[#996515]"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            बुरा न मानो होली है
          </h2>

          {/* 3D Gold Main Greeting */}
          <h1 
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-wider mt-2 drop-shadow-[0_8px_24px_rgba(0,0,0,0.9)] text-transparent bg-clip-text bg-gradient-to-b from-[#FFF6D6] via-[#F3D899] to-[#BD8D39]"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            HAPPY HOLI
          </h1>

          <p className="text-white/90 text-sm sm:text-lg mt-2 font-medium tracking-widest uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            ✨ Festival of Colors & Joy ✨
          </p>
        </div>
      )}

      {/* ✨ Keyframe Animation */}
      <style jsx>{`
        @keyframes zoomFadeIn {
          0% {
            opacity: 0;
            transform: scale(0.85);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
