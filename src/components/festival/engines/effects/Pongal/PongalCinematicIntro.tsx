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

  // 🔊 GUARANTEED IMPERATIVE AUDIO UNMUTE FUNCTION
  const unmuteAudio = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 1.0;
      videoRef.current
        .play()
        .then(() => {
          setIsMuted(false);
        })
        .catch((err) => console.log('Audio play allowed:', err));
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
    <div
      onClick={stage === 'video' && isMuted ? unmuteAudio : undefined}
      className="fixed inset-0 z-[99999] bg-black flex items-center justify-center p-3 sm:p-6 md:p-8 overflow-hidden select-none cursor-pointer"
    >
      {/* ========================================================= */}
      {/* 🎬 STEP 1: SOLID CINEMA FRAME (No Repeating Video Leak)   */}
      {/* ========================================================= */}
      {stage === 'video' && (
        <div className="relative w-full max-w-6xl h-[80vh] md:h-[84vh] rounded-2xl md:rounded-3xl border-2 border-amber-500/40 shadow-[0_0_90px_rgba(251,191,36,0.2)] bg-black overflow-hidden flex items-center justify-center">
          
          {/* VIDEO ELEMENT (Strictly contained inside frame) */}
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay
            playsInline
            onEnded={handleVideoEnded}
            className={`w-full h-full object-cover rounded-2xl md:rounded-3xl transition-all duration-1000 ${
              videoFading ? 'opacity-0 scale-105 filter blur-md' : 'opacity-100 scale-100'
            }`}
          />

          {/* DARK INNER VIGNETTE OVERLAY */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none" />

          {/* TOP FESTIVAL BADGE */}
          <div className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 z-40 px-5 py-1.5 rounded-full bg-black/80 border border-amber-500/50 backdrop-blur-md text-[10px] md:text-xs font-bold text-amber-300 tracking-widest uppercase flex items-center gap-2 shadow-xl pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            PONGAL FESTIVAL INTRO 2027
          </div>

          {/* 🔊 UNMUTE BUTTON & PROMPT */}
          {isMuted ? (
            <button
              type="button"
              onClick={unmuteAudio}
              className="absolute top-4 sm:top-6 left-4 sm:left-6 z-50 px-4 py-2 rounded-full bg-amber-500 text-black font-black text-xs sm:text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-bounce flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
            >
              🔊 Click Anywhere for Sound
            </button>
          ) : (
            <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-50 px-3.5 py-1.5 rounded-full bg-black/70 border border-amber-500/40 backdrop-blur-md text-xs font-semibold text-amber-300 flex items-center gap-2">
              🔊 Sound Playing
            </div>
          )}
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
