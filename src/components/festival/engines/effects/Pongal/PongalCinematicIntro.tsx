'use client';

import React, { useState, useRef, useEffect } from 'react';

interface MediaConfig {
  video_url?: string | null;
  web_image?: string | null;
  lottie_url?: string | null;
  mobile_image?: string | null;
  background_image?: string | null;
}

interface Props {
  mediaConfig?: MediaConfig;
  videoUrl?: string;
  onComplete?: () => void;
}

export default function PongalCinematicIntro({ mediaConfig, videoUrl, onComplete }: Props) {
  const videoSrc = videoUrl || mediaConfig?.video_url || '/videos/pongal-intro.mp4';

  const [stage, setStage] = useState<'video' | 'greeting' | 'finished'>('video');
  const [videoFading, setVideoFading] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Load Google Fonts
  useEffect(() => {
    if (!document.getElementById('pongal-google-fonts')) {
      const link = document.createElement('link');
      link.id = 'pongal-google-fonts';
      link.href =
        'https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Noto+Sans+Tamil:wght@700;900&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, []);

  // 🔊 IMPERATIVE SOUND TOGGLE FIX (Guaranteed Audio Unmute)
  const toggleSound = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      const newMuteState = !isMuted;
      videoRef.current.muted = newMuteState;
      if (!newMuteState) {
        videoRef.current.volume = 1.0;
        videoRef.current.play().catch((err) => console.log('Audio play allowed:', err));
      }
      setIsMuted(newMuteState);
    }
  };

  const handleVideoEnded = () => {
    setVideoFading(true);
    setTimeout(() => {
      setStage('greeting');
    }, 800);
  };

  const handleFinish = () => {
    setStage('finished');
    setTimeout(() => {
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
    }, 600);
  };

  // ⏱️ GREETING TEXT TIME: 6.5 Seconds
  useEffect(() => {
    if (stage === 'greeting') {
      const timer = setTimeout(() => {
        handleFinish();
      }, 6500);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  if (stage === 'finished') return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black overflow-hidden select-none">
      
      {/* ========================================================= */}
      {/* 🎬 STEP 1: FULL-SCREEN VIDEO WITH BLENDED EDGE & GOLD FRAME */}
      {/* ========================================================= */}
      {stage === 'video' && (
        <div className="relative w-full h-full flex items-center justify-center">
          
          {/* VIDEO LAYER */}
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay
            muted={isMuted}
            playsInline
            onEnded={handleVideoEnded}
            className={`w-full h-full object-cover transition-all duration-1000 ${
              videoFading ? 'opacity-0 scale-105 filter blur-md' : 'opacity-100 scale-100'
            }`}
          />

          {/* 🖤 SEAMLESS EDGE BLENDING VIGNETTE (Screen se jodne ke liye) */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/40 to-black pointer-events-none z-20" />

          {/* ✨ INNER GOLDEN BORDER FRAME (Corners par shiny border) */}
          <div className="absolute inset-3 sm:inset-6 md:inset-8 border border-amber-500/35 rounded-2xl md:rounded-3xl shadow-[inset_0_0_80px_rgba(0,0,0,0.9)] pointer-events-none z-30" />

          {/* 🏷️ TOP FESTIVAL BADGE */}
          <div className="absolute top-6 sm:top-10 left-1/2 -translate-x-1/2 z-40 px-5 py-1.5 rounded-full bg-black/70 border border-amber-500/40 backdrop-blur-md text-[10px] md:text-xs font-bold text-amber-300 tracking-widest uppercase flex items-center gap-2 shadow-2xl">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            PONGAL FESTIVAL INTRO 2027
          </div>

          {/* 🔊 FIXED WORKING SOUND BUTTON */}
          <button
            type="button"
            onClick={toggleSound}
            className="absolute top-6 sm:top-10 left-6 sm:left-10 z-50 px-4 py-2 rounded-full bg-black/80 hover:bg-amber-500 hover:text-black text-amber-200 border border-amber-500/50 backdrop-blur-md text-xs font-bold tracking-wide transition-all shadow-2xl flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            {isMuted ? '🔇 Click to Unmute Sound' : '🔊 Sound On'}
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🏆 STEP 2: 3D METALLIC GOLDEN GREETING TEXT (6.5s)          */}
      {/* ========================================================= */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center text-center p-6 md:p-12 transition-all duration-1000 ease-out bg-gradient-to-b from-amber-950/70 via-black to-black z-40 ${
          stage === 'greeting'
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {/* Ambient Glow Rays */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] max-w-[500px] max-h-[500px] bg-amber-500/20 rounded-full blur-[100px] pointer-events-none animate-pulse" />

        <div className="max-w-[90%] w-full mx-auto space-y-4 md:space-y-6 flex flex-col items-center justify-center">
          {/* TAMIL TEXT */}
          <h1 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-yellow-300 to-amber-600 tracking-wide leading-tight drop-shadow-[0_8px_25px_rgba(255,215,0,0.6)] break-words w-full font-['Noto_Sans_Tamil']">
            பொங்கல் திருநாள் வாழ்த்துக்கள்
          </h1>

          {/* DIVIDER LINE */}
          <div className="w-24 sm:w-36 md:w-48 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent my-2 md:my-4" />

          {/* ENGLISH TEXT */}
          <h2 className="text-xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-200 to-yellow-600 font-serif tracking-wider drop-shadow-[0_5px_20px_rgba(255,200,0,0.4)] break-words w-full font-['Cinzel']">
            HAPPY PONGAL 2027
          </h2>
        </div>

        {/* ⏱️ VISUAL PROGRESS BAR */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 animate-[progress_6.5s_linear_forwards]" />
        </div>
      </div>

      {/* Progress Bar Animation Style */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}} />
    </div>
  );
}
