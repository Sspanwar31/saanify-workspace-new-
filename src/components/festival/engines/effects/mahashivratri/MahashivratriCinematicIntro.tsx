'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Props {
  videoUrl?: string;
  onComplete?: () => void;
}

export default function MahashivratriCinematicIntro({ videoUrl, onComplete }: Props) {
  // Video Path in public/videos folder
  const videoSrc = videoUrl || '/videos/mahashivratri-intro.mp4';

  const [stage, setStage] = useState<'video' | 'greeting' | 'finished'>('video');
  const [videoFading, setVideoFading] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Load Google Fonts dynamically
  useEffect(() => {
    if (!document.getElementById('maha-shiv-google-fonts')) {
      const link = document.createElement('link');
      link.id = 'maha-shiv-google-fonts';
      link.href =
        'https://fonts.googleapis.com/css2?family=Cinzel:wght@800;900&family=Tiro+Devanagari+Hindi:ital@0;1&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, []);

  // 🔊 Audio Unmute Fix (Click anywhere or button)
  const unmuteAudio = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 1.0;
      videoRef.current.play().catch((err) => console.log('Audio play error:', err));
      setIsMuted(false);
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

  // Show 3D Ice Greeting Text for 5.5 seconds
  useEffect(() => {
    if (stage === 'greeting') {
      const timer = setTimeout(() => {
        handleFinish();
      }, 5500);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  if (stage === 'finished') return null;

  return (
    <div
      onClick={stage === 'video' && isMuted ? unmuteAudio : undefined}
      className="fixed inset-0 z-[99999] bg-black flex items-center justify-center p-2 sm:p-6 overflow-hidden select-none cursor-pointer"
    >
      {/* 🎬 STEP 1: CINEMATIC VIDEO PLAYER */}
      {stage === 'video' && (
        <div className="relative w-full max-w-6xl h-[82vh] md:h-[85vh] rounded-2xl md:rounded-3xl border-2 border-sky-400/40 shadow-[0_0_90px_rgba(56,189,248,0.25)] bg-black overflow-hidden flex items-center justify-center">
          
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

          {/* DARK INNER VIGNETTE */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none" />

          {/* TOP FESTIVAL BADGE */}
          <div className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 z-40 px-5 py-1.5 rounded-full bg-black/80 border border-sky-400/50 backdrop-blur-md text-[10px] md:text-xs font-bold text-sky-300 tracking-widest uppercase flex items-center gap-2 shadow-xl pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            MAHA SHIVRATRI INTRO 2027
          </div>

          {/* 🔊 UNMUTE BUTTON */}
          {isMuted ? (
            <button
              type="button"
              onClick={unmuteAudio}
              className="absolute top-4 sm:top-6 left-4 sm:left-6 z-50 px-4 py-2 rounded-full bg-sky-500 text-black font-black text-xs sm:text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(56,189,248,0.6)] animate-bounce flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
            >
              🔊 Click Anywhere for Sound
            </button>
          ) : (
            <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-50 px-3.5 py-1.5 rounded-full bg-black/70 border border-sky-400/40 backdrop-blur-md text-xs font-semibold text-sky-300 flex items-center gap-2">
              🔊 Sound Playing
            </div>
          )}
        </div>
      )}

      {/* 🏆 STEP 2: FROZEN ICE STYLE GREETING TEXT */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center text-center p-6 md:p-12 transition-all duration-1000 ease-out bg-gradient-to-b from-[#021827] via-black to-black z-40 ${
          stage === 'greeting'
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {/* Ambient Ice Blue Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] max-w-[500px] max-h-[500px] bg-sky-500/20 rounded-full blur-[110px] pointer-events-none animate-pulse" />

        <div className="max-w-[90%] w-full mx-auto space-y-4 sm:space-y-6 flex flex-col items-center justify-center">
          {/* DEVANAGARI SANSKRIT TEXT */}
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-sky-200 to-sky-500 tracking-wide leading-tight drop-shadow-[0_8px_25px_rgba(56,189,248,0.6)] break-words w-full font-['Tiro_Devanagari_Hindi']">
            ॐ नमः शिवाय
          </h1>

          <div className="w-24 sm:w-36 md:w-48 h-[2px] bg-gradient-to-r from-transparent via-sky-400 to-transparent my-2 sm:my-4" />

          {/* ENGLISH TEXT */}
          <h2 className="text-xl sm:text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-blue-200 to-sky-600 font-serif tracking-wider drop-shadow-[0_5px_20px_rgba(56,189,248,0.5)] break-words w-full font-['Cinzel']">
            HAPPY MAHA SHIVRATRI 2027
          </h2>
        </div>

        {/* PROGRESS BAR */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-sky-400 to-blue-600 animate-[progress_5.5s_linear_forwards]" />
        </div>
      </div>

      {/* SKIP BUTTON */}
      <button
        onClick={handleFinish}
        className="absolute top-6 right-6 z-50 px-4 py-1.5 rounded-full bg-black/60 hover:bg-black/90 text-sky-200 border border-sky-400/30 backdrop-blur-md text-xs font-semibold tracking-wider transition-all"
      >
        SKIP ➔
      </button>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}} />
    </div>
  );
}
