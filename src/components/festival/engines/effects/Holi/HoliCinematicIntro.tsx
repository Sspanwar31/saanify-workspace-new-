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
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const [internalPhase, setInternalPhase] = useState<'VIDEO' | 'ROCKET_LAUNCH' | 'COLOR_DHAMAKA' | 'GULAL_RAIN' | 'HANDOVER'>('VIDEO');

  // 🎵 1. BOLLYWOOD AUDIO SYNC & DYNAMIC HOOK
  useEffect(() => {
    const audio = bgAudioRef.current;
    if (!audio) return;

    // 🚀 Gaane ke best section (Hook) se start karein
    audio.currentTime = 14.0; // 👈 Agar 0s se chahiye toh 0 kar sakte hain
    audio.volume = 0.65;

    const playAudio = () => {
      audio.play().catch(() => {});
    };

    playAudio();

    const unlockAudio = () => {
      if (audio) {
        audio.play().catch(() => {});
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      if (audio) audio.pause();
    };
  }, []);

  // 🎛️ 2. PHASE-BASED AUDIO DUCKING & SMOOTH 2.5s FADE-OUT
  useEffect(() => {
    const audio = bgAudioRef.current;
    if (!audio) return;

    if (internalPhase === 'COLOR_DHAMAKA') {
      audio.volume = 0.45; // Blast ke time volume halka dip
    }

    if (internalPhase === 'GULAL_RAIN') {
      // 🚀 Slow natural fade-out during final 2.5 seconds
      const fadeInterval = setInterval(() => {
        if (audio.volume > 0.04) {
          audio.volume = Math.max(0, audio.volume - 0.03);
        } else {
          audio.pause();
          clearInterval(fadeInterval);
        }
      }, 100);
    }
  }, [internalPhase]);

  // 🚀 3. TIMELINE CONTROLLER (10s Video + 6.5s Celebration)
  const handleVideoEnded = () => {
    setInternalPhase('ROCKET_LAUNCH');

    // Rocket Launch (1.8s)
    setTimeout(() => {
      setInternalPhase('COLOR_DHAMAKA');
    }, 1800);

    // Color Dhamaka & Gulal Rain Start (3.2s)
    setTimeout(() => {
      setInternalPhase('GULAL_RAIN');
    }, 3200);

    // Smooth Handover to Dashboard / Modal (6.5s)
    setTimeout(() => {
      setInternalPhase('HANDOVER');
      onComplete();
    }, 6500);
  };

  return (
    <div className="fixed inset-0 z-50 w-full h-full min-h-screen flex items-center justify-center overflow-hidden bg-black select-none">
      
      {/* 🔤 Google Fonts Import */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Rozha+One&display=swap');
      `}</style>

      {/* 🎵 BOLLYWOOD BACKGROUND AUDIO */}
      <audio
        ref={bgAudioRef}
        src="/audio/holi-song.mp3"
        preload="auto"
      />

      {/* 🎬 1. RADHA-KRISHNA VIDEO */}
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay
        muted
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

      {/* 💎 3. 3D GOLD TEXT (No Cut, Perfectly Centered) */}
      {internalPhase !== 'VIDEO' && (
        <div className="relative z-30 flex flex-col items-center justify-center text-center px-6 py-8 max-w-4xl mx-auto animate-[zoomFadeIn_0.8s_ease-out_forwards]">
          
          {/* Ambient Glow */}
          <div className="absolute w-[420px] h-52 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Hindi Text: 'बुरा न मानो होली है' */}
          <h2 
            className="text-3xl sm:text-5xl md:text-6xl font-normal tracking-wide drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] text-transparent bg-clip-text bg-gradient-to-b from-[#FFF5D6] via-[#DFBA6B] to-[#996515] px-4 py-2"
            style={{ fontFamily: "'Rozha One', serif", lineHeight: '1.3' }}
          >
            बुरा न मानो होली है
          </h2>

          {/* English 3D Gold Text: 'Happy Holi' (Fix: Zero Edge Cutting) */}
          <div className="overflow-visible py-2 px-6">
            <h1 
              className="text-5xl sm:text-7xl md:text-8xl font-black tracking-normal drop-shadow-[0_8px_24px_rgba(0,0,0,0.95)] text-transparent bg-clip-text bg-gradient-to-b from-[#FFFDF0] via-[#F3D899] to-[#BD8D39] inline-block"
              style={{ 
                fontFamily: "'Playfair Display', serif",
                lineHeight: '1.25'
              }}
            >
              Happy Holi
            </h1>
          </div>

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
