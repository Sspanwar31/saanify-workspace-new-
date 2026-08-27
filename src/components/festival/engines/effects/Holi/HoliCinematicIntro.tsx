'use client';

import React, { useRef, useEffect, useState } from 'react';
import HoliColorBlast from '../HoliColorBlast';

interface HoliCinematicIntroProps {
  onComplete: () => void;
  videoUrl?: string;
}

export default function HoliCinematicIntro({
  onComplete,
  videoUrl = '/videos/holi-intro.mp4',
}: HoliCinematicIntroProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [internalPhase, setInternalPhase] = useState<'VIDEO' | 'ROCKET_LAUNCH' | 'COLOR_DHAMAKA' | 'GULAL_RAIN' | 'HANDOVER'>('VIDEO');

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  // 🚀 Video Khatam hone par Rocket Launch & Text Flow shuru hoga
  const handleVideoEnded = () => {
    setInternalPhase('ROCKET_LAUNCH');

    // 1. Rocket Launch (2.0s)
    setTimeout(() => {
      setInternalPhase('COLOR_DHAMAKA');
    }, 2000);

    // 2. Color Dhamaka Blast (1.5s)
    setTimeout(() => {
      setInternalPhase('GULAL_RAIN');
    }, 3500);

    // 3. Gulal Rain + Text Display (3.5s) -> Handover to Greeting
    setTimeout(() => {
      setInternalPhase('HANDOVER');
      onComplete(); // 👈 Ab Greeting Modal open hoga
    }, 7000);
  };

  return (
    <div className="fixed inset-0 z-50 w-full h-full min-h-screen flex items-center justify-center overflow-hidden bg-black select-none">
      
      {/* 🎬 1. RADHA-KRISHNA VIDEO */}
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnded}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          internalPhase !== 'VIDEO' ? 'opacity-30 blur-sm scale-105' : 'opacity-100'
        }`}
      />

      {/* 🎆 2. DYNAMIC ROCKET & COLOR BLAST ENGINE */}
      {internalPhase !== 'VIDEO' && (
        <HoliColorBlast phase={internalPhase} />
      )}

      {/* 💎 3. 3D GOLD "HAPPY HOLI" TEXT OVERLAY */}
      {internalPhase !== 'VIDEO' && (
        <div className="relative z-30 flex flex-col items-center justify-center text-center px-4 animate-[zoomFadeIn_0.8s_ease-out_forwards]">
          <div className="absolute w-80 h-36 bg-amber-500/20 rounded-full blur-3xl" />

          <h2 
            className="text-2xl sm:text-4xl font-bold tracking-wide drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] text-transparent bg-clip-text bg-gradient-to-b from-[#FFF0C2] via-[#DFBA6B] to-[#996515]"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            बुरा न मानो होली है
          </h2>

          <h1 
            className="text-4xl sm:text-7xl font-black tracking-wider mt-2 drop-shadow-[0_8px_24px_rgba(0,0,0,0.95)] text-transparent bg-clip-text bg-gradient-to-b from-[#FFF6D6] via-[#F3D899] to-[#BD8D39]"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Happy Holi
          </h1>

          <p className="text-white/90 text-sm sm:text-base mt-2 font-medium tracking-widest uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            ✨ Festival of Colors & Joy ✨
          </p>
        </div>
      )}

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
