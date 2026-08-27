'use client';

import React, { useState, useRef, useEffect } from 'react';
import DiwaliScene from '../../presets/DiwaliScene'; // 👈 Aapka Asli Fireworks Engine direct import

interface Props {
  videoUrl?: string;
  onComplete?: () => void;
}

export default function DiwaliCinematicIntro({ videoUrl, onComplete }: Props) {
  const videoSrc = videoUrl || '/videos/diwali-intro.mp4';

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const onCompleteRef = useRef(onComplete);

  const [internalPhase, setInternalPhase] = useState<'VIDEO' | 'CELEBRATION' | 'HANDOVER'>('VIDEO');

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // 🎵 1. BOLLYWOOD AUDIO SYNC (Hook Start + Auto-Play)
  useEffect(() => {
    const audio = bgAudioRef.current;
    if (!audio) return;

    audio.currentTime = 14.0; // 👈 Main Antra/Hook start
    audio.volume = 0.7;

    const playAudio = () => {
      audio.play().catch(() => {});
    };

    playAudio();

    const unlockAudio = () => {
      if (audio) audio.play().catch(() => {});
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

  // 🎛️ 2. AUDIO FADE-OUT
  useEffect(() => {
    const audio = bgAudioRef.current;
    if (!audio) return;

    if (internalPhase === 'CELEBRATION') {
      const fadeTimeout = setTimeout(() => {
        const fadeInterval = setInterval(() => {
          if (audio.volume > 0.04) {
            audio.volume = Math.max(0, audio.volume - 0.03);
          } else {
            audio.pause();
            clearInterval(fadeInterval);
          }
        }, 100);
      }, 3500);

      return () => clearTimeout(fadeTimeout);
    }
  }, [internalPhase]);

  // 🚀 3. SEQUENCE CONTROLLER (10s Video + 6.0s Celebration)
  const handleVideoEnded = () => {
    // Video end hote hi turant Shooting Rockets + Shloka + Text shuru
    setInternalPhase('CELEBRATION');

    setTimeout(() => {
      setInternalPhase('HANDOVER');
      if (onCompleteRef.current) {
        onCompleteRef.current(); // Dashboard par transfer
      }
    }, 6000);
  };

  return (
    <div className="fixed inset-0 z-[99999] w-full h-full min-h-screen flex items-center justify-center overflow-hidden bg-black select-none">
      
      {/* 🔤 Google Fonts */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,700;1,900&family=Rozha+One&family=Tiro+Devanagari+Hindi&display=swap');
      `}</style>

      {/* 🎵 DIWALI BACKGROUND TRACK */}
      <audio
        ref={bgAudioRef}
        src="/audio/diwali-song.mp3"
        preload="auto"
      />

      {/* 🎬 1. DIWALI 4K VIDEO */}
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnded}
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${
          internalPhase !== 'VIDEO' ? 'opacity-25 blur-[4px] scale-105' : 'opacity-100 scale-100'
        }`}
      />

      {/* 🎆 2. AAPKA ASLI DIWALI PRESET (Shooting Rockets & Golden Dust Active in Intro) */}
      {internalPhase === 'CELEBRATION' && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          <DiwaliScene phase="SHOOTING" />
        </div>
      )}

      {/* 💎 3. 3D GOLDEN MAHALAKSHMI MANTRA & 'Happy Diwali' TEXT */}
      {internalPhase === 'CELEBRATION' && (
        <div className="relative z-30 flex flex-col items-center justify-center text-center px-6 py-8 max-w-5xl mx-auto animate-[zoomFadeIn_0.8s_ease-out_forwards]">
          
          {/* Radial Warm Diya Glow */}
          <div className="absolute w-[480px] h-60 bg-amber-500/25 rounded-full blur-[100px] pointer-events-none" />

          {/* Hindi Shloka */}
          <h2 
            className="text-2xl sm:text-4xl md:text-5xl font-normal tracking-wide drop-shadow-[0_4px_18px_rgba(0,0,0,0.95)] text-transparent bg-clip-text bg-gradient-to-b from-[#FFFDF0] via-[#F3D899] to-[#DFBA6B] px-4 py-2"
            style={{ fontFamily: "'Tiro Devanagari Hindi', 'Rozha One', serif", lineHeight: '1.4' }}
          >
            ॐ श्रीं ह्रीं क्लीं महालक्ष्म्यै नमः
          </h2>

          <div className="w-32 sm:w-48 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent my-3" />

          {/* English 3D Gold Text: 'Happy Diwali' (No Edge Cuts) */}
          <div className="overflow-visible py-2 px-6">
            <h1 
              className="text-5xl sm:text-7xl md:text-8xl font-black italic tracking-wide drop-shadow-[0_8px_25px_rgba(255,200,0,0.7)] text-transparent bg-clip-text bg-gradient-to-b from-[#FFFFFF] via-[#F3D899] to-[#BD8D39] inline-block"
              style={{ fontFamily: "'Playfair Display', serif", lineHeight: '1.25' }}
            >
              Happy Diwali
            </h1>
          </div>

          <p className="text-amber-100/90 text-xs sm:text-sm md:text-base mt-2 font-semibold tracking-[0.3em] uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            ✨ Festival of Lights & Prosperity ✨
          </p>

          {/* Golden Progress Line */}
          <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden mt-6">
            <div className="h-full bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 animate-[progress_6s_linear_forwards]" />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes zoomFadeIn {
          0% { opacity: 0; transform: scale(0.88); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
