'use client';

import React from 'react';

export default function MagicPichkari() {
  return (
    <div className="relative w-full h-[280px] flex items-center justify-center pointer-events-none">
      <style>{`
        /* 🚀 3D Floating Pichkari Animation */
        @keyframes pichkari-float {
          0%, 100% { transform: translateY(0) rotate(-22deg) scale(1); }
          50% { transform: translateY(-10px) rotate(-18deg) scale(1.03); }
        }

        /* 🚀 Flowing Liquid Stream Animation */
        @keyframes liquid-flow {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }

        /* 🚀 Splashing droplets coming out of nozzle */
        @keyframes splash-droplet {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          80% { opacity: 0.8; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }
      `}</style>

      {/* ━━━ LAYER 1: NEON LIQUID STREAMS (FLOWING IN THE AIR) ━━━ */}
      <svg
        className="absolute top-[25%] left-[2%] w-[80%] h-[60%] z-10"
        viewBox="0 0 200 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Glow Filters for Neon Streams */}
        <defs>
          <filter id="neon-glow-pink" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="neon-glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Pink Liquid Stream */}
        <path
          d="M155 80 Q100 20 20 65"
          stroke="#ff006e"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="18 12"
          style={{
            animation: 'liquid-flow 2s linear infinite',
            filter: 'url(#neon-glow-pink)'
          }}
        />

        {/* 2. Cyan Liquid Stream */}
        <path
          d="M152 83 Q105 32 15 58"
          stroke="#00f5d4"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="12 18"
          style={{
            animation: 'liquid-flow 1.5s linear infinite',
            filter: 'url(#neon-glow-cyan)'
          }}
        />

        {/* 3. Gold/Yellow Liquid Stream */}
        <path
          d="M157 78 Q95 10 25 72"
          stroke="#ffbe0b"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="15 15"
          style={{
            animation: 'liquid-flow 2.5s linear infinite',
          }}
        />
      </svg>

      {/* ━━━ LAYER 2: FLYING GULAL DROPLETS (SPLASH) ━━━ */}
      <div className="absolute top-[62%] left-[16%] z-30">
        {[
          { color: '#ff006e', tx: '-80px', ty: '-30px', delay: '0s', size: 10 },
          { color: '#ffbe0b', tx: '-110px', ty: '-10px', delay: '0.4s', size: 8 },
          { color: '#00f5d4', tx: '-70px', ty: '20px', delay: '0.2s', size: 9 },
          { color: '#3a86ff', tx: '-90px', ty: '-50px', delay: '0.6s', size: 7 },
        ].map((drop, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: drop.size,
              height: drop.size,
              backgroundColor: drop.color,
              animation: `splash-droplet 1.2s ${drop.delay} ease-out infinite`,
              boxShadow: `0 0 15px ${drop.color}`,
              ['--tx' as string]: drop.tx,
              ['--ty' as string]: drop.ty,
            }}
          />
        ))}
      </div>

      {/* ━━━ LAYER 3: THE 3D METALLIC FLOATING PICHKARI ━━━ */}
      <div 
        className="relative z-20 w-[180px] h-[180px] origin-center"
        style={{
          animation: 'pichkari-float 4s ease-in-out infinite',
          filter: 'drop-shadow(0 25px 35px rgba(0,0,0,0.65)) drop-shadow(0 0 15px rgba(251,191,36,0.15))'
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Metallic Gold Gradients for Cylinders */}
            <linearGradient id="gold-metal-light" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="25%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="75%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>

            <linearGradient id="gold-metal-dark" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#facc15" />
              <stop offset="50%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>

            {/* Glowing Pink Liquid inside transparent chamber */}
            <linearGradient id="pink-liquid" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ff66b2" />
              <stop offset="40%" stopColor="#ff006e" />
              <stop offset="100%" stopColor="#80003c" />
            </linearGradient>
          </defs>

          {/* 1. Pichkari Handle/Plunger (Rear Section) */}
          <rect x="75" y="75" width="22" height="6" rx="2" transform="rotate(45 75 75)" fill="url(#gold-metal-dark)" />
          {/* Handle Ring */}
          <circle cx="94" cy="94" r="5" stroke="url(#gold-metal-light)" strokeWidth="3.5" fill="none" />

          {/* 2. Rear Cap (End cap of cylinder) */}
          <rect x="64" y="64" width="12" height="12" rx="1.5" transform="rotate(45 64 64)" fill="url(#gold-metal-dark)" />

          {/* 3. Transparent Chamber (Glass Section) */}
          <rect x="36" y="36" width="36" height="10" rx="1" transform="rotate(45 36 36)" fill="rgba(255,255,255,0.06)" stroke="url(#gold-metal-light)" strokeWidth="0.8" />
          {/* Glowing Gulal Liquid inside Glass */}
          <rect x="42" y="42" width="26" height="8" rx="0.5" transform="rotate(45 42 42)" fill="url(#pink-liquid)" filter="drop-shadow(0 0 8px #ff006e)" />

          {/* 4. Main Metallic Barrel Cylinder (Front Section) */}
          <rect x="22" y="22" width="28" height="11" rx="1" transform="rotate(45 22 22)" fill="url(#gold-metal-light)" />
          {/* Decorative Ring on Barrel */}
          <rect x="30" y="30" width="4" height="12" rx="0.5" transform="rotate(45 30 30)" fill="url(#gold-metal-dark)" />

          {/* 5. Front Nozzle Cone */}
          <path d="M12 12 L22 20 L16 26 Z" fill="url(#gold-metal-light)" />
          {/* Nozzle Tip */}
          <circle cx="13" cy="13" r="2.5" fill="url(#gold-metal-dark)" />
        </svg>
      </div>
    </div>
  );
} 
