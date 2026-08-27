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

  // 🔊 Audio Unlock Handler
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = false;
    video.volume = 0.85;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Browser autoplay policy fallback
        video.muted = true;
        video.play();
      });
    }

    const unlockAudio = () => {
      if (video) {
        video.muted = false;
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // 🚀 Sequence Controller
  const handleVideoEnded = () => {
    setInternalPhase('ROCKET_LAUNCH');

    setTimeout(() => {
      setInternalPhase('COLOR_DHAMAKA');
    }, 2000);

    setTimeout(() => {
      setInternalPhase('GULAL_RAIN');
    }, 3500);

    setTimeout(() => {
      setInternalPhase('HANDOVER');
      onComplete();
    }, 7000);
  };

  return (
    <div className="fixed inset-0 z-50 w-full h-full min-h-screen flex items-center justify-center overflow-hidden bg-black select-none">
      
      {/* 🔤 Google Fonts for Hindi & English */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Rozha+One&family=Yatra+One&display=swap');
      `}</style>

      {/* 🎬 1. RADHA-KRISHNA VIDEO */}
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay
        playsInline
        onEnded={handleVideoEnded}
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${
          internalPhase !== 'VIDEO' ? 'opacity-35 blur-[3px] scale-105' : 'opacity-100'
        }`}
      />

      {/* 🎆 2. DYNAMIC ROCKET & COLOR BLAST ENGINE */}
      {internalPhase !== 'VIDEO' && (
        <HoliColorBlast phase={internalPhase} />
      )}

      {/* 💎 3. 3D GOLD TEXT (No Cut, Perfectly Spaced) */}
      {internalPhase !== 'VIDEO' && (
        <div className="relative z-30 flex flex-col items-center justify-center text-center px-4 py-6 animate-[zoomFadeIn_0.8s_ease-out_forwards]">
          
          {/* Radial Warm Glow */}
          <div className="absolute w-[360px] h-44 bg-amber-500/25 rounded-full blur-3xl pointer-events-none" />

          {/* Hindi Text (Fix: 'Rozha One' Font for clean Devnagari without character cuts) */}
          <h2 
            className="text-3xl sm:text-5xl font-normal leading-normal tracking-wide drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] text-transparent bg-clip-text bg-gradient-to-b from-[#FFF5D6] via-[#DFBA6B] to-[#996515]"
            style={{ fontFamily: "'Rozha One', 'Yatra One', serif" }}
          >
            बुरा न मानो होली है
          </h2>

          {/* English 3D Gold Text */}
          <h1 
            className="text-5xl sm:text-7xl md:text-8xl font-black tracking-wider mt-1 drop-shadow-[0_8px_24px_rgba(0,0,0,0.95)] text-transparent bg-clip-text bg-gradient-to-b from-[#FFFDF0] via-[#F3D899] to-[#BD8D39]"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Happy Holi
          </h1>

          <p className="text-white/95 text-xs sm:text-sm md:text-base mt-2 font-semibold tracking-[0.25em] uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
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
