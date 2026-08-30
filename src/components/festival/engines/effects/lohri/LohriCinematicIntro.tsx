'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Props {
  videoUrl?: string;
  onComplete?: () => void;
}

// 🔥 Rising Fire Embers & Gold Sparks Interface
interface FireParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

export default function LohriCinematicIntro({ videoUrl, onComplete }: Props) {
  const videoSrc = videoUrl || '/videos/lohri-intro.mp4';

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onCompleteRef = useRef(onComplete);

  const [stage, setStage] = useState<'VIDEO' | 'TEXT_REVEAL' | 'HANDOVER'>('VIDEO');

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // 🎵 1. BOLLYWOOD AUDIO PLAY WITH ANTRA HOOK SYNC
  useEffect(() => {
    const audio = bgAudioRef.current;
    if (!audio) return;

    // 🚀 Exact hook start (e.g. 18.0s Dholak Beat)
    const TARGET_START_TIME = 18.0;
    audio.volume = 0.7;

    const setAudioPositionAndPlay = () => {
      try {
        audio.currentTime = TARGET_START_TIME;
      } catch (e) {}
      audio.play().catch(() => {});
    };

    if (audio.readyState >= 1) {
      setAudioPositionAndPlay();
    } else {
      audio.addEventListener('loadedmetadata', setAudioPositionAndPlay, { once: true });
      audio.addEventListener('canplay', setAudioPositionAndPlay, { once: true });
    }

    const unlockAudio = () => {
      if (audio) {
        if (Math.abs(audio.currentTime - TARGET_START_TIME) > 10) {
          audio.currentTime = TARGET_START_TIME;
        }
        audio.play().catch(() => {});
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioPositionAndPlay);
      audio.removeEventListener('canplay', setAudioPositionAndPlay);
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      if (audio) audio.pause();
    };
  }, []);

  // 🔥 2. RISING BONFIRE EMBERS & GOLDEN SPARKS CANVAS (Active in Text Stage)
  useEffect(() => {
    if (stage !== 'TEXT_REVEAL') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    let animationId: number;

    const particles: FireParticle[] = [];
    const colors = ['#FF4500', '#FF8C00', '#FFA500', '#FFD700', '#FF6B35'];

    for (let i = 0; i < 55; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.9,
        vy: -(Math.random() * 1.4 + 0.6), // Upward Rising Motion
        size: Math.random() * 4 + 1.5,
        alpha: Math.random() * 0.8 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, W, H);

      particles.forEach((p) => {
        p.y += p.vy;
        p.x += p.vx + Math.sin(p.y * 0.02) * 0.35;

        if (p.y < -20) {
          p.y = H + 20;
          p.x = Math.random() * W;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [stage]);

  // 🎛️ 3. AUDIO FADE-OUT
  useEffect(() => {
    const audio = bgAudioRef.current;
    if (!audio) return;

    if (stage === 'TEXT_REVEAL') {
      const fadeTimeout = setTimeout(() => {
        const fadeInterval = setInterval(() => {
          if (audio.volume > 0.04) {
            audio.volume = Math.max(0, audio.volume - 0.03);
          } else {
            audio.pause();
            clearInterval(fadeInterval);
          }
        }, 100);
      }, 3000);

      return () => clearTimeout(fadeTimeout);
    }
  }, [stage]);

  // 🚀 4. VIDEO END TRANSITION
  const handleVideoEnded = () => {
    setStage('TEXT_REVEAL');

    setTimeout(() => {
      setStage('HANDOVER');
      if (onCompleteRef.current) {
        onCompleteRef.current(); // Dashboard handover
      }
    }, 5500);
  };

  return (
    <div className="fixed inset-0 z-[999999] w-screen h-screen flex items-center justify-center overflow-hidden bg-[#100502] select-none">
      
      {/* 🔤 Google Fonts */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,700;1,900&family=Rozha+One&family=Tiro+Devanagari+Hindi&display=swap');
      `}</style>

      {/* 🎵 BOLLYWOOD AUDIO */}
      <audio
        ref={bgAudioRef}
        src="/audio/lohri-song.mp3"
        preload="auto"
      />

      {/* 🎬 1. 3D FAMILY BONFIRE VIDEO (Strict Unmount on Text Stage) */}
      {stage === 'VIDEO' && (
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnded}
          className="absolute inset-0 w-full h-full object-cover z-50 bg-black"
        />
      )}

      {/* 🎆 2. RISING FIRE EMBERS CANVAS */}
      {stage === 'TEXT_REVEAL' && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
        />
      )}

      {/* 💎 3. 3D GOLDEN LOHRI TEXT ON PLAIN DARK AMBER BACKGROUND */}
      {stage === 'TEXT_REVEAL' && (
        <div className="relative z-30 flex flex-col items-center justify-center text-center px-6 py-8 max-w-5xl mx-auto animate-[zoomFadeIn_0.8s_ease-out_forwards]">
          
          {/* Radial Warm Fire Glow */}
          <div className="absolute w-[480px] h-60 bg-amber-600/25 rounded-full blur-[110px] pointer-events-none" />

          {/* Punjabi/Hindi Folk Slogan */}
          <h2 
            className="text-3xl sm:text-5xl md:text-6xl font-normal tracking-wide drop-shadow-[0_4px_18px_rgba(0,0,0,0.95)] text-transparent bg-clip-text bg-gradient-to-b from-[#FFFDF0] via-[#F3D899] to-[#DFBA6B] px-4 py-2"
            style={{ fontFamily: "'Tiro Devanagari Hindi', 'Rozha One', serif", lineHeight: '1.3' }}
          >
            सुंदर मुंदरिये हो, तेरा कौन विचारा
          </h2>

          <div className="w-32 sm:w-48 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent my-3" />

          {/* English 3D Gold Text: 'Happy Lohri' (Title Case) */}
          <div className="overflow-visible py-2 px-6">
            <h1 
              className="text-4xl sm:text-6xl md:text-8xl font-black italic tracking-normal drop-shadow-[0_8px_25px_rgba(255,140,0,0.7)] text-transparent bg-clip-text bg-gradient-to-b from-[#FFFFFF] via-[#F3D899] to-[#BD8D39] inline-block"
              style={{ fontFamily: "'Playfair Display', serif", lineHeight: '1.25' }}
            >
              Happy Lohri
            </h1>
          </div>

          <p className="text-amber-100/90 text-xs sm:text-sm md:text-base mt-2 font-semibold tracking-[0.3em] uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            ✨ May The Warmth Of Lohri Bring Joy & Prosperity ✨
          </p>

          {/* Golden Progress Line */}
          <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden mt-6">
            <div className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300 animate-[progress_5.5s_linear_forwards]" />
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
