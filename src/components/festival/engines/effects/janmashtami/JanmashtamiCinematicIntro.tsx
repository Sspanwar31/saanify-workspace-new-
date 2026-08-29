'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Props {
  videoUrl?: string;
  onComplete?: () => void;
}

// 🦚 Peacock Feathers, Butter Drops & Gold Sparks Interface
interface JanmashtamiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  rot: number;
  rotSpd: number;
  type: 'gold' | 'peacock' | 'butter';
}

export default function JanmashtamiCinematicIntro({ videoUrl, onComplete }: Props) {
  const videoSrc = videoUrl || '/videos/janmashtami-intro.mp4';

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onCompleteRef = useRef(onComplete);

  const [stage, setStage] = useState<'VIDEO' | 'TEXT_REVEAL' | 'HANDOVER'>('VIDEO');

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // 🎵 1. BOLLYWOOD AUDIO MIXER & HOOK START (e.g. 28.0s)
  useEffect(() => {
    const audio = bgAudioRef.current;
    if (!audio) return;

    // 🚀 Exact hook/dholak start time
    const TARGET_START_TIME = 28.0; // 👈 Apne gaane ke hisab se 0 ya 28s set karein
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

  // 🦚 2. PEACOCK FEATHERS, BUTTER DROPS & GOLD SPARKS CANVAS
  useEffect(() => {
    if (stage !== 'TEXT_REVEAL') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    let animationId: number;

    const particles: JanmashtamiParticle[] = [];
    const goldColors = ['#F0C75E', '#D4A843', '#FFE082', '#FFD54F'];
    const peacockColors = ['#00F5D4', '#06D6A0', '#3A86FF', '#118AB2'];

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.9,
        vy: Math.random() * 0.8 + 0.4,
        size: Math.random() * 4.5 + 2,
        alpha: Math.random() * 0.7 + 0.3,
        rot: Math.random() * Math.PI * 2,
        rotSpd: (Math.random() - 0.5) * 0.03,
        type: Math.random() > 0.6 ? 'peacock' : Math.random() > 0.3 ? 'gold' : 'butter',
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, W, H);

      particles.forEach((p) => {
        p.y += p.vy;
        p.x += p.vx + Math.sin(p.y * 0.02) * 0.35;
        p.rot += p.rotSpd;

        if (p.y > H + 20) {
          p.y = -20;
          p.x = Math.random() * W;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;

        if (p.type === 'peacock') {
          // Peacock Feather particle
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = peacockColors[Math.floor(Math.random() * peacockColors.length)];
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 1.6, p.size * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'butter') {
          // White Butter Drop
          ctx.fillStyle = '#FFFFFF';
          ctx.shadowBlur = 6;
          ctx.shadowColor = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Golden Spark
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
        onCompleteRef.current();
      }
    }, 5500);
  };

  return (
    <div className="fixed inset-0 z-[999999] w-screen h-screen flex items-center justify-center overflow-hidden bg-[#040814] select-none">
      
      {/* 🔤 Google Fonts */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,700;1,900&family=Rozha+One&family=Tiro+Devanagari+Hindi&display=swap');
      `}</style>

      {/* 🎵 BOLLYWOOD AUDIO */}
      <audio
        ref={bgAudioRef}
        src="/audio/janmashtami-song.mp3"
        preload="auto"
      />

      {/* 🎬 1. VIDEO LAYER (Strict unmount on text reveal) */}
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

      {/* 🎆 2. SACRED PARTICLES CANVAS (Active on Text Stage) */}
      {stage === 'TEXT_REVEAL' && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
        />
      )}

      {/* 💎 3. 3D GOLDEN JANMASHTAMI SLOGAN & 'Happy Janmashtami' */}
      {stage === 'TEXT_REVEAL' && (
        <div className="relative z-30 flex flex-col items-center justify-center text-center px-6 py-8 max-w-5xl mx-auto animate-[zoomFadeIn_0.8s_ease-out_forwards]">
          
          {/* Radial Blue-Gold Divine Glow */}
          <div className="absolute w-[480px] h-60 bg-cyan-500/20 rounded-full blur-[110px] pointer-events-none" />

          {/* Hindi Slogan: 'हाथी घोड़ा पालकी, जय कन्हैया लाल की' */}
          <h2 
            className="text-3xl sm:text-5xl md:text-6xl font-normal tracking-wide drop-shadow-[0_4px_18px_rgba(0,0,0,0.95)] text-transparent bg-clip-text bg-gradient-to-b from-[#FFFDF0] via-[#F3D899] to-[#DFBA6B] px-4 py-2"
            style={{ fontFamily: "'Tiro Devanagari Hindi', 'Rozha One', serif", lineHeight: '1.3' }}
          >
            हाथी घोड़ा पालकी, जय कन्हैया लाल की
          </h2>

          <div className="w-32 sm:w-48 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent my-3" />

          {/* English 3D Gold Text */}
          <div className="overflow-visible py-2 px-6">
            <h1 
              className="text-4xl sm:text-6xl md:text-8xl font-black italic tracking-normal drop-shadow-[0_8px_25px_rgba(0,245,212,0.6)] text-transparent bg-clip-text bg-gradient-to-b from-[#FFFFFF] via-[#F3D899] to-[#BD8D39] inline-block"
              style={{ fontFamily: "'Playfair Display', serif", lineHeight: '1.25' }}
            >
              Happy Janmashtami
            </h1>
          </div>

          <p className="text-cyan-100/90 text-xs sm:text-sm md:text-base mt-2 font-semibold tracking-[0.3em] uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            ✨ Celebrating The Divine Birth Of Lord Krishna ✨
          </p>

          {/* Golden Progress Line */}
          <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden mt-6">
            <div className="h-full bg-gradient-to-r from-cyan-400 via-yellow-300 to-amber-500 animate-[progress_5.5s_linear_forwards]" />
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
