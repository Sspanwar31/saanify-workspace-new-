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
  onComplete?: () => void;
}

export default function PongalCinematicIntro({ mediaConfig, onComplete }: Props) {
  // Supabase fallback URL
  const videoSrc = mediaConfig?.video_url || '/videos/pongal-intro.mp4';

  const [stage, setStage] = useState<'video' | 'greeting' | 'finished'>('video');
  const [videoFading, setVideoFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Load Google Fonts dynamically
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

  // Handle Video End Event -> Transition to Greeting
  const handleVideoEnded = () => {
    setVideoFading(true);
    setTimeout(() => {
      setStage('greeting');
    }, 800); // 800ms smooth fadeout
  };

  // Handle Complete Sequence
  const handleFinish = () => {
    setStage('finished');
    setTimeout(() => {
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
    }, 600);
  };

  // Auto trigger complete after showing Greeting for 3.5s
  useEffect(() => {
    if (stage === 'greeting') {
      const timer = setTimeout(() => {
        handleFinish();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  if (stage === 'finished') return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] bg-black flex items-center justify-center overflow-hidden transition-opacity duration-700 ${
        stage === 'finished' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* ========================================================= */}
      {/* 🎬 STEP 1: VIDEO PLAYER (FROM SUPABASE / LOCAL PUBLIC)     */}
      {/* ========================================================= */}
      {stage === 'video' && (
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnded}
          className={`w-full h-full object-cover transition-all duration-1000 ${
            videoFading ? 'opacity-0 scale-105 filter blur-md' : 'opacity-100 scale-100'
          }`}
        />
      )}

      {/* ========================================================= */}
      {/* 🏆 STEP 2: 3D METALLIC GOLDEN GREETING TEXT                */}
      {/* ========================================================= */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center text-center p-4 md:p-8 transition-all duration-1000 ease-out ${
          stage === 'greeting'
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {/* Background Atmosphere & God Rays */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-950/40 via-black to-black -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] bg-amber-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />

        {/* CONTAINER WITH SCREEN BOUNDS (Fixes Overflow Bug) */}
        <div className="max-w-[90vw] md:max-w-4xl w-full mx-auto space-y-4 md:space-y-6 flex flex-col items-center justify-center">
          
          {/* TAMIL TEXT */}
          <h1 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-yellow-300 to-amber-600 tracking-wide leading-tight drop-shadow-[0_8px_25px_rgba(255,215,0,0.5)] break-words w-full font-['Noto_Sans_Tamil']">
            பொங்கல் திருநாள் வாழ்த்துக்கள்
          </h1>

          {/* ELEGANT DIVIDER LINE */}
          <div className="w-24 sm:w-36 md:w-48 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent my-2 md:my-4" />

          {/* ENGLISH TEXT */}
          <h2 className="text-xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-200 to-yellow-600 font-serif tracking-wider drop-shadow-[0_5px_20px_rgba(255,200,0,0.4)] break-words w-full font-['Cinzel']">
            HAPPY PONGAL 2027
          </h2>

        </div>
      </div>

      {/* ========================================================= */}
      {/* ⏭️ SKIP BUTTON                                            */}
      {/* ========================================================= */}
      <button
        onClick={handleFinish}
        className="absolute top-6 right-6 z-50 px-4 py-2 rounded-full bg-black/50 hover:bg-black/80 text-amber-200/90 hover:text-white border border-amber-500/30 backdrop-blur-md text-xs sm:text-sm font-semibold tracking-wider transition-all duration-300 hover:scale-105 active:scale-95"
      >
        SKIP ➔
      </button>
    </div>
  );
}
