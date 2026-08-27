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

  // 🎵 1. BOLLYWOOD AUDIO MIXER & SMART AUDIO UNLOCK
  useEffect(() => {
    const audio = bgAudioRef.current;
    if (!audio) return;

    audio.volume = 0.55; // 👈 55% Volume for smooth background melody
    audio.currentTime = 0; // Agar gaane ke hook se shuru karna ho toh jaise: 15.0 (15 sec)

    const playAudio = () => {
      audio.play().catch(() => {});
    };

    playAudio();

    // Browser User Interaction Policy Handler
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
      if (audio) {
        audio.pause();
      }
    };
  }, []);

  // 🎛️ 2. PHASE-BASED AUDIO DUCKING (Mixing Engine)
  useEffect(() => {
    const audio = bgAudioRef.current;
    if (!audio) return;

    // Jab Color Blast aur Rocket Dhamaka ho toh Music halka sa dip hoga taaki SFX pop kare
    if (internalPhase === 'COLOR_DHAMAKA') {
      audio.volume = 0.35;
    }

    // Jab Dashboard par handover ho toh 1.2s me smooth fade-out
    if (internalPhase === 'HANDOVER') {
      const fadeInterval = setInterval(() => {
        if (audio.volume > 0.05) {
          audio.volume -= 0.05;
        } else {
          audio.pause();
          clearInterval(fadeInterval);
        }
      }, 80);
    }
  }, [internalPhase]);

  // 🚀 3. SEQUENCE CONTROLLER
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
      onComplete(); // 👈 Handover to Dashboard / Modal
    }, 7000);
  };

  return (
    <div className="fixed inset-0 z-50 w-full h-full min-h-screen flex items-center justify-center overflow-hidden bg-black select-none">
      
      {/* 🔤 Google Fonts Import: Rozha One (Hindi) & Playfair Display (English Title Case) */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,700;1,900&family=Rozha+One&display=swap');
      `}</style>

      {/* 🎵 BOLLYWOOD BACKGROUND TRACK */}
      <audio
        ref={bgAudioRef}
        src="/audio/holi-song.mp3"
        preload="auto"
      />

      {/* 🎬 1. RADHA-KRISHNA VIDEO (Muted to let Bollywood song play clearly) */}
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

      {/* 🎆 2. DYNAMIC ROCKET & COLOR BLAST ENGINE (Real Sound Effects Included) */}
      {internalPhase !== 'VIDEO' && (
        <HoliColorBlast phase={internalPhase} />
      )}

      {/* 💎 3. 3D GOLD TEXT OVERLAY (Exact 'Happy Holi' Title Case) */}
      {internalPhase !== 'VIDEO' && (
        <div className="relative z-30 flex flex-col items-center justify-center text-center px-4 py-6 animate-[zoomFadeIn_0.8s_ease-out_forwards]">
          
          {/* Radial Warm Glow */}
          <div className="absolute w-[380px] h-48 bg-amber-500/25 rounded-full blur-3xl pointer-events-none" />

          {/* Hindi Text: 'बुरा न मानो होली है' */}
          <h2 
            className="text-3xl sm:text-5xl font-normal leading-normal tracking-wide drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] text-transparent bg-clip-text bg-gradient-to-b from-[#FFF5D6] via-[#DFBA6B] to-[#996515]"
            style={{ fontFamily: "'Rozha One', serif" }}
          >
            बुरा न मानो होली है
          </h2>

          {/* English 3D Gold Text: 'Happy Holi' in True Title Case */}
          <h1 
            className="text-5xl sm:text-7xl md:text-8xl font-black italic tracking-wide mt-1 drop-shadow-[0_8px_24px_rgba(0,0,0,0.95)] text-transparent bg-clip-text bg-gradient-to-b from-[#FFFDF0] via-[#F3D899] to-[#BD8D39]"
            style={{ fontFamily: "'Playfair Display', serif" }}
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
