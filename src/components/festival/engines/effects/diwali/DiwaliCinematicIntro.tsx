'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Props {
  videoUrl?: string;
  onComplete?: () => void;
}

// 🎆 Fireworks Particle Type Definition
interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  gravity: number;
}

export default function DiwaliCinematicIntro({ videoUrl, onComplete }: Props) {
  const videoSrc = videoUrl || '/videos/diwali-intro.mp4';

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onCompleteRef = useRef(onComplete);

  const [internalPhase, setInternalPhase] = useState<'VIDEO' | 'CELEBRATION' | 'HANDOVER'>('VIDEO');

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // 🎵 1. BOLLYWOOD AUDIO SYNC (Hook Start + Auto-Play)
  useEffect(() => {
    const audio = bgAudioRef.current;
    if (!audio) return;

    audio.currentTime = 22.0; // 👈 Main Antra/Hook start
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

  // 🎆 2. DYNAMIC 3D FIREWORKS & PHULJHADI ENGINE (Triggered Immediately After Video)
  useEffect(() => {
    if (internalPhase !== 'CELEBRATION') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    let animationId: number;

    const sparks: Spark[] = [];
    const colors = ['#FFD700', '#FF9900', '#FF3300', '#FFF8DC', '#FFCC00', '#FF5500'];

    const createFirework = (cx: number, cy: number) => {
      const count = 45;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 1.5;
        sparks.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 3 + 1.2,
          alpha: 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          gravity: 0.04,
        });
      }
    };

    // Instant Initial Blasts Around Screen
    createFirework(W * 0.2, H * 0.3);
    createFirework(W * 0.8, H * 0.3);
    createFirework(W * 0.5, H * 0.2);

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, W, H);
      frame++;

      // Periodic Rocket Bursts
      if (frame % 28 === 0) {
        createFirework(
          W * 0.15 + Math.random() * (W * 0.7),
          H * 0.15 + Math.random() * (H * 0.35)
        );
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += s.gravity;
        s.alpha -= 0.014;

        if (s.alpha <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, s.alpha);
        ctx.shadowBlur = 10;
        ctx.shadowColor = s.color;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [internalPhase]);

  // 🎛️ 3. AUDIO FADE-OUT
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

  // 🚀 4. SEQUENCE CONTROLLER
  const handleVideoEnded = () => {
    // Video end hote hi turant Fireworks + Mantra + Text shuru
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
          internalPhase !== 'VIDEO' ? 'opacity-30 blur-[3px] scale-105' : 'opacity-100 scale-100'
        }`}
      />

      {/* 🎆 2. REAL-TIME CANVAS FIREWORKS (Active during text reveal) */}
      {internalPhase === 'CELEBRATION' && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
        />
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
