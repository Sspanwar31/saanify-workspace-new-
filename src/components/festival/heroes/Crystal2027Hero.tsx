'use client';

import React, { useState, useEffect } from 'react';

export default function Modern2027Hero() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 200);
    return () => clearTimeout(t);
  }, []);

  /* ── 12 rays at 30° intervals ── */
  const rays = [
    { a: 0,   l: 80,  w: 1.8, d: 0 },
    { a: 30,  l: 68,  w: 1.2, d: 0.06 },
    { a: 60,  l: 78,  w: 1.6, d: 0.12 },
    { a: 90,  l: 65,  w: 1.2, d: 0.04 },
    { a: 120, l: 76,  w: 1.5, d: 0.10 },
    { a: 150, l: 82,  w: 1.8, d: 0.14 },
    { a: 180, l: 80,  w: 1.8, d: 0.02 },
    { a: 210, l: 68,  w: 1.2, d: 0.08 },
    { a: 240, l: 78,  w: 1.6, d: 0.13 },
    { a: 270, l: 65,  w: 1.2, d: 0.05 },
    { a: 300, l: 76,  w: 1.5, d: 0.11 },
    { a: 330, l: 82,  w: 1.8, d: 0.15 },
  ];

  /* ── sparkle dots — positions calculated from ray tip geometry ── */
  const sparkles = [
    { top: '6%',  left: '50%', d: 0.65, s: 5 },
    { top: '19%', left: '75%', d: 0.72, s: 4 },
    { top: '42%', left: '79%', d: 0.68, s: 4 },
    { top: '61%', left: '70%', d: 0.75, s: 4 },
    { top: '78%', left: '50%', d: 0.70, s: 5 },
    { top: '65%', left: '25%', d: 0.73, s: 4 },
    { top: '42%', left: '21%', d: 0.67, s: 4 },
    { top: '23%', left: '30%', d: 0.76, s: 5 },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center w-[340px] h-[210px] select-none pointer-events-none overflow-visible">

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes rayGrow {
          0%   { transform: scaleY(0); opacity: 0; }
          45%  { opacity: 1; }
          100% { transform: scaleY(1); opacity: 0.4; }
        }
        @keyframes textIn {
          0%   { opacity: 0; transform: scale(0.82); filter: blur(12px); }
          55%  { filter: blur(0); }
          100% { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        @keyframes sweepOnce {
          0%   { transform: translateX(-160%); }
          100% { transform: translateX(160%); }
        }
        @keyframes divGrow {
          0%   { transform: scaleX(0); opacity: 0; }
          100% { transform: scaleX(1); opacity: 1; }
        }
        @keyframes sparklePop {
          0%, 100% { transform: scale(0); opacity: 0; }
          35%      { transform: scale(1.4); opacity: 1; }
          65%      { transform: scale(0.85); opacity: 0.7; }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.25; }
          50%      { opacity: 0.45; }
        }
      `}} />

      {/* ═══ background glow ═══ */}
      <div
        className="absolute w-[280px] h-[180px] rounded-full blur-[60px]"
        style={{
          top: '42%', left: '50%',
          transform: 'translate(-50%,-50%)',
          background: 'radial-gradient(circle, rgba(251,191,36,.14) 0%, transparent 70%)',
          opacity: 0,
          animation: show ? 'glowPulse 3.5s ease-in-out 0.3s infinite' : 'none',
        }}
      />

      {/* ═══ burst rays ═══ */}
      <div
        className="absolute"
        style={{ top: '42%', left: '50%', transform: 'translate(-50%,-50%)' }}
      >
        {rays.map((r, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              width: r.w,
              height: r.l,
              left: -r.w / 2,
              bottom: 0,
              transformOrigin: 'center bottom',
              transform: `rotate(${r.a}deg)`,
            }}
          >
            <div
              className="w-full h-full rounded-full"
              style={{
                background:
                  'linear-gradient(to top, rgba(255,215,0,.9), rgba(255,250,205,.45) 35%, transparent)',
                transform: 'scaleY(0)',
                opacity: 0,
                animation: show
                  ? `rayGrow 0.85s cubic-bezier(.16,1,.3,1) ${r.d}s forwards`
                  : 'none',
              }}
            />
          </div>
        ))}
      </div>

      {/* ═══ sparkle dots at ray tips ═══ */}
      {sparkles.map((sp, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white z-20"
          style={{
            top: sp.top,
            left: sp.left,
            width: sp.s,
            height: sp.s,
            boxShadow: `0 0 ${sp.s * 2.5}px rgba(255,215,0,.85), 0 0 ${sp.s * 6}px rgba(255,215,0,.3)`,
            opacity: 0,
            animation: show
              ? `sparklePop 0.7s ease-out ${sp.d}s forwards`
              : 'none',
          }}
        />
      ))}

      {/* ═══ 2027 text ═══ */}
      <div
        className="relative z-10"
        style={{
          opacity: 0,
          animation: show
            ? 'textIn 1s cubic-bezier(.16,1,.3,1) 0.28s forwards'
            : 'none',
        }}
      >
        <span
          className="text-[110px] font-black tracking-[-0.04em] leading-none block relative"
          style={{
            background:
              'linear-gradient(155deg, #FFFACD 0%, #FFD700 28%, #FFFFFF 50%, #FFD700 72%, #FFFACD 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter:
              'drop-shadow(0 0 28px rgba(251,191,36,.3)) drop-shadow(0 2px 4px rgba(0,0,0,.5))',
          }}
        >
          2027
          {/* one-time light sweep */}
          <span
            className="absolute inset-0 overflow-hidden"
            style={{ pointerEvents: 'none' }}
          >
            <span
              className="absolute inset-0 block text-[110px] font-black tracking-[-0.04em] leading-none"
              style={{
                background:
                  'linear-gradient(90deg, transparent 15%, rgba(255,255,255,.3) 45%, rgba(255,255,255,.65) 50%, rgba(255,255,255,.3) 55%, transparent 85%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: show
                  ? 'sweepOnce 0.7s ease-in-out 1.15s 1 forwards'
                  : 'none',
              }}
            >
              2027
            </span>
          </span>
        </span>
      </div>

      {/* ═══ divider ═══ */}
      <div
        className="relative z-10 mt-2.5 h-[1px] bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent origin-center"
        style={{
          width: '160px',
          transform: 'scaleX(0)',
          opacity: 0,
          animation: show
            ? 'divGrow 0.6s ease-out 0.85s forwards'
            : 'none',
        }}
      />
    </div>
  );
}
