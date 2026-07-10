'use client';

import React, { useState, useEffect } from 'react';

export default function Crystal2027Hero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Slight delay so popup animation plays first, then crystal appears
    const t = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`relative flex flex-col items-center justify-center w-[360px] h-[250px] select-none pointer-events-none transition-all duration-1200 ease-out ${
        mounted ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 translate-y-4'
      }`}
    >
      {/* ═══ INLINE ANIMATIONS ═══ */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes c-shimmer {
          0%   { background-position: 250% center; }
          100% { background-position: -250% center; }
        }
        @keyframes c-float {
          0%,100% { transform: translateY(0px); }
          30%     { transform: translateY(-12px); }
          70%     { transform: translateY(-7px); }
        }
        @keyframes c-glow {
          0%,100% { filter: drop-shadow(0 0 18px rgba(251,191,36,.55)) drop-shadow(0 0 50px rgba(251,191,36,.3)) drop-shadow(0 3px 6px rgba(0,0,0,.6)); }
          50%     { filter: drop-shadow(0 0 32px rgba(251,191,36,.9)) drop-shadow(0 0 80px rgba(251,191,36,.55)) drop-shadow(0 3px 6px rgba(0,0,0,.6)); }
        }
        @keyframes c-sweep {
          0%   { transform: translateX(-200%) skewX(-18deg); }
          35%  { transform: translateX(200%) skewX(-18deg); }
          100% { transform: translateX(200%) skewX(-18deg); }
        }
        @keyframes c-sparkle {
          0%,100% { opacity:0; transform:scale(0) rotate(0deg); }
          12%     { opacity:1; transform:scale(1.3) rotate(50deg); }
          28%     { opacity:.7; transform:scale(1) rotate(100deg); }
          45%     { opacity:0; transform:scale(.4) rotate(140deg); }
        }
        @keyframes c-facet {
          0%   { background-position: -300% center; }
          100% { background-position: 300% center; }
        }
        @keyframes c-aura {
          0%,100% { opacity:.25; transform:translate(-50%,-50%) scale(1); }
          50%     { opacity:.6;  transform:translate(-50%,-50%) scale(1.12); }
        }
        @keyframes c-ring {
          0%   { transform:translate(-50%,-50%) rotate(0deg); }
          100% { transform:translate(-50%,-50%) rotate(360deg); }
        }
        @keyframes c-refl {
          0%,100% { opacity:.1; }
          50%     { opacity:.2; }
        }
        @keyframes c-dot {
          0%,100% { transform:translateY(0); opacity:.3; }
          50%     { transform:translateY(-10px); opacity:1; }
        }
        @keyframes c-chromatic {
          0%   { text-shadow: -2px 0 #ff0044, 2px 0 #0066ff; }
          33%  { text-shadow: -2px 0 #00ff66, 2px 0 #ff6600; }
          66%  { text-shadow: -2px 0 #8800ff, 2px 0 #00ccff; }
          100% { text-shadow: -2px 0 #ff0044, 2px 0 #0066ff; }
        }
      `,
        }}
      />

      {/* ═══ BACKGROUND AURAS ═══ */}
      <div
        className="absolute top-1/2 left-1/2 w-[480px] h-[480px] rounded-full blur-[90px]"
        style={{
          background: 'radial-gradient(circle, rgba(251,191,36,.15) 0%, rgba(217,119,6,.06) 40%, transparent 70%)',
          animation: 'c-aura 4s ease-in-out infinite',
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 w-[320px] h-[320px] rounded-full blur-[55px]"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,.08) 0%, transparent 70%)',
          animation: 'c-aura 5.5s ease-in-out infinite 1.5s',
        }}
      />

      {/* ═══ ROTATING RINGS ═══ */}
      <div
        className="absolute top-1/2 left-1/2 w-[340px] h-[85px] rounded-[50%] border border-dashed border-yellow-400/[.14]"
        style={{ animation: 'c-ring 22s linear infinite' }}
      />
      <div
        className="absolute top-1/2 left-1/2 w-[365px] h-[95px] rounded-[50%] border border-dotted border-blue-400/[.07]"
        style={{ animation: 'c-ring 32s linear infinite reverse' }}
      />

      {/* ═══════════════════════════════════════
          MAIN CRYSTAL 2027
          ═══════════════════════════════════════ */}
      <div
        className="relative z-10"
        style={{ animation: 'c-float 5.5s ease-in-out infinite, c-glow 3s ease-in-out infinite' }}
      >
        <div className="relative">
          {/* LAYER 1 — Crystal gradient with sharp gold-white bands */}
          <span
            className="text-[128px] font-black tracking-[-0.06em] leading-none block"
            style={{
              background:
                'linear-gradient(108deg, #0d0a02 0%, #3d2e0a 5%, #7a5c14 10%, #B8860B 17%, #DAA520 23%, #FFD700 29%, #FFF8DC 34%, #FFFFFF 39%, #FFFACD 42%, #FFD700 48%, #DAA520 53%, #B8860B 58%, #FFD700 64%, #FFF8DC 69%, #FFFFFF 74%, #FFFACD 78%, #FFD700 84%, #B8860B 90%, #3d2e0a 96%, #0d0a02 100%)',
              backgroundSize: '220% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'c-shimmer 3.2s linear infinite',
            }}
          >
            2027
          </span>

          {/* LAYER 2 — Bright light sweep */}
          <span
            className="absolute inset-0 text-[128px] font-black tracking-[-0.06em] leading-none block overflow-hidden"
            style={{
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              background:
                'linear-gradient(90deg, transparent 25%, rgba(255,255,255,.45) 44%, rgba(255,255,255,.95) 50%, rgba(255,255,255,.45) 56%, transparent 75%)',
              backgroundSize: '45% 100%',
              animation: 'c-shimmer 2.6s ease-in-out infinite',
            }}
          >
            2027
          </span>

          {/* LAYER 3 — Crystal facet grid (diagonal lines) */}
          <span
            className="absolute inset-0 text-[128px] font-black tracking-[-0.06em] leading-none block"
            style={{
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              background:
                'repeating-linear-gradient(36deg, transparent 0px, transparent 6px, rgba(255,255,255,.06) 6px, rgba(255,255,255,.06) 7px), repeating-linear-gradient(-36deg, transparent 0px, transparent 10px, rgba(251,191,36,.035) 10px, rgba(251,191,36,.035) 11px)',
              backgroundSize: '220% 100%',
              animation: 'c-facet 9s linear infinite',
            }}
          >
            2027
          </span>

          {/* LAYER 4 — Top highlight (glass top reflection) */}
          <span
            className="absolute inset-0 text-[128px] font-black tracking-[-0.06em] leading-none block"
            style={{
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              background:
                'linear-gradient(180deg, rgba(255,255,255,.4) 0%, rgba(255,255,255,.08) 35%, transparent 52%)',
            }}
          >
            2027
          </span>

          {/* LAYER 5 — Bottom warm glow */}
          <span
            className="absolute inset-0 text-[128px] font-black tracking-[-0.06em] leading-none block"
            style={{
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              background:
                'linear-gradient(0deg, rgba(251,191,36,.3) 0%, rgba(200,150,50,.1) 35%, transparent 55%)',
            }}
          >
            2027
          </span>

          {/* LAYER 6 — Subtle chromatic aberration edge */}
          <span
            className="absolute inset-0 text-[128px] font-black tracking-[-0.06em] leading-none block"
            style={{
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              background:
                'linear-gradient(108deg, rgba(255,0,68,.06) 0%, transparent 20%, transparent 80%, rgba(0,102,255,.06) 100%)',
              backgroundSize: '220% 100%',
              animation: 'c-shimmer 3.2s linear infinite',
              mixBlendMode: 'screen',
            }}
          >
            2027
          </span>

          {/* Sweeping light bar (separate element, not clipped to text) */}
          <div
            className="absolute top-0 left-0 w-[60%] h-full overflow-hidden"
            style={{ pointerEvents: 'none' }}
          >
            <div
              className="w-full h-full"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,.12) 40%, rgba(255,255,255,.25) 50%, rgba(255,255,255,.12) 60%, transparent 100%)',
                animation: 'c-sweep 4s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      </div>

      {/* ═══ REFLECTION ═══ */}
      <div
        className="absolute top-[63%] text-[128px] font-black tracking-[-0.06em] leading-none blur-[2px] scale-y-[-1] pointer-events-none z-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,215,0,.45) 0%, rgba(251,191,36,.2) 30%, transparent 60%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          maskImage: 'linear-gradient(to bottom, rgba(255,255,255,.4) 0%, transparent 50%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(255,255,255,.4) 0%, transparent 50%)',
          animation: 'c-refl 4s ease-in-out infinite',
        }}
      >
        2027
      </div>

      {/* ═══ CROSS SPARKLES ✦ ═══ */}
      {[
        { top: '6%', left: '6%', s: 22, d: 0, dur: 3.2 },
        { top: '14%', right: '8%', s: 17, d: 0.8, dur: 3.8 },
        { top: '50%', left: '3%', s: 15, d: 1.5, dur: 2.9 },
        { top: '46%', right: '6%', s: 19, d: 0.35, dur: 3.4 },
        { top: '10%', left: '50%', s: 13, d: 2.2, dur: 4.1 },
        { top: '56%', right: '18%', s: 16, d: 1.1, dur: 3.6 },
        { top: '28%', left: '-1%', s: 12, d: 0.55, dur: 2.7 },
        { top: '40%', right: '-1%', s: 14, d: 1.9, dur: 3.3 },
        { top: '4%', left: '32%', s: 11, d: 2.7, dur: 4.4 },
        { top: '62%', left: '28%', s: 13, d: 1.0, dur: 3.9 },
        { top: '20%', left: '75%', s: 10, d: 3.0, dur: 4.6 },
        { top: '55%', left: '65%', s: 12, d: 0.2, dur: 3.1 },
      ].map((p, i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{
            top: p.top,
            left: p.left,
            right: p.right,
            width: p.s,
            height: p.s,
            animation: `c-sparkle ${p.dur}s ease-in-out ${p.d}s infinite`,
          }}
        >
          <svg width={p.s} height={p.s} viewBox="0 0 20 20" fill="none">
            <line x1="10" y1="1" x2="10" y2="19" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <line x1="1" y1="10" x2="19" y2="10" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <line x1="4" y1="4" x2="16" y2="16" stroke="#FFD700" strokeWidth="1" strokeLinecap="round" opacity=".5" />
            <line x1="16" y1="4" x2="4" y2="16" stroke="#FFD700" strokeWidth="1" strokeLinecap="round" opacity=".5" />
            <circle cx="10" cy="10" r="2.2" fill="white" />
          </svg>
        </div>
      ))}

      {/* ═══ FLOATING DOTS ═══ */}
      {[
        { top: '20%', left: '16%', sz: 3.5, d: 0, c: 'bg-yellow-300' },
        { top: '34%', right: '14%', sz: 2.5, d: 0.9, c: 'bg-amber-200' },
        { top: '54%', left: '20%', sz: 4, d: 1.6, c: 'bg-yellow-400' },
        { top: '26%', right: '20%', sz: 2, d: 0.4, c: 'bg-yellow-200' },
        { top: '62%', left: '42%', sz: 3, d: 1.3, c: 'bg-amber-300' },
      ].map((dot, i) => (
        <div
          key={`d${i}`}
          className={`absolute rounded-full ${dot.c} shadow-[0_0_8px_rgba(251,191,36,.6)]`}
          style={{
            top: dot.top,
            left: dot.left,
            right: dot.right,
            width: dot.sz,
            height: dot.sz,
            animation: `c-dot ${2.2 + i * 0.4}s ease-in-out ${dot.d}s infinite`,
          }}
        />
      ))}
      {[
        { top: '13%', left: '40%', d: 0.35 },
        { top: '44%', right: '28%', d: 1.2 },
        { top: '58%', left: '10%', d: 0.75 },
      ].map((dot, i) => (
        <div
          key={`w${i}`}
          className="absolute w-1.5 h-1.5 rounded-full bg-white/90 shadow-[0_0_6px_rgba(255,255,255,.8)]"
          style={{
            top: dot.top,
            left: dot.left,
            right: dot.right,
            animation: `c-dot ${2.8 + i * 0.3}s ease-in-out ${dot.d}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
