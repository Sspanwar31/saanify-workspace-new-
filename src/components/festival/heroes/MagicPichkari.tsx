'use client';

import React, { useMemo } from 'react';

export default function MagicPichkari() {
// 🎯 Generate deterministic random values using seed
const particles = useMemo(() => {
const items = [];
const colors = ['#ff006e', '#ffbe0b', '#00f5d4', '#3a86ff', '#8338ec', '#ff5400', '#06d6a0', '#ef476f'];

// 40+ splash particles with physics
for (let i = 0; i < 45; i++) {
  const angle = (Math.random() * 120 + 150) * (Math.PI / 180); // 150-270 degree spread
  const velocity = 40 + Math.random() * 100;
  const gravity = 30 + Math.random() * 20;
  
  items.push({
    id: i,
    color: colors[i % colors.length],
    size: 3 + Math.random() * 8,
    tx: Math.cos(angle) * velocity,
    ty: Math.sin(angle) * velocity - gravity,
    delay: Math.random() * 1.5,
    duration: 0.8 + Math.random() * 0.8,
    opacity: 0.7 + Math.random() * 0.3,
    trail: Math.random() > 0.6,
  });
}
return items;
}, []);
// 🎯 Metallic sparkle points
const sparkles = useMemo(() => {
const items = [];
for (let i = 0; i < 14; i++) {
items.push({
id: i,
x: 15 + Math.random() * 70,
y: 15 + Math.random() * 70,
delay: Math.random() * 3,
size: 1 + Math.random() * 2.5,
});
}
return items;
}, []);
// 🎯 Liquid stream paths with turbulence
const streams = useMemo(() => [
// Main thick stream
{ d: 'M160 85 Q110 25 25 70', width: 4, color: '#ff006e', speed: '1.8s', dash: '20 10', glow: 4 },
// Secondary stream
{ d: 'M158 88 Q115 35 18 62', width: 3, color: '#00f5d4', speed: '1.4s', dash: '14 16', glow: 3 },
// Gold stream (upper arc)
{ d: 'M162 82 Q100 8 22 75', width: 2.5, color: '#ffbe0b', speed: '2.2s', dash: '18 14', glow: 2 },
// Purple stream (lower arc)
{ d: 'M156 90 Q108 45 12 55', width: 2, color: '#8338ec', speed: '1.6s', dash: '10 20', glow: 2.5 },
// Thin accent stream
{ d: 'M163 84 Q105 15 28 68', width: 1.5, color: '#ff5400', speed: '2.5s', dash: '8 22', glow: 1.5 },
// Cyan highlight
{ d: 'M159 86 Q112 30 20 65', width: 1.5, color: '#06d6a0', speed: '1.9s', dash: '12 18', glow: 1.5 },
// Pink accent (wavy)
{ d: 'M161 83 Q95 18 15 72', width: 2, color: '#ef476f', speed: '2.1s', dash: '16 12', glow: 2 },
// Blue thin line
{ d: 'M157 89 Q118 40 10 58', width: 1, color: '#3a86ff', speed: '1.3s', dash: '6 24', glow: 1 },
], []);
return (
<div className="relative w-full h-[320px] flex items-center justify-center pointer-events-none overflow-visible">
<style>{`
/* ═══════════════════════════════════════════════════
🚀 2027 ADVANCED PICHKARI ANIMATION SYSTEM
═══════════════════════════════════════════════════ */
code
Code
/* 3D Float with subtle rotation */
    @keyframes pichkari-float-3d {
      0%, 100% { 
        transform: translateY(0) rotate(-22deg) scale(1); 
        filter: drop-shadow(0 30px 40px rgba(0,0,0,0.7)) drop-shadow(0 0 20px rgba(251,191,36,0.2));
      }
      25% { 
        transform: translateY(-12px) rotate(-20deg) scale(1.02); 
        filter: drop-shadow(0 35px 45px rgba(0,0,0,0.75)) drop-shadow(0 0 25px rgba(255,0,110,0.15));
      }
      50% { 
        transform: translateY(-6px) rotate(-18deg) scale(1.04); 
        filter: drop-shadow(0 28px 38px rgba(0,0,0,0.65)) drop-shadow(0 0 30px rgba(0,245,212,0.2));
      }
      75% { 
        transform: translateY(-14px) rotate(-21deg) scale(1.01); 
        filter: drop-shadow(0 32px 42px rgba(0,0,0,0.7)) drop-shadow(0 0 22px rgba(131,56,236,0.15));
      }
    }

    /* Liquid flow with smooth easing */
    @keyframes liquid-flow-advanced {
      0% { stroke-dashoffset: 200; opacity: 0.9; }
      50% { opacity: 1; }
      100% { stroke-dashoffset: 0; opacity: 0.9; }
    }

    /* Splash with gravity simulation */
    @keyframes splash-physics {
      0% { 
        transform: translate(0, 0) scale(1) rotate(0deg); 
        opacity: 1; 
      }
      30% {
        opacity: 1;
      }
      100% { 
        transform: translate(var(--tx), var(--ty)) scale(0.1) rotate(180deg); 
        opacity: 0; 
      }
    }

    /* Trail effect for particles */
    @keyframes trail-fade {
      0% { width: var(--size); height: var(--size); opacity: 0.6; }
      100% { width: calc(var(--size) * 3); height: calc(var(--size) * 0.3); opacity: 0; }
    }

    /* Metallic sparkle glint */
    @keyframes sparkle-glint {
      0%, 100% { opacity: 0; transform: scale(0); }
      50% { opacity: 1; transform: scale(1); }
    }

    /* Rainbow color cycle for ambient */
    @keyframes rainbow-cycle {
      0% { filter: hue-rotate(0deg); }
      100% { filter: hue-rotate(360deg); }
    }

    /* Ambient pulse glow */
    @keyframes ambient-pulse {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.1); }
    }

    /* Number badge float */
    @keyframes badge-float {
      0%, 100% { transform: translateY(0) rotate(-5deg); }
      50% { transform: translateY(-8px) rotate(5deg); }
    }

    /* Nozzle drip */
    @keyframes nozzle-drip {
      0% { transform: translate(0, 0) scale(1); opacity: 1; }
      100% { transform: translate(-15px, 25px) scale(0.5); opacity: 0; }
    }

    /* Chamber bubble */
    @keyframes chamber-bubble {
      0% { transform: translateY(0) scale(1); opacity: 0.5; }
      50% { transform: translateY(-3px) scale(1.2); opacity: 0.8; }
      100% { transform: translateY(-6px) scale(0.8); opacity: 0; }
    }
  `}</style>

  {/* ━━━ LAYER 0: AMBIENT BACKGROUND GLOW ━━━ */}
  <div 
    className="absolute top-1/2 left-[35%] -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full"
    style={{
      background: 'radial-gradient(circle, rgba(255,0,110,0.15) 0%, rgba(131,56,236,0.08) 40%, transparent 70%)',
      animation: 'ambient-pulse 3s ease-in-out infinite, rainbow-cycle 8s linear infinite',
      filter: 'blur(20px)',
    }}
  />

  {/* ━━━ LAYER 1: ADVANCED LIQUID STREAMS ━━━ */}
  <svg
    className="absolute top-[18%] left-[0%] w-[85%] h-[65%] z-10"
    viewBox="0 0 200 130"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      {/* Dynamic glow filters for each color */}
      <filter id="glow-pink" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feFlood floodColor="#ff006e" floodOpacity="0.6" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="glow-cyan" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feFlood floodColor="#00f5d4" floodOpacity="0.5" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="glow-gold" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="2.5" result="blur" />
        <feFlood floodColor="#ffbe0b" floodOpacity="0.5" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="glow-purple" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feFlood floodColor="#8338ec" floodOpacity="0.5" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Turbulence filter for wavy liquid effect */}
      <filter id="turbulence">
        <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
      </filter>
    </defs>

    {/* Render all 8 liquid streams */}
    {streams.map((stream, i) => (
      <path
        key={i}
        d={stream.d}
        stroke={stream.color}
        strokeWidth={stream.width}
        strokeLinecap="round"
        strokeDasharray={stream.dash}
        style={{
          animation: `liquid-flow-advanced ${stream.speed} linear infinite`,
          filter: `url(#glow-${['pink', 'cyan', 'gold', 'purple', 'gold', 'cyan', 'pink', 'cyan'][i]})`,
          opacity: 0.85,
        }}
      />
    ))}

    {/* Splash mist at endpoint */}
    <circle cx="22" cy="68" r="15" fill="url(#splash-mist)" opacity="0.3">
      <animate attributeName="r" values="15;25;15" dur="2s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
    </circle>
    <radialGradient id="splash-mist">
      <stop offset="0%" stopColor="#ff006e" stopOpacity="0.5" />
      <stop offset="100%" stopColor="#ff006e" stopOpacity="0" />
    </radialGradient>
  </svg>

  {/* ━━━ LAYER 2: PHYSICS-BASED SPLASH PARTICLES ━━━ */}
  <div className="absolute top-[58%] left-[14%] z-30">
    {particles.map((p) => (
      <div key={p.id} className="absolute">
        {/* Main particle */}
        <div
          className="rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}, 0 0 ${p.size * 4}px ${p.color}40`,
            animation: `splash-physics ${p.duration}s ${p.delay} ease-out infinite`,
            opacity: p.opacity,
            ['--tx' as string]: `${p.tx}px`,
            ['--ty' as string]: `${p.ty}px`,
          }}
        />
        {/* Trail effect for larger particles */}
        {p.trail && (
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              ['--size' as string]: `${p.size}px`,
              animation: `trail-fade ${p.duration * 0.7}s ${p.delay}s ease-out infinite`,
              filter: 'blur(2px)',
            }}
          />
        )}
      </div>
    ))}
  </div>

  {/* ━━━ LAYER 3: THE 3D METALLIC PICHKARI (UPGRADED) ━━━ */}
  <div 
    className="relative z-20 w-[200px] h-[200px] origin-center"
    style={{
      animation: 'pichkari-float-3d 5s ease-in-out infinite',
    }}
  >
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* 🪙 Ultra-realistic Gold Gradients */}
        <linearGradient id="gold-ultra-light" x1="0" y1="0" x2="140" y2="140" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fefce8" />
          <stop offset="15%" stopColor="#fef08a" />
          <stop offset="30%" stopColor="#fde047" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="70%" stopColor="#ca8a04" />
          <stop offset="85%" stopColor="#a16207" />
          <stop offset="100%" stopColor="#713f12" />
        </linearGradient>

        <linearGradient id="gold-ultra-dark" x1="0" y1="0" x2="140" y2="140" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="30%" stopColor="#b45309" />
          <stop offset="60%" stopColor="#78350f" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>

        <linearGradient id="gold-highlight" x1="0" y1="0" x2="70" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="40%" stopColor="rgba(255,255,255,0.4)" />
          <stop offset="60%" stopColor="rgba(255,255,255,0.4)" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>

        {/* 🌈 Rainbow Liquid in Chamber */}
        <linearGradient id="rainbow-liquid" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff006e" />
          <stop offset="25%" stopColor="#ff5400" />
          <stop offset="50%" stopColor="#ffbe0b" />
          <stop offset="75%" stopColor="#00f5d4" />
          <stop offset="100%" stopColor="#3a86ff" />
        </linearGradient>

        {/* Nozzle glow */}
        <radialGradient id="nozzle-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff006e" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#ff006e" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ff006e" stopOpacity="0" />
        </radialGradient>

        {/* Reflection gradient */}
        <linearGradient id="reflection" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
        </linearGradient>
      </defs>

      {/* ── 1. HANDLE/PLUNGER (Rear) ── */}
      <rect x="88" y="88" width="26" height="7" rx="2" transform="rotate(45 88 88)" fill="url(#gold-ultra-dark)" />
      {/* Handle knurling texture */}
      {Array.from({length: 5}).map((_, i) => (
        <line key={`knurl-${i}`} x1={90 + i * 4} y1={90 + i * 4} x2={92 + i * 4} y2={88 + i * 4} stroke="#451a03" strokeWidth="0.5" transform="rotate(45 88 88)" opacity="0.4" />
      ))}
      {/* Handle Ring */}
      <circle cx="110" cy="110" r="6" stroke="url(#gold-ultra-light)" strokeWidth="4" fill="none" />
      <circle cx="110" cy="110" r="6" stroke="url(#gold-highlight)" strokeWidth="4" fill="none" opacity="0.5" />

      {/* ── 2. REAR CAP ── */}
      <rect x="76" y="76" width="14" height="14" rx="2" transform="rotate(45 76 76)" fill="url(#gold-ultra-dark)" />
      <rect x="76" y="76" width="14" height="7" rx="1" transform="rotate(45 76 76)" fill="url(#reflection)" />

      {/* ── 3. TRANSPARENT CHAMBER ── */}
      <rect x="44" y="44" width="42" height="12" rx="2" transform="rotate(45 44 44)" fill="rgba(255,255,255,0.08)" stroke="url(#gold-ultra-light)" strokeWidth="1" />
      {/* Rainbow liquid inside */}
      <rect x="48" y="48" width="32" height="9" rx="1.5" transform="rotate(45 48 48)" fill="url(#rainbow-liquid)" filter="drop-shadow(0 0 12px rgba(255,0,110,0.6))" style={{ animation: 'rainbow-cycle 3s linear infinite' }} />
      {/* Chamber glass reflection */}
      <rect x="44" y="44" width="42" height="6" rx="1" transform="rotate(45 44 44)" fill="url(#reflection)" />
      {/* Bubbles inside chamber */}
      <circle cx="58" cy="58" r="1.5" fill="rgba(255,255,255,0.6)" style={{ animation: 'chamber-bubble 2s 0s ease-in-out infinite' }} />
      <circle cx="62" cy="62" r="1" fill="rgba(255,255,255,0.5)" style={{ animation: 'chamber-bubble 2.5s 0.8s ease-in-out infinite' }} />
      <circle cx="55" cy="55" r="1.2" fill="rgba(255,255,255,0.4)" style={{ animation: 'chamber-bubble 1.8s 1.2s ease-in-out infinite' }} />

      {/* ── 4. MAIN BARREL CYLINDER ── */}
      <rect x="26" y="26" width="32" height="14" rx="2" transform="rotate(45 26 26)" fill="url(#gold-ultra-light)" />
      {/* Barrel top reflection */}
      <rect x="26" y="26" width="32" height="7" rx="1" transform="rotate(45 26 26)" fill="url(#reflection)" />
      {/* Decorative rings */}
      <rect x="34" y="34" width="5" height="15" rx="0.5" transform="rotate(45 34 34)" fill="url(#gold-ultra-dark)" />
      <rect x="48" y="48" width="3" height="15" rx="0.5" transform="rotate(45 48 48)" fill="url(#gold-ultra-dark)" opacity="0.6" />

      {/* ── 5. FRONT NOZZLE CONE ── */}
      <path d="M14 14 L26 24 L18 32 Z" fill="url(#gold-ultra-light)" />
      <path d="M14 14 L26 24 L20 28 Z" fill="url(#reflection)" opacity="0.6" />
      {/* Nozzle tip with glow */}
      <circle cx="14" cy="14" r="8" fill="url(#nozzle-glow)" style={{ animation: 'ambient-pulse 1s ease-in-out infinite' }} />
      <circle cx="14" cy="14" r="3.5" fill="url(#gold-ultra-dark)" />
      <circle cx="13" cy="13" r="1.5" fill="url(#gold-ultra-light)" />

      {/* ── 6. METALLIC SPARKLE GLINTS ── */}
      {sparkles.map((s) => (
        <circle
          key={s.id}
          cx={s.x}
          cy={s.y}
          r={s.size}
          fill="white"
          style={{
            animation: `sparkle-glint 2s ${s.delay}s ease-in-out infinite`,
            filter: 'blur(0.5px)',
          }}
        />
      ))}

      {/* ── 7. NOZZLE DRIP DROPS ── */}
      <circle cx="10" cy="18" r="2" fill="#ff006e" style={{ animation: 'nozzle-drip 1.5s 0s ease-in infinite' }} />
      <circle cx="8" cy="20" r="1.5" fill="#00f5d4" style={{ animation: 'nozzle-drip 1.8s 0.6s ease-in infinite' }} />
      <circle cx="12" cy="16" r="1.8" fill="#ffbe0b" style={{ animation: 'nozzle-drip 2s 1.2s ease-in infinite' }} />
    </svg>
  </div>

  {/* ━━━ LAYER 4: "2027" NUMBER BADGE ━━━ */}
  <div 
    className="absolute z-40"
    style={{
      top: '12%',
      right: '8%',
      animation: 'badge-float 3s ease-in-out infinite',
    }}
  >
    <div className="relative">
      {/* Badge glow */}
      <div 
        className="absolute inset-0 rounded-2xl blur-lg"
        style={{
          background: 'linear-gradient(135deg, #ff006e, #8338ec)',
          opacity: 0.5,
        }}
      />
      {/* Badge body */}
      <div 
        className="relative px-5 py-2.5 rounded-2xl border border-white/20"
        style={{
          background: 'linear-gradient(135deg, rgba(255,0,110,0.9), rgba(131,56,236,0.9))',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(255,0,110,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
        }}
      >
        <span className="text-white font-black text-2xl tracking-wider" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
          2027
        </span>
      </div>
      {/* Sparkle dots on badge */}
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full animate-pulse" />
      <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-cyan-300 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
    </div>
  </div>

  {/* ━━━ LAYER 5: FLOATING GULAL CLOUDS ━━━ */}
  <div className="absolute top-[10%] left-[5%] z-5 opacity-60">
    <div className="w-20 h-20 rounded-full" style={{ background: 'radial-gradient(circle, #ff006e40, transparent)', filter: 'blur(8px)', animation: 'ambient-pulse 4s 0s ease-in-out infinite' }} />
  </div>
  <div className="absolute top-[20%] right-[15%] z-5 opacity-50">
    <div className="w-16 h-16 rounded-full" style={{ background: 'radial-gradient(circle, #00f5d440, transparent)', filter: 'blur(6px)', animation: 'ambient-pulse 3.5s 1s ease-in-out infinite' }} />
  </div>
  <div className="absolute bottom-[20%] left-[10%] z-5 opacity-40">
    <div className="w-24 h-24 rounded-full" style={{ background: 'radial-gradient(circle, #8338ec30, transparent)', filter: 'blur(10px)', animation: 'ambient-pulse 5s 0.5s ease-in-out infinite' }} />
  </div>
</div>
);
}
