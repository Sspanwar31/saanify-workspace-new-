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
  const [isMuted, setIsMuted] = useState(true); // Browsers require initial mute for autoplay
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

  // Toggle Mute / Unmute
  const toggleSound = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
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

  // ⏱️ GREETING TEXT TIME INCREASED: 6.5 Seconds (6500ms)
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
    <div
      className={`fixed inset-0 z-[99999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 transition-opacity duration-700 ${
        stage === 'finished' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* 🖼️ SLEEK FLOATING APP INTRO CARD FRAME */}
      <div className="relative w-full max-w-5xl h-[82vh] md:h-[85vh] rounded-3xl overflow-hidden border border-amber-500/30 shadow-[0_0_80px_rgba(251,191,36,0.25)] bg-black flex items-center justify-center">

        {/* 🏷️ TOP FESTIVAL BADGE */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-1.5 rounded-full bg-black/60 border border-amber-500/40 backdrop-blur-md text-[10px] md:text-xs font-bold text-amber-300 tracking-widest uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          PONGAL FESTIVAL INTRO 2027
        </div>

        {/* 🔊 SOUND TOGGLE BUTTON (Top Left) */}
        {stage === 'video' && (
          <button
            onClick={toggleSound}
            className="absolute top-4 left-4 z-50 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/90 text-amber-200 border border-amber-500/30 backdrop-blur-md text-xs font-medium tracking-wide transition-all flex items-center gap-2"
          >
            {isMuted ? '🔇 Sound Off' : '🔊 Sound On'}
          </button>
        )}

        {/* ⏭️ SKIP BUTTON (Top Right) */}
        <button
          onClick={handleFinish}
          className="absolute top-4 right-4 z-50 px-4 py-1.5 rounded-full bg-black/60 hover:bg-black/90 text-amber-200 border border-amber-500/30 backdrop-blur-md text-xs font-semibold tracking-wider transition-all hover:scale-105 active:scale-95"
        >
          SKIP ➔
        </button>

        {/* ========================================================= */}
        {/* 🎬 STEP 1: VIDEO PLAYER (Inside Framed Card)               */}
        {/* ========================================================= */}
        {stage === 'video' && (
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
        )}

        {/* ========================================================= */}
        {/* 🏆 STEP 2: 3D METALLIC GOLDEN GREETING TEXT (6.5 Seconds)   */}
        {/* ========================================================= */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center text-center p-6 md:p-12 transition-all duration-1000 ease-out bg-gradient-to-b from-amber-950/60 via-black to-black ${
            stage === 'greeting'
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-95 pointer-events-none'
          }`}
        >
          {/* Ambient Glow Rays */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] max-w-[500px] max-h-[500px] bg-amber-500/20 rounded-full blur-[100px] pointer-events-none animate-pulse" />

          <div className="max-w-[90%] w-full mx-auto space-y-4 md:space-y-6 flex flex-col items-center justify-center">
            {/* TAMIL TEXT */}
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-yellow-300 to-amber-600 tracking-wide leading-tight drop-shadow-[0_8px_25px_rgba(255,215,0,0.6)] break-words w-full font-['Noto_Sans_Tamil']">
              பொங்கல் திருநாள் வாழ்த்துக்கள்
            </h1>

            {/* DIVIDER LINE */}
            <div className="w-24 sm:w-36 md:w-48 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent my-2 md:my-4" />

            {/* ENGLISH TEXT */}
            <h2 className="text-xl sm:text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-200 to-yellow-600 font-serif tracking-wider drop-shadow-[0_5px_20px_rgba(255,200,0,0.4)] break-words w-full font-['Cinzel']">
              HAPPY PONGAL 2027
            </h2>
          </div>

          {/* ⏱️ VISUAL PROGRESS BAR (Showing 6.5s remaining time) */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 animate-[progress_6.5s_linear_forwards]" />
          </div>
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
