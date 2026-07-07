'use client';

import { useEffect, useRef } from 'react';

export default function ChristmasHero() {
  const raysRef = useRef<HTMLDivElement>(null);
  const lightsRef = useRef<HTMLDivElement>(null);
  const sparkleRef = useRef<HTMLDivElement>(null);
  const snowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    /* ── God Rays ── */
    if (raysRef.current) {
      const rays = [
        { angle: -32, w: 22, h: 200, del: 0 },
        { angle: -20, w: 16, h: 250, del: 0.7 },
        { angle: -9, w: 28, h: 290, del: 1.4 },
        { angle: 0, w: 34, h: 320, del: 2.1 },
        { angle: 9, w: 28, h: 290, del: 2.8 },
        { angle: 20, w: 16, h: 250, del: 3.5 },
        { angle: 32, w: 22, h: 200, del: 4.2 },
      ];
      rays.forEach((r) => {
        const el = document.createElement('div');
        el.className = 'ch-god-ray';
        el.style.cssText = `top:52px;left:calc(50% - ${r.w / 2}px);width:${r.w}px;height:${r.h}px;transform:rotate(${r.angle}deg);animation-delay:${r.del}s;`;
        raysRef.current!.appendChild(el);
      });
    }

    /* ── 25 Blinking Lights ── */
    if (lightsRef.current) {
      const colors: Record<string, { bg: string; glow: string }> = {
        red: { bg: '#f87171', glow: 'rgba(248,113,113,' },
        blue: { bg: '#60a5fa', glow: 'rgba(96,165,250,' },
        gold: { bg: '#fbbf24', glow: 'rgba(251,191,36,' },
        green: { bg: '#4ade80', glow: 'rgba(74,222,128,' },
        purple: { bg: '#c084fc', glow: 'rgba(192,132,252,' },
      };
      const lights = [
        { t: 14, l: 49, c: 'red', s: 5, d: 1.4, dl: 0 },
        { t: 17, l: 52, c: 'gold', s: 4, d: 2.1, dl: 0.3 },
        { t: 21, l: 44, c: 'blue', s: 5, d: 1.9, dl: 0.6 },
        { t: 23, l: 56, c: 'green', s: 4, d: 2.7, dl: 0.1 },
        { t: 19, l: 50, c: 'purple', s: 4, d: 3.3, dl: 0.8 },
        { t: 27, l: 40, c: 'gold', s: 6, d: 1.6, dl: 0.2 },
        { t: 29, l: 51, c: 'red', s: 5, d: 2.3, dl: 0.9 },
        { t: 28, l: 61, c: 'blue', s: 4, d: 1.8, dl: 0.4 },
        { t: 34, l: 36, c: 'green', s: 5, d: 2.5, dl: 0.5 },
        { t: 35, l: 48, c: 'purple', s: 6, d: 3.1, dl: 0.15 },
        { t: 36, l: 58, c: 'gold', s: 5, d: 1.5, dl: 0.85 },
        { t: 33, l: 65, c: 'red', s: 4, d: 2.9, dl: 0.35 },
        { t: 40, l: 32, c: 'blue', s: 5, d: 2.0, dl: 0.7 },
        { t: 41, l: 45, c: 'gold', s: 6, d: 1.7, dl: 0.25 },
        { t: 42, l: 57, c: 'green', s: 5, d: 3.4, dl: 0.55 },
        { t: 39, l: 67, c: 'red', s: 4, d: 2.2, dl: 0.75 },
        { t: 47, l: 29, c: 'purple', s: 5, d: 2.8, dl: 0.1 },
        { t: 45, l: 41, c: 'red', s: 6, d: 1.3, dl: 0.6 },
        { t: 48, l: 52, c: 'blue', s: 5, d: 2.6, dl: 0.3 },
        { t: 46, l: 63, c: 'gold', s: 5, d: 1.9, dl: 0.9 },
        { t: 44, l: 72, c: 'green', s: 4, d: 3.0, dl: 0.45 },
        { t: 52, l: 25, c: 'gold', s: 5, d: 2.4, dl: 0.7 },
        { t: 53, l: 38, c: 'purple', s: 6, d: 1.6, dl: 0.2 },
        { t: 51, l: 51, c: 'red', s: 5, d: 3.2, dl: 0.5 },
        { t: 54, l: 63, c: 'blue', s: 4, d: 2.1, dl: 0.8 },
      ];
      lights.forEach((li) => {
        const col = colors[li.c];
        const el = document.createElement('div');
        el.className = 'ch-light';
        const gs = li.s * 2.5;
        el.style.cssText = `top:${li.t}%;left:${li.l}%;width:${li.s}px;height:${li.s}px;background:${col.bg};box-shadow:0 0 ${gs}px ${gs * 0.6}px ${col.glow}0.55);--ch-dur:${li.d}s;--ch-del:${li.dl}s;`;
        lightsRef.current!.appendChild(el);
      });
    }

    /* ── Sparkles ── */
    if (sparkleRef.current) {
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.5;
        const radius = 25 + Math.random() * 30;
        const x = 50 + Math.cos(angle) * (radius / 3.8);
        const y = 9.5 + Math.sin(angle) * (radius / 5.6);
        const el = document.createElement('div');
        el.className = 'ch-sparkle';
        const sz = 2 + Math.random() * 2;
        el.style.cssText = `left:${x}%;top:${y}%;--ch-spkd:${2 + Math.random() * 3}s;--ch-spkdel:${Math.random() * 4}s;width:${sz}px;height:${sz}px;`;
        sparkleRef.current.appendChild(el);
      }
    }

    /* ── Snow Particles ── */
    if (snowRef.current) {
      for (let i = 0; i < 22; i++) {
        const size = 1.5 + Math.random() * 3;
        const left = Math.random() * 100;
        const fd = 7 + Math.random() * 9;
        const fsd = Math.random() * 12;
        const sdx = -25 + Math.random() * 50;
        const sop = 0.25 + Math.random() * 0.45;
        const el = document.createElement('div');
        el.className = 'ch-snow';
        el.style.cssText = `left:${left}%;width:${size}px;height:${size}px;--ch-fd:${fd}s;--ch-fsd:${fsd}s;--ch-sdx:${sdx};--ch-sop:${sop};`;
        snowRef.current.appendChild(el);
      }
    }
  }, []);

  return (
    <div className="ch-hero">
      <style>{`
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }

        .ch-hero {
          position: relative;
          width: 380px;
          height: 560px;
          border-radius: 20px;
          background: rgba(255,255,255,0.015);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.05);
          box-shadow: 0 0 80px rgba(251,191,36,0.04), 0 30px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04);
          overflow: hidden;
        }

        /* Bokeh */
        .ch-bokeh {
          position: absolute;
          border-radius: 50%;
          filter: blur(35px);
          opacity: 0.07;
          animation: chBokehDrift 10s ease-in-out infinite alternate;
          z-index: 1;
        }
        @keyframes chBokehDrift {
          0% { transform: translateY(0) scale(1); }
          100% { transform: translateY(-18px) scale(1.12); }
        }

        /* God Rays */
        .ch-god-ray {
          position: absolute;
          clip-path: polygon(50% 0%, 15% 100%, 85% 100%);
          background: linear-gradient(to bottom, rgba(251,191,36,0.18), rgba(251,191,36,0.02) 60%, transparent);
          transform-origin: top center;
          z-index: 3;
          animation: chRayPulse 5s ease-in-out infinite;
        }
        @keyframes chRayPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        /* Star */
        .ch-star-wrap {
          position: absolute;
          top: 18px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 22;
          animation: chStarFloat 3.5s ease-in-out infinite;
        }
        @keyframes chStarFloat {
          0%, 100% { transform: translateX(-50%) translateY(0) scale(1); }
          50% { transform: translateX(-50%) translateY(-7px) scale(1.06); }
        }
        .ch-star-halo {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 110px;
          height: 110px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(251,191,36,0.22) 0%, rgba(251,191,36,0.04) 50%, transparent 72%);
          animation: chHaloPulse 3s ease-in-out infinite;
          z-index: 21;
          pointer-events: none;
        }
        @keyframes chHaloPulse {
          0%, 100% { transform: translate(-50%,-50%) scale(1); opacity: 0.7; }
          50% { transform: translate(-50%,-50%) scale(1.25); opacity: 1; }
        }

        /* Tree Breathe */
        .ch-tree-wrap {
          position: absolute;
          top: 42px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          animation: chTreeBreathe 5s ease-in-out infinite;
          transform-origin: center bottom;
        }
        @keyframes chTreeBreathe {
          0%, 100% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.018); }
        }

        /* Lights */
        .ch-light {
          position: absolute;
          border-radius: 50%;
          z-index: 15;
          transform: translate(-50%, -50%);
          animation: chLightBlink var(--ch-dur) ease-in-out infinite;
          animation-delay: var(--ch-del);
          will-change: opacity, transform;
        }
        @keyframes chLightBlink {
          0%, 100% { opacity: 1; transform: translate(-50%,-50%) scale(1); }
          40% { opacity: 0.15; transform: translate(-50%,-50%) scale(0.55); }
          60% { opacity: 0.9; transform: translate(-50%,-50%) scale(1.05); }
        }

        /* Ornaments */
        .ch-ornament {
          position: absolute;
          border-radius: 50%;
          z-index: 16;
          transform: translate(-50%, -50%);
          border: 1px solid rgba(255,255,255,0.25);
        }

        /* Snow */
        .ch-snow {
          position: absolute;
          background: white;
          border-radius: 50%;
          z-index: 6;
          opacity: 0;
          animation: chSnowfall var(--ch-fd) linear infinite;
          animation-delay: var(--ch-fsd);
          will-change: transform, opacity;
        }
        @keyframes chSnowfall {
          0% { transform: translateY(-10px) translateX(0); opacity: 0; }
          8% { opacity: var(--ch-sop); }
          50% { transform: translateY(270px) translateX(calc(var(--ch-sdx) * 1px)); }
          92% { opacity: var(--ch-sop); }
          100% { transform: translateY(560px) translateX(calc(var(--ch-sdx) * 0.5px)); opacity: 0; }
        }

        /* Sparkles */
        .ch-sparkle {
          position: absolute;
          border-radius: 50%;
          background: #fbbf24;
          z-index: 19;
          pointer-events: none;
          animation: chSparklePop var(--ch-spkd) ease-in-out infinite;
          animation-delay: var(--ch-spkdel);
        }
        @keyframes chSparklePop {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.2) rotate(180deg); }
        }

        /* Ground Snow */
        .ch-ground-glow {
          position: absolute;
          bottom: 78px;
          left: 50%;
          transform: translateX(-50%);
          width: 310px;
          height: 55px;
          background: radial-gradient(ellipse, rgba(255,255,255,0.18) 0%, transparent 68%);
          filter: blur(10px);
          z-index: 8;
        }
        .ch-ground-surface {
          position: absolute;
          bottom: 72px;
          left: 50%;
          transform: translateX(-50%);
          width: 290px;
          height: 20px;
          background: radial-gradient(ellipse at 50% 60%, rgba(255,255,255,0.12) 0%, transparent 70%);
          border-radius: 50%;
          z-index: 9;
        }

        /* Gift Boxes */
        .ch-gift {
          position: absolute;
          z-index: 12;
          border-radius: 3px;
        }
        .ch-gift-lid {
          position: absolute;
          top: -5px;
          left: -3px;
          right: -3px;
          height: 7px;
          border-radius: 2px 2px 0 0;
          filter: brightness(1.15);
        }
        .ch-gift-ribbon-v {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 100%;
          background: linear-gradient(180deg, #fde68a, #b45309);
          border-radius: 1px;
        }
        .ch-gift-ribbon-h {
          position: absolute;
          top: 50%;
          left: 0;
          transform: translateY(-50%);
          width: 100%;
          height: 4px;
          background: linear-gradient(90deg, #fde68a, #b45309);
          border-radius: 1px;
        }
        .ch-gift-bow {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          width: 18px;
          height: 10px;
        }
        .ch-gift-bow::before,
        .ch-gift-bow::after {
          content: '';
          position: absolute;
          top: 0;
          width: 9px;
          height: 9px;
          background: radial-gradient(circle at 30% 30%, #fde68a, #d97706);
          border-radius: 50% 50% 10% 50%;
        }
        .ch-gift-bow::before { left: -1px; transform: rotate(-25deg); }
        .ch-gift-bow::after { right: -1px; transform: rotate(25deg) scaleX(-1); }

        /* Text */
        .ch-title {
          font-family: Georgia, 'Playfair Display', serif;
          font-weight: 900;
          font-size: 30px;
          background: linear-gradient(120deg, #92400e, #f59e0b, #fde68a, #f59e0b, #92400e);
          background-size: 250% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: chGoldShimmer 5s ease-in-out infinite;
          letter-spacing: 0.5px;
          line-height: 1.2;
        }
        @keyframes chGoldShimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .ch-divider {
          width: 70px;
          height: 1px;
          margin: 8px auto;
          background: linear-gradient(90deg, transparent, rgba(245,158,11,0.45), transparent);
        }
        .ch-subtitle {
          font-family: 'Outfit', -apple-system, sans-serif;
          font-weight: 300;
          font-size: 10px;
          color: rgba(148,163,184,0.7);
          letter-spacing: 4.5px;
          text-transform: uppercase;
        }

        /* Vignette */
        .ch-vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 50% 40%, transparent 45%, rgba(0,0,0,0.45) 100%);
          pointer-events: none;
          z-index: 24;
          border-radius: inherit;
        }

        /* Noise overlay */
        .ch-hero::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          opacity: 0.5;
          z-index: 25;
          pointer-events: none;
          border-radius: inherit;
        }

        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>

      {/* ── Background Bokeh ── */}
      <div className="ch-bokeh" style={{ width: 130, height: 130, background: '#dc2626', top: '8%', left: '2%' }} />
      <div className="ch-bokeh" style={{ width: 90, height: 90, background: '#2563eb', top: '55%', right: '-2%', animationDelay: '2.5s' }} />
      <div className="ch-bokeh" style={{ width: 110, height: 110, background: '#059669', bottom: '12%', left: '5%', animationDelay: '5s' }} />
      <div className="ch-bokeh" style={{ width: 70, height: 70, background: '#f59e0b', top: '25%', right: '8%', animationDelay: '1.2s' }} />
      <div className="ch-bokeh" style={{ width: 95, height: 95, background: '#7c3aed', bottom: '28%', right: '10%', animationDelay: '3.8s' }} />

      {/* ── God Rays Container ── */}
      <div ref={raysRef} style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }} />

      {/* ── Star Halo ── */}
      <div className="ch-star-halo" />

      {/* ── The 64px Star ── */}
      <div className="ch-star-wrap">
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="#fbbf24"
          style={{ filter: 'drop-shadow(0 0 14px rgba(251,191,36,0.95)) drop-shadow(0 0 40px rgba(251,191,36,0.35))' }}
        >
          <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" />
        </svg>
      </div>

      {/* ── 7-Layer SVG Tree ── */}
      <div className="ch-tree-wrap">
        <svg width="240" height="280" viewBox="0 0 240 280" aria-label="Christmas Tree">
          <defs>
            <linearGradient id="ch-tg1" x1="25%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%" stopColor="#4ade80" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#16a34a" />
            </linearGradient>
            <linearGradient id="ch-tg2" x1="25%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>
            <linearGradient id="ch-tg3" x1="25%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%" stopColor="#16a34a" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#14532d" />
            </linearGradient>
            <linearGradient id="ch-gEdge" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(251,191,36,0)" />
              <stop offset="55%" stopColor="rgba(251,191,36,0.15)" />
              <stop offset="85%" stopColor="rgba(251,191,36,0.4)" />
              <stop offset="100%" stopColor="rgba(251,191,36,0.55)" />
            </linearGradient>
            <linearGradient id="ch-trunk" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b1508" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
            <filter id="ch-tShadow" x="-15%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="0" dy="5" stdDeviation="10" floodColor="#000000" floodOpacity="0.3" />
            </filter>
          </defs>

          <g filter="url(#ch-tShadow)">
            {/* Layer 7: Bottom Wide */}
            <path d="M120 195 Q18 221,18 248 L222 248 Q222 221,120 195Z" fill="url(#ch-tg3)" />
            <path d="M120 195 Q18 221,18 248 L222 248 Q222 221,120 195Z" fill="none" stroke="url(#ch-gEdge)" strokeWidth="1.5" />
            {/* Layer 6: Bottom */}
            <path d="M120 165 Q34 191,34 218 L206 218 Q206 191,120 165Z" fill="url(#ch-tg3)" />
            <path d="M120 165 Q34 191,34 218 L206 218 Q206 191,120 165Z" fill="none" stroke="url(#ch-gEdge)" strokeWidth="1.4" />
            {/* Layer 5: Lower Mid */}
            <path d="M120 138 Q46 163,46 188 L194 188 Q194 163,120 138Z" fill="url(#ch-tg2)" />
            <path d="M120 138 Q46 163,46 188 L194 188 Q194 163,120 138Z" fill="none" stroke="url(#ch-gEdge)" strokeWidth="1.3" />
            {/* Layer 4: Mid */}
            <path d="M120 110 Q60 134,60 158 L180 158 Q180 134,120 110Z" fill="url(#ch-tg2)" />
            <path d="M120 110 Q60 134,60 158 L180 158 Q180 134,120 110Z" fill="none" stroke="url(#ch-gEdge)" strokeWidth="1.2" />
            {/* Layer 3: Upper Mid */}
            <path d="M120 82 Q74 105,74 128 L166 128 Q166 105,120 82Z" fill="url(#ch-tg1)" />
            <path d="M120 82 Q74 105,74 128 L166 128 Q166 105,120 82Z" fill="none" stroke="url(#ch-gEdge)" strokeWidth="1.1" />
            {/* Layer 2: Upper */}
            <path d="M120 55 Q88 76,88 98 L152 98 Q152 76,120 55Z" fill="url(#ch-tg1)" />
            <path d="M120 55 Q88 76,88 98 L152 98 Q152 76,120 55Z" fill="none" stroke="url(#ch-gEdge)" strokeWidth="1" />
            {/* Layer 1: Top Branch */}
            <path d="M120 28 Q102 48,102 68 L138 68 Q138 48,120 28Z" fill="url(#ch-tg1)" />
            <path d="M120 28 Q102 48,102 68 L138 68 Q138 48,120 28Z" fill="none" stroke="url(#ch-gEdge)" strokeWidth="0.8" />
          </g>

          {/* Trunk */}
          <rect x="100" y="244" width="40" height="30" rx="3" fill="url(#ch-trunk)" />
        </svg>
      </div>

      {/* ── Lights Container ── */}
      <div ref={lightsRef} style={{ position: 'absolute', inset: 0, zIndex: 15, pointerEvents: 'none' }} />

      {/* ── Ornaments ── */}
      <div
        className="ch-ornament"
        style={{
          top: '44%', left: '34%', width: 11, height: 11,
          background: 'radial-gradient(circle at 35% 30%, #ff8080, #dc2626, #7f1d1d)',
          boxShadow: '0 3px 10px rgba(220,38,38,0.65)',
        }}
      />
      <div
        className="ch-ornament"
        style={{
          top: '36%', left: '59%', width: 10, height: 10,
          background: 'radial-gradient(circle at 35% 30%, #fde68a, #f59e0b, #92400e)',
          boxShadow: '0 3px 10px rgba(245,158,11,0.65)',
        }}
      />
      <div
        className="ch-ornament"
        style={{
          top: '56%', left: '54%', width: 10, height: 10,
          background: 'radial-gradient(circle at 35% 30%, #93c5fd, #3b82f6, #1e3a8a)',
          boxShadow: '0 3px 10px rgba(59,130,246,0.65)',
        }}
      />
      <div
        className="ch-ornament"
        style={{
          top: '64%', left: '30%', width: 9, height: 9,
          background: 'radial-gradient(circle at 35% 30%, #c4b5fd, #8b5cf6, #4c1d95)',
          boxShadow: '0 3px 10px rgba(139,92,246,0.6)',
        }}
      />

      {/* ── Sparkles Container ── */}
      <div ref={sparkleRef} style={{ position: 'absolute', inset: 0, zIndex: 19, pointerEvents: 'none' }} />

      {/* ── Snow Container ── */}
      <div ref={snowRef} style={{ position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none', overflow: 'hidden', borderRadius: 'inherit' }} />

      {/* ── Ground Snow ── */}
      <div className="ch-ground-glow" />
      <div className="ch-ground-surface" />

      {/* ── Gift Boxes ── */}
      {/* Left: Red */}
      <div className="ch-gift" style={{ bottom: 80, left: 72, width: 38, height: 32, background: 'linear-gradient(145deg,#f87171,#dc2626)', boxShadow: '0 4px 14px rgba(220,38,38,0.4)' }}>
        <div className="ch-gift-lid" style={{ background: 'linear-gradient(145deg,#fca5a5,#ef4444)' }} />
        <div className="ch-gift-ribbon-v" />
        <div className="ch-gift-ribbon-h" />
        <div className="ch-gift-bow" />
      </div>
      {/* Center: Emerald */}
      <div className="ch-gift" style={{ bottom: 74, left: '50%', transform: 'translateX(-50%)', width: 42, height: 38, background: 'linear-gradient(145deg,#34d399,#059669)', boxShadow: '0 4px 14px rgba(5,150,105,0.4)' }}>
        <div className="ch-gift-lid" style={{ background: 'linear-gradient(145deg,#6ee7b7,#10b981)' }} />
        <div className="ch-gift-ribbon-v" />
        <div className="ch-gift-ribbon-h" />
        <div className="ch-gift-bow" />
      </div>
      {/* Right: Blue */}
      <div className="ch-gift" style={{ bottom: 80, right: 72, width: 35, height: 30, background: 'linear-gradient(145deg,#60a5fa,#2563eb)', boxShadow: '0 4px 14px rgba(37,99,235,0.4)' }}>
        <div className="ch-gift-lid" style={{ background: 'linear-gradient(145deg,#93c5fd,#3b82f6)' }} />
        <div className="ch-gift-ribbon-v" />
        <div className="ch-gift-ribbon-h" />
        <div className="ch-gift-bow" />
      </div>

      {/* ── Text Section ── */}
      <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', zIndex: 22, width: '90%' }}>
        <h1 className="ch-title">Merry Christmas</h1>
        <div className="ch-divider" />
        <p className="ch-subtitle">Warm Wishes from Saanify</p>
      </div>

      {/* ── Vignette ── */}
      <div className="ch-vignette" />
    </div>
  );
}
