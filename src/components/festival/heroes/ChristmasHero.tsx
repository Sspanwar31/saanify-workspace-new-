'use client';

import { useEffect, useRef } from 'react';

export default function ChristmasHero() {
  const starRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  const dynRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    /* ═══════ STAR — Float + Glow Pulse ═══════ */
    starRef.current?.animate(
      [
        {
          transform: 'translateX(-50%) translateY(0px) scale(1)',
          filter:
            'drop-shadow(0 0 16px rgba(251,191,36,1)) drop-shadow(0 0 50px rgba(251,191,36,0.5))',
        },
        {
          transform: 'translateX(-50%) translateY(-10px) scale(1.12)',
          filter:
            'drop-shadow(0 0 28px rgba(251,191,36,1)) drop-shadow(0 0 75px rgba(251,191,36,0.7))',
        },
        {
          transform: 'translateX(-50%) translateY(0px) scale(1)',
          filter:
            'drop-shadow(0 0 16px rgba(251,191,36,1)) drop-shadow(0 0 50px rgba(251,191,36,0.5))',
        },
      ],
      { duration: 3500, iterations: Infinity, easing: 'ease-in-out' }
    );

    /* ═══════ HALO — Scale Pulse ═══════ */
    haloRef.current?.animate(
      [
        { transform: 'translate(-50%,-50%) scale(1)', opacity: 0.55 },
        { transform: 'translate(-50%,-50%) scale(1.4)', opacity: 1 },
        { transform: 'translate(-50%,-50%) scale(1)', opacity: 0.55 },
      ],
      { duration: 3000, iterations: Infinity, easing: 'ease-in-out' }
    );

    /* ═══════ TREE — Breathe ═══════ */
    treeRef.current?.animate(
      [
        { transform: 'translateX(-50%) scale(1)' },
        { transform: 'translateX(-50%) scale(1.035)' },
        { transform: 'translateX(-50%) scale(1)' },
      ],
      { duration: 4000, iterations: Infinity, easing: 'ease-in-out' }
    );

    if (!dynRef.current) return;

    /* ═══════ GOD RAYS — 7 beams ═══════ */
    const rayCfg = [
      { a: -32, w: 22, h: 180, del: 0 },
      { a: -20, w: 16, h: 230, del: 700 },
      { a: -9, w: 28, h: 260, del: 1400 },
      { a: 0, w: 34, h: 280, del: 2100 },
      { a: 9, w: 28, h: 260, del: 2800 },
      { a: 20, w: 16, h: 230, del: 3500 },
      { a: 32, w: 22, h: 180, del: 4200 },
    ];
    rayCfg.forEach((r) => {
      const el = document.createElement('div');
      el.style.cssText = `position:absolute;top:52px;left:calc(50% - ${r.w / 2}px);width:${r.w}px;height:${r.h}px;clip-path:polygon(50% 0%,15% 100%,85% 100%);background:linear-gradient(to bottom,rgba(251,191,36,0.22),rgba(251,191,36,0.03) 60%,transparent);transform-origin:top center;transform:rotate(${r.a}deg);pointer-events:none;`;
      dynRef.current!.appendChild(el);
      el.animate(
        [{ opacity: 0.35 }, { opacity: 1 }, { opacity: 0.35 }],
        {
          duration: 5000,
          iterations: Infinity,
          easing: 'ease-in-out',
          delay: r.del,
        }
      );
    });

    /* ═══════ 25 BLINKING LIGHTS — Real Christmas Bulbs ═══════ */
    const C: Record<string, { bg: string; g: string }> = {
      red: { bg: '#ef4444', g: 'rgba(239,68,68,' },
      blue: { bg: '#3b82f6', g: 'rgba(59,130,246,' },
      gold: { bg: '#fbbf24', g: 'rgba(251,191,36,' },
      green: { bg: '#22c55e', g: 'rgba(34,197,94,' },
      purple: { bg: '#a855f7', g: 'rgba(168,85,247,' },
    };
    const L = [
      { t: 22, l: 48, c: 'red', s: 6, d: 1400, dl: 0 },
      { t: 25, l: 53, c: 'gold', s: 5, d: 2100, dl: 300 },
      { t: 30, l: 42, c: 'blue', s: 6, d: 1900, dl: 600 },
      { t: 33, l: 56, c: 'green', s: 5, d: 2700, dl: 100 },
      { t: 28, l: 50, c: 'purple', s: 5, d: 3300, dl: 800 },
      { t: 36, l: 38, c: 'gold', s: 7, d: 1600, dl: 200 },
      { t: 39, l: 51, c: 'red', s: 6, d: 2300, dl: 900 },
      { t: 37, l: 61, c: 'blue', s: 5, d: 1800, dl: 400 },
      { t: 44, l: 34, c: 'green', s: 7, d: 2500, dl: 500 },
      { t: 46, l: 46, c: 'purple', s: 7, d: 3100, dl: 150 },
      { t: 48, l: 58, c: 'gold', s: 6, d: 1500, dl: 850 },
      { t: 43, l: 66, c: 'red', s: 5, d: 2900, dl: 350 },
      { t: 52, l: 30, c: 'blue', s: 7, d: 2000, dl: 700 },
      { t: 54, l: 43, c: 'gold', s: 7, d: 1700, dl: 250 },
      { t: 56, l: 57, c: 'green', s: 6, d: 3400, dl: 550 },
      { t: 51, l: 68, c: 'red', s: 5, d: 2200, dl: 750 },
      { t: 60, l: 26, c: 'purple', s: 7, d: 2800, dl: 100 },
      { t: 58, l: 40, c: 'red', s: 7, d: 1300, dl: 600 },
      { t: 62, l: 52, c: 'blue', s: 6, d: 2600, dl: 300 },
      { t: 59, l: 64, c: 'gold', s: 6, d: 1900, dl: 900 },
      { t: 61, l: 74, c: 'green', s: 5, d: 3000, dl: 450 },
      { t: 68, l: 22, c: 'gold', s: 7, d: 2400, dl: 700 },
      { t: 70, l: 37, c: 'purple', s: 7, d: 1600, dl: 200 },
      { t: 67, l: 51, c: 'red', s: 6, d: 3200, dl: 500 },
      { t: 72, l: 65, c: 'blue', s: 5, d: 2100, dl: 800 },
    ];
    L.forEach((li) => {
      const col = C[li.c];
      const el = document.createElement('div');
      /* Double-layer glow: close bright + far ambient — like real bulbs */
      const g1 = li.s * 3;
      const g2 = li.s * 6;
      el.style.cssText = `position:absolute;top:${li.t}%;left:${li.l}%;width:${li.s}px;height:${li.s}px;border-radius:50%;background:${col.bg};box-shadow:0 0 ${g1}px ${g1 * 0.8}px ${col.g}0.7),0 0 ${g2}px ${g2 * 0.6}px ${col.g}0.2);transform:translate(-50%,-50%);pointer-events:none;`;
      dynRef.current!.appendChild(el);
      el.animate(
        [
          { opacity: 1, transform: 'translate(-50%,-50%) scale(1)' },
          { opacity: 0.06, transform: 'translate(-50%,-50%) scale(0.25)' },
          { opacity: 1, transform: 'translate(-50%,-50%) scale(1.2)' },
        ],
        {
          duration: li.d,
          iterations: Infinity,
          easing: 'ease-in-out',
          delay: li.dl,
        }
      );
    });

    /* ═══════ SPARKLES around star ═══════ */
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.5;
      const radius = 28 + Math.random() * 38;
      const x = 50 + Math.cos(angle) * (radius / 3);
      const y = 14 + Math.sin(angle) * (radius / 5);
      const el = document.createElement('div');
      const sz = 2 + Math.random() * 2.5;
      el.style.cssText = `position:absolute;left:${x}%;top:${y}%;width:${sz}px;height:${sz}px;border-radius:50%;background:#fbbf24;pointer-events:none;box-shadow:0 0 8px 3px rgba(251,191,36,0.7);`;
      dynRef.current!.appendChild(el);
      el.animate(
        [
          { opacity: 0, transform: 'scale(0) rotate(0deg)' },
          { opacity: 1, transform: 'scale(1.6) rotate(180deg)' },
          { opacity: 0, transform: 'scale(0) rotate(360deg)' },
        ],
        {
          duration: (2000 + Math.random() * 3000),
          iterations: Infinity,
          easing: 'ease-in-out',
          delay: Math.random() * 4000,
        }
      );
    }

    /* ═══════ SNOWFLAKES ═══════ */
    for (let i = 0; i < 20; i++) {
      const size = 1.5 + Math.random() * 3;
      const left = Math.random() * 100;
      const fd = 6000 + Math.random() * 8000;
      const fsd = Math.random() * 10000;
      const sdx = -30 + Math.random() * 60;
      const sop = 0.3 + Math.random() * 0.5;
      const el = document.createElement('div');
      el.style.cssText = `position:absolute;left:${left}%;width:${size}px;height:${size}px;border-radius:50%;background:white;pointer-events:none;`;
      dynRef.current!.appendChild(el);
      el.animate(
        [
          { transform: 'translateY(-10px) translateX(0px)', opacity: 0 },
          {
            transform: `translateY(40px) translateX(${sdx * 0.4}px)`,
            opacity: sop,
            offset: 0.1,
          },
          {
            transform: `translateY(180px) translateX(${sdx}px)`,
            opacity: sop,
            offset: 0.5,
          },
          {
            transform: `translateY(370px) translateX(${sdx * 0.5}px)`,
            opacity: 0,
          },
        ],
        {
          duration: fd,
          iterations: Infinity,
          easing: 'linear',
          delay: fsd,
        }
      );
    }
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: 300,
        height: 360,
        background: 'transparent',
      }}
    >
      {/* ── Star Halo ── */}
      <div
        ref={haloRef}
        style={{
          position: 'absolute',
          top: 50,
          left: '50%',
          width: 120,
          height: 120,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(251,191,36,0.28) 0%, rgba(251,191,36,0.06) 45%, transparent 70%)',
          transform: 'translate(-50%,-50%)',
          pointerEvents: 'none',
          zIndex: 21,
        }}
      />

      {/* ── The 64px Star ── */}
      <div
        ref={starRef}
        style={{
          position: 'absolute',
          top: 18,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 22,
          pointerEvents: 'none',
          filter:
            'drop-shadow(0 0 16px rgba(251,191,36,1)) drop-shadow(0 0 50px rgba(251,191,36,0.5))',
        }}
      >
        <svg width="64" height="64" viewBox="0 0 24 24" fill="#fbbf24">
          <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" />
        </svg>
      </div>

      {/* ── 7-Layer SVG Tree ── */}
      <div
        ref={treeRef}
        style={{
          position: 'absolute',
          top: 42,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <svg
          width="240"
          height="280"
          viewBox="0 0 240 280"
          aria-label="Christmas Tree"
        >
          <defs>
            <linearGradient
              id="ch-tg1"
              x1="25%"
              y1="0%"
              x2="85%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#4ade80" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#16a34a" />
            </linearGradient>
            <linearGradient
              id="ch-tg2"
              x1="25%"
              y1="0%"
              x2="85%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>
            <linearGradient
              id="ch-tg3"
              x1="25%"
              y1="0%"
              x2="85%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#16a34a" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#14532d" />
            </linearGradient>
            <linearGradient
              id="ch-gEdge"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="rgba(251,191,36,0)" />
              <stop offset="55%" stopColor="rgba(251,191,36,0.15)" />
              <stop offset="85%" stopColor="rgba(251,191,36,0.4)" />
              <stop offset="100%" stopColor="rgba(251,191,36,0.55)" />
            </linearGradient>
            <linearGradient
              id="ch-trunk"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#3b1508" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
            <filter
              id="ch-tShadow"
              x="-15%"
              y="-10%"
              width="130%"
              height="130%"
            >
              <feDropShadow
                dx="0"
                dy="5"
                stdDeviation="10"
                floodColor="#000000"
                floodOpacity="0.3"
              />
            </filter>
          </defs>

          <g filter="url(#ch-tShadow)">
            {/* Layer 7: Bottom Wide */}
            <path
              d="M120 195 Q18 221,18 248 L222 248 Q222 221,120 195Z"
              fill="url(#ch-tg3)"
            />
            <path
              d="M120 195 Q18 221,18 248 L222 248 Q222 221,120 195Z"
              fill="none"
              stroke="url(#ch-gEdge)"
              strokeWidth="1.5"
            />
            {/* Layer 6: Bottom */}
            <path
              d="M120 165 Q34 191,34 218 L206 218 Q206 191,120 165Z"
              fill="url(#ch-tg3)"
            />
            <path
              d="M120 165 Q34 191,34 218 L206 218 Q206 191,120 165Z"
              fill="none"
              stroke="url(#ch-gEdge)"
              strokeWidth="1.4"
            />
            {/* Layer 5: Lower Mid */}
            <path
              d="M120 138 Q46 163,46 188 L194 188 Q194 163,120 138Z"
              fill="url(#ch-tg2)"
            />
            <path
              d="M120 138 Q46 163,46 188 L194 188 Q194 163,120 138Z"
              fill="none"
              stroke="url(#ch-gEdge)"
              strokeWidth="1.3"
            />
            {/* Layer 4: Mid */}
            <path
              d="M120 110 Q60 134,60 158 L180 158 Q180 134,120 110Z"
              fill="url(#ch-tg2)"
            />
            <path
              d="M120 110 Q60 134,60 158 L180 158 Q180 134,120 110Z"
              fill="none"
              stroke="url(#ch-gEdge)"
              strokeWidth="1.2"
            />
            {/* Layer 3: Upper Mid */}
            <path
              d="M120 82 Q74 105,74 128 L166 128 Q166 105,120 82Z"
              fill="url(#ch-tg1)"
            />
            <path
              d="M120 82 Q74 105,74 128 L166 128 Q166 105,120 82Z"
              fill="none"
              stroke="url(#ch-gEdge)"
              strokeWidth="1.1"
            />
            {/* Layer 2: Upper */}
            <path
              d="M120 55 Q88 76,88 98 L152 98 Q152 76,120 55Z"
              fill="url(#ch-tg1)"
            />
            <path
              d="M120 55 Q88 76,88 98 L152 98 Q152 76,120 55Z"
              fill="none"
              stroke="url(#ch-gEdge)"
              strokeWidth="1"
            />
            {/* Layer 1: Top Branch */}
            <path
              d="M120 28 Q102 48,102 68 L138 68 Q138 48,120 28Z"
              fill="url(#ch-tg1)"
            />
            <path
              d="M120 28 Q102 48,102 68 L138 68 Q138 48,120 28Z"
              fill="none"
              stroke="url(#ch-gEdge)"
              strokeWidth="0.8"
            />
          </g>

          {/* Trunk */}
          <rect
            x="100"
            y="244"
            width="40"
            height="30"
            rx="3"
            fill="url(#ch-trunk)"
          />
        </svg>
      </div>

      {/* ── 4 Ornaments ── */}
      <div
        style={{
          position: 'absolute',
          top: '46%',
          left: '40%',
          width: 12,
          height: 12,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.3)',
          background:
            'radial-gradient(circle at 35% 30%, #ff8080, #ef4444, #7f1d1d)',
          boxShadow: '0 3px 14px rgba(239,68,68,0.75)',
          transform: 'translate(-50%,-50%)',
          pointerEvents: 'none',
          zIndex: 16,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '38%',
          left: '58%',
          width: 11,
          height: 11,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.3)',
          background:
            'radial-gradient(circle at 35% 30%, #fde68a, #f59e0b, #92400e)',
          boxShadow: '0 3px 14px rgba(245,158,11,0.75)',
          transform: 'translate(-50%,-50%)',
          pointerEvents: 'none',
          zIndex: 16,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '53%',
          left: '53%',
          width: 11,
          height: 11,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.3)',
          background:
            'radial-gradient(circle at 35% 30%, #93c5fd, #3b82f6, #1e3a8a)',
          boxShadow: '0 3px 14px rgba(59,130,246,0.75)',
          transform: 'translate(-50%,-50%)',
          pointerEvents: 'none',
          zIndex: 16,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '61%',
          left: '33%',
          width: 10,
          height: 10,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.3)',
          background:
            'radial-gradient(circle at 35% 30%, #d8b4fe, #a855f7, #581c87)',
          boxShadow: '0 3px 14px rgba(168,85,247,0.7)',
          transform: 'translate(-50%,-50%)',
          pointerEvents: 'none',
          zIndex: 16,
        }}
      />

      {/* ── Dynamic Container: Rays + Lights + Sparkles + Snow ── */}
      <div
        ref={dynRef}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 15,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      />
    </div>
  );
}
