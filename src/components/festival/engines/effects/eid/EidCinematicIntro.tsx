'use client';

import React, { useState, useEffect } from 'react';

interface Props {
  onComplete?: () => void;
}

export default function EidCinematicIntro({ onComplete }: Props) {
  const [stage, setStage] = useState<'intro' | 'finished'>('intro');

  useEffect(() => {
    // 8.5 seconds total duration then handover to dashboard
    const timer = setTimeout(() => {
      setStage('finished');
      if (onComplete) onComplete();
    }, 8500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (stage === 'finished') return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-[#020d08] flex items-center justify-center overflow-hidden select-none">
      
      {/* 🟢 ROYAL EMERALD AMBIENT ATMOSPHERE */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020d08] via-[#082916] to-[#010805]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vw] max-w-[700px] max-h-[700px] bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none animate-pulse" />

      {/* ⭐ FLOATING GOLD STAR DUST & BOKEH */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-amber-300/80 animate-ping"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              animationDuration: `${2 + Math.random() * 3}s`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* 🏮 HANGING GOLDEN LANTERNS (FANOOS) */}
      <div className="absolute top-0 inset-x-0 flex justify-between px-8 sm:px-20 pointer-events-none z-20">
        <div className="flex flex-col items-center animate-[swing_4s_ease-in-out_infinite_alternate]">
          <div className="w-[1px] h-24 sm:h-36 bg-gradient-to-b from-amber-400/80 to-amber-500/40" />
          <div className="w-8 h-12 sm:w-10 sm:h-16 rounded-lg border-2 border-amber-400/80 bg-amber-500/20 shadow-[0_0_25px_rgba(251,191,36,0.6)] flex items-center justify-center">
            <div className="w-2 h-4 bg-amber-300 rounded-full blur-[2px] animate-pulse" />
          </div>
        </div>

        <div className="flex flex-col items-center animate-[swing_5s_ease-in-out_infinite_alternate-reverse]">
          <div className="w-[1px] h-32 sm:h-48 bg-gradient-to-b from-amber-400/80 to-amber-500/40" />
          <div className="w-10 h-14 sm:w-12 sm:h-20 rounded-lg border-2 border-amber-400/80 bg-amber-500/20 shadow-[0_0_30px_rgba(251,191,36,0.7)] flex items-center justify-center">
            <div className="w-3 h-5 bg-amber-300 rounded-full blur-[2px] animate-pulse" />
          </div>
        </div>
      </div>

      {/* 🌙 CENTRAL CRESCENT MOON & MOSQUE SILHOUETTE */}
      <div className="relative z-30 flex flex-col items-center text-center p-6 space-y-6 max-w-2xl mx-auto">
        
        {/* GLOWING 3D CRESCENT MOON */}
        <div className="relative flex items-center justify-center animate-hero-breathe">
          <div className="text-7xl sm:text-9xl filter drop-shadow-[0_0_35px_rgba(251,191,36,0.8)] transform -rotate-12">
            🌙
          </div>
        </div>

        {/* 📜 ARABIC CALLIGRAPHY */}
        <h2 className="text-3xl sm:text-5xl font-bold text-amber-300 tracking-widest drop-shadow-[0_4px_20px_rgba(251,191,36,0.6)] font-serif">
          عيد مبارك
        </h2>

        {/* 🏆 METALLIC GOLD ENGLISH TYPOGRAPHY */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-yellow-300 to-amber-600 tracking-wider drop-shadow-[0_8px_25px_rgba(255,215,0,0.5)] font-serif">
            EID MUBARAK
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/80 font-medium tracking-widest uppercase">
            SACRED LUNAR GLOW • 2027
          </p>
        </div>

      </div>

      {/* ⏭️ SKIP BUTTON */}
      <button
        onClick={() => {
          setStage('finished');
          if (onComplete) onComplete();
        }}
        className="absolute top-6 right-6 z-50 px-4 py-1.5 rounded-full bg-black/40 hover:bg-black/80 text-amber-200 border border-amber-500/30 backdrop-blur-md text-xs font-semibold tracking-wider transition-all"
      >
        SKIP ➔
      </button>

      {/* Swing Animation Style */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes swing {
          0% { transform: rotate(-3deg); }
          100% { transform: rotate(3deg); }
        }
      `}} />
    </div>
  );
}
