'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Props {
  videoUrl?: string;
  onComplete?: () => void;
}

export default function GuruNanakJayantiCinematicIntro({ videoUrl, onComplete }: Props) {
  // Video Path in public/videos folder
  const videoSrc = videoUrl || '/videos/guru-nanak-jayanti-intro.mp4';

  const [stage, setStage] = useState<'video' | 'greeting' | 'finished'>('video');
  const [videoFading, setVideoFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Load Google Fonts
  useEffect(() => {
    if (!document.getElementById('sikh-google-fonts-video')) {
      const link = document.createElement('link');
      link.id = 'sikh-google-fonts-video';
      link.href =
        'https://fonts.googleapis.com/css2?family=Cinzel:wght@800;900&family=Tiro+Devanagari+Hindi:ital@0;1&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, []);

  // 🔊 SILENT BACKGROUND AUDIO UNMUTE
  useEffect(() => {
    const enableAudio = () => {
      if (videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.volume = 1.0;
        videoRef.current.play().catch(() => {});
      }
    };

    enableAudio();

    window.addEventListener('click', enableAudio, { once: true });
    window.addEventListener('touchstart', enableAudio, { once: true });

    return () => {
      window.removeEventListener('click', enableAudio);
      window.removeEventListener('touchstart', enableAudio);
    };
  }, [stage]);

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

  // Show 3D Gold Gurbani Greeting Text for 5.5 seconds AFTER Video Ends
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
    <div className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 overflow-hidden select-none">
      
      {/* 🎬 STEP 1: SOLID 3D APP PLAYER CARD FRAME */}
      {stage === 'video' && (
        <div className="relative w-full max-w-6xl h-[82vh] md:h-[86vh] rounded-3xl overflow-hidden border-2 border-amber-500/40 shadow-[0_0_90px_rgba(251,191,36,0.25)] bg-black flex items-center justify-center">
          
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay
            playsInline
            onEnded={handleVideoEnded}
            className={`w-full h-full object-cover rounded-3xl transition-all duration-1000 ${
              videoFading ? 'opacity-0 scale-105 filter blur-md' : 'opacity-100 scale-100'
            }`}
          />

          {/* DARK INNER VIGNETTE */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50 pointer-events-none" />

        </div>
      )}

      {/* 🏆 STEP 2: 3D GOLDEN GURBANI GREETING TEXT (APPEARS AFTER VIDEO ENDS) */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center text-center p-6 md:p-12 transition-all duration-1000 ease-out bg-gradient-to-b from-[#2a1b05] via-black to-black z-40 ${
          stage === 'greeting'
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {/* Ambient Gold Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] max-w-[500px] max-h-[500px] bg-amber-500/20 rounded-full blur-[110px] pointer-events-none animate-pulse" />

        <div className="max-w-[90%] w-full mx-auto space-y-4 sm:space-y-6 flex flex-col items-center justify-center">
          {/* GURBANI TEXT */}
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-yellow-300 to-amber-600 tracking-wide leading-tight drop-shadow-[0_8px_25px_rgba(255,215,0,0.6)] break-words w-full font-['Tiro_Devanagari_Hindi']">
            ੴ सतनाम श्री वाहेगुरु
          </h1>

          <div className="w-24 sm:w-36 md:w-48 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent my-2 sm:my-4" />

          {/* ENGLISH TEXT */}
          <h2 className="text-xl sm:text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-200 to-yellow-600 font-serif tracking-wider drop-shadow-[0_5px_20px_rgba(255,200,0,0.5)] break-words w-full font-['Cinzel']">
            Happy Guru Nanak Jaynti
          </h2>
        </div>

        {/* PROGRESS BAR */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 animate-[progress_5.5s_linear_forwards]" />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}} />
    </div>
  );
}
