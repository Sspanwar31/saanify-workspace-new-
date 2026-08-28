'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Props {
  videoUrl?: string;
  onComplete?: () => void;
}

// 🌸 Floating Sacred Petals & Gold Sparks Interface
interface SacredParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  rot: number;
  rotSpd: number;
  type: 'gold' | 'petal';
}

export default function RakshaBandhanCinematicIntro({ videoUrl, onComplete }: Props) {
  const videoSrc = videoUrl || '/videos/raksha-bandhan-intro.mp4';

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onCompleteRef = useRef(onComplete);

  // 🔒 STRICT PHASE STATE: Video chalte waqt 'VIDEO' rahega
  const [currentStage, setCurrentStage] = useState<'VIDEO' | 'TEXT_REVEAL' | 'HANDOVER'>('VIDEO');

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // 🎵 1. BOLLYWOOD AUDIO PLAY
  useEffect(() => {
    const audio = bgAudioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    audio.volume = 0.65;

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

  // 🎆 2. DYNAMIC ROSE PETALS & GOLD SPARKS (Sirf Text aane ke baad chalenge)
  useEffect(() => {
    if (currentStage !== 'TEXT_REVEAL') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    let animationId: number;

    const particles: SacredParticle[] = [];
    const petalColors = ['#E8384F', '#C41E3A', '#D4364D', '#FF6B7A'];
    const goldColors = ['#F0C75E', '#D4A843', '#FFE082', '#FFD54F'];

    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.8,
        vy: Math.random() * 0.8 + 0.4,
        size: Math.random() * 4 + 2,
        alpha: Math.random() * 0.7 + 0.3,
        rot: Math.random() * Math.PI * 2,
        rotSpd: (Math.random() - 0.5) * 0.03,
        type: Math.random() > 0.4 ? 'gold' : 'petal',
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, W, H);

      particles.forEach((p) => {
        p.y += p.vy;
        p.x += p.vx + Math.sin(p.y * 0.02) * 0.3;
        p.rot += p.rotSpd;

        if (p.y > H + 20) {
          p.y = -20;
          p.x = Math.random() * W;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;

        if (p.type === 'petal') {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = petalColors[Math.floor(Math.random() * petalColors.length)];
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 1.5, p.size * 0.8, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = goldColors[Math.floor(Math.random() * goldColors.length)];
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#F0C75E';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [currentStage]);

  // 🎛️ 3. AUDIO FADE-OUT (Text stage ke aakhri 2.5s me)
  useEffect(() => {
    const audio = bgAudioRef.current;
    if (!audio) return;

    if (currentStage === 'TEXT_REVEAL') {
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
  }, [currentStage]);

  // 🚀 4. VIDEO KHATAM HONE KA EVENT (Sirf tabhi Text dikhega)
  const handleVideoEnded = () => {
    // 1. Stage change to TEXT_REVEAL
    setCurrentStage('TEXT_REVEAL');

    // 2. 5.5 Seconds tak Text dikhane ke baad Dashboard Handover
    setTimeout(() => {
      setCurrentStage('HANDOVER');
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
    }, 5500);
  };

  return (
    <div className="fixed inset-0 z-[99999] w-full h-full min-h-screen flex items-center justify-center overflow-hidden bg-black select-none">
      
      {/* 🔤 Google Fonts */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,700;1,900&family=Rozha+One&family=Tiro+Devanagari+Hindi&display=swap');
      `}</style>

      {/* 🎵 RAKSHA BANDHAN BOLLYWOOD AUDIO */}
      <audio
        ref={bgAudioRef}
        src="/audio/raksha-bandhan-song.mp3"
        preload="auto"
      />

      {/* 🎬 1. 3D BROTHER-SISTER VIDEO */}
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnded}
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${
          currentStage === 'TEXT_REVEAL' ? 'opacity-25 blur-[4px] scale-105' : 'opacity-100 scale-100'
        }`}
      />

      {/* 🎆 2. SACRED ROSE PETALS & GOLD DUST CANVAS (Sirf Text ke waqt) */}
      {currentStage === 'TEXT_REVEAL' && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
        />
      )}

      {/* 💎 3. 3D GOLDEN TEXT (STRICT CHECK: Video ke waqt BILKUL nahi dikhega) */}
      {currentStage === 'TEXT_REVEAL' && (
        <div className="relative z-30 flex flex-col items-center justify-center text-center px-6 py-8 max-w-5xl mx-auto animate-[zoomFadeIn_0.8s_ease-out_forwards]">
          
          {/* Radial Warm Golden Aura */}
          <div className="absolute w-[460px] h-60 bg-amber-500/25 rounded-full blur-[100px] pointer-events-none" />

          {/* Hindi Text */}
          <h2 
            className="text-3xl sm:text-5xl md:text-6xl font-normal tracking-wide drop-shadow-[0_4px_18px_rgba(0,0,0,0.95)] text-transparent bg-clip-text bg-gradient-to-b from-[#FFFDF0] via-[#F3D899] to-[#DFBA6B] px-4 py-2"
            style={{ fontFamily: "'Tiro Devanagari Hindi', 'Rozha One', serif", lineHeight: '1.3' }}
          >
            बंधन नहीं, शक्ति और प्रेम है
          </h2>

          <div className="w-32 sm:w-48 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent my-3" />

          {/* English 3D Gold Text: 'Happy Raksha Bandhan' */}
          <div className="overflow-visible py-2 px-6">
            <h1 
              className="text-4xl sm:text-6xl md:text-8xl font-black italic tracking-normal drop-shadow-[0_8px_25px_rgba(255,200,0,0.7)] text-transparent bg-clip-text bg-gradient-to-b from-[#FFFFFF] via-[#F3D899] to-[#BD8D39] inline-block"
              style={{ fontFamily: "'Playfair Display', serif", lineHeight: '1.25' }}
            >
              Happy Raksha Bandhan
            </h1>
          </div>

          <p className="text-amber-100/90 text-xs sm:text-sm md:text-base mt-2 font-semibold tracking-[0.3em] uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            ✨ Celebrating The Eternal Bond Of Love & Protection ✨
          </p>

          {/* Golden Progress Line */}
          <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden mt-6">
            <div className="h-full bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 animate-[progress_5.5s_linear_forwards]" />
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
