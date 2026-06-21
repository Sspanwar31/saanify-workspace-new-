'use client';

import { useEffect, useRef, useCallback } from 'react';

function sr(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export default function FloatingTempleLamps() {
  const containerRef = useRef<HTMLDivElement>(null);

  const lamps = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: sr(i * 7 + 3) * 90 + 5,
    bottom: 1 + sr(i * 13 + 5) * 22,             // ✅ bottom 23% only
    size: 3 + sr(i * 17 + 11) * 10,
    floatDur: 5 + sr(i * 23 + 7) * 8,
    floatDist: 3 + sr(i * 29 + 13) * 10,          // ✅ less float
    glowDur: 2.5 + sr(i * 31 + 17) * 4,
    breatheDur: 3 + sr(i * 37 + 19) * 5,
    hue: -20 + sr(i * 41 + 23) * 35,
    driftX: (sr(i * 43 + 29) - 0.5) * 10,
    driftDur: 4 + sr(i * 71 + 53) * 7,
    delay: sr(i * 47 + 31) * 10,
    layer: Math.floor(sr(i * 53 + 37) * 3),
    flickerDur: 0.4 + sr(i * 59 + 41) * 1.5,
    baseOpacity: 0.3 + sr(i * 73 + 59) * 0.5,
    sparkles: Array.from(
      { length: 1 + Math.floor(sr(i * 79 + 61) * 3) },
      (_, j) => ({
        angle: sr(i * 83 + j * 97 + 67) * Math.PI * 2,
        dist: 0.6 + sr(i * 89 + j * 101 + 71) * 1.2,
        size: 0.8 + sr(i * 97 + j * 103 + 79) * 1.5,
        dur: 1.5 + sr(i * 107 + j * 109 + 83) * 3,
        delay: sr(i * 113 + j * 127 + 89) * 3,
      })
    ),
  }));

  const embers = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    left: sr(i * 131 + 151) * 100,
    size: 1 + sr(i * 137 + 157) * 2,
    dur: 5 + sr(i * 139 + 163) * 7,
    delay: sr(i * 149 + 167) * 10,
    driftX: (sr(i * 151 + 173) - 0.5) * 15,
    maxOpacity: 0.12 + sr(i * 157 + 179) * 0.25,
  }));

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    containerRef.current.style.setProperty('--mx', String(x));
    containerRef.current.style.setProperty('--my', String(y));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('mousemove', handleMouseMove);
    return () => el.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  const layerPS = [3, 7, 14];
  const layerBlur = [1.2, 0.4, 0];

  return (
    <>
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-hidden pointer-events-none select-none"
        style={
          {
            '--mx': '0',
            '--my': '0',
            // ✅ CSS mask — sirf is layer ke andar ke elements fade honge,
            //    baaki sab content (greeting card) bilkul unaffected
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 50%, black 78%)',
            maskImage: 'linear-gradient(to bottom, transparent 50%, black 78%)',
          } as React.CSSProperties
        }
      >
        {/* ❌ TOP FADE MASK HATA DIYA — ye card hide kar raha tha */}

        {/* Atmosphere glow — bottom only */}
        <div
          className="absolute bottom-0 left-1/2 pointer-events-none"
          style={{
            width: '120%',
            height: '32%',
            transform: 'translateX(-50%)',
            background:
              'radial-gradient(ellipse at 50% 100%, rgba(255,155,35,0.18) 0%, rgba(255,95,15,0.05) 50%, transparent 75%)',
            filter: 'blur(35px)',
            animation: 'atmosPulse 9s ease-in-out infinite',
          }}
        />
        <div
          className="absolute bottom-0 left-[30%] pointer-events-none"
          style={{
            width: '40%',
            height: '22%',
            background:
              'radial-gradient(ellipse, rgba(255,115,15,0.08) 0%, transparent 65%)',
            filter: 'blur(40px)',
            animation: 'atmosPulse 12s ease-in-out 4s infinite',
          }}
        />

        {/* ══════ LAMPS ══════ */}
        {lamps.map((l) => {
          const ps = layerPS[l.layer];
          const blur = layerBlur[l.layer];
          return (
            <div
              key={l.id}
              className="absolute pointer-events-none"
              style={{
                left: `${l.left}%`,
                bottom: `${l.bottom}%`,
                transform: `translate(
                  calc(var(--mx, 0) * ${ps}px),
                  calc(var(--my, 0) * ${-ps}px)
                )`,
                transition: 'transform 1.2s cubic-bezier(0.23, 1, 0.32, 1)',
                zIndex: l.layer,
                opacity: l.baseOpacity,
                filter: blur > 0 ? `blur(${blur}px)` : 'none',
              }}
            >
              <div
                style={
                  {
                    animation: `lampDrift ${l.driftDur}s ease-in-out ${l.delay}s infinite`,
                    '--drift-x': `${l.driftX}px`,
                  } as React.CSSProperties
                }
              >
                <div
                  className="relative"
                  style={
                    {
                      width: `${l.size}px`,
                      height: `${l.size}px`,
                      animation: [
                        `lampFloat ${l.floatDur}s ease-in-out ${l.delay}s infinite`,
                        `lampBreathe ${l.breatheDur}s ease-in-out ${l.delay + 0.5}s infinite`,
                        `lampFlicker ${l.flickerDur}s steps(2, end) infinite`,
                      ].join(', '),
                      '--float-dist': `${l.floatDist}px`,
                    } as React.CSSProperties
                  }
                >
                  {/* Core */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `radial-gradient(circle at 36% 36%,
                        #fffde7 0%,
                        #ffe08a 16%,
                        #ffb347 40%,
                        rgba(255,140,0,0.12) 70%,
                        transparent 100%)`,
                      filter: `hue-rotate(${l.hue}deg)`,
                    }}
                  />

                  {/* Hot-spot */}
                  <div
                    className="absolute rounded-full"
                    style={{
                      width: '30%',
                      height: '30%',
                      top: '20%',
                      left: '22%',
                      background:
                        'radial-gradient(circle, rgba(255,255,240,0.85) 0%, rgba(255,240,180,0.2) 60%, transparent 100%)',
                      filter: `blur(${Math.max(0.3, l.size * 0.05)}px)`,
                    }}
                  />

                  {/* Inner glow */}
                  <div
                    className="absolute rounded-full"
                    style={{
                      inset: '-50%',
                      background: `radial-gradient(circle,
                        rgba(255,195,65,0.4) 0%,
                        rgba(255,140,0,0.1) 55%,
                        transparent 80%)`,
                      filter: `blur(${Math.max(1, l.size * 0.22)}px) hue-rotate(${l.hue}deg)`,
                      animation: `glowPulse ${l.glowDur}s ease-in-out ${l.delay}s infinite`,
                    }}
                  />

                  {/* Outer glow */}
                  <div
                    className="absolute rounded-full"
                    style={{
                      inset: '-120%',
                      background: `radial-gradient(circle,
                        rgba(255,145,25,0.08) 0%,
                        rgba(255,95,0,0.02) 45%,
                        transparent 60%)`,
                      filter: `blur(${Math.max(1.5, l.size * 0.3)}px) hue-rotate(${l.hue}deg)`,
                      animation: `glowPulse ${l.glowDur * 1.5}s ease-in-out ${l.delay + 0.9}s infinite`,
                    }}
                  />

                  {/* Ring — only on bigger lamps */}
                  {l.size > 8 && (
                    <div
                      className="absolute rounded-full"
                      style={{
                        inset: '-30%',
                        border: '1px solid rgba(255,200,80,0.1)',
                        animation: `ringPulse ${l.floatDur * 0.7}s ease-out ${l.delay + 2}s infinite`,
                      }}
                    />
                  )}

                  {/* Sparkles */}
                  {l.sparkles.map((s, j) => (
                    <div
                      key={j}
                      className="absolute rounded-full"
                      style={{
                        width: `${s.size}px`,
                        height: `${s.size}px`,
                        left: `${50 + Math.cos(s.angle) * s.dist * 50}%`,
                        top: `${50 + Math.sin(s.angle) * s.dist * 50}%`,
                        background: 'radial-gradient(circle, #fff8e1, #ffe08a)',
                        boxShadow: '0 0 2px rgba(255,200,80,0.8)',
                        animation: `sparkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {/* ══════ EMBERS ══════ */}
        {embers.map((e) => (
          <div
            key={`em-${e.id}`}
            className="absolute pointer-events-none rounded-full"
            style={
              {
                left: `${e.left}%`,
                bottom: '-2%',
                width: `${e.size}px`,
                height: `${e.size}px`,
                background:
                  'radial-gradient(circle, #ffcc02, rgba(255,140,0,0.4))',
                boxShadow: '0 0 3px rgba(255,160,30,0.4)',
                animation: `emberRise ${e.dur}s ease-out ${e.delay}s infinite`,
                '--ember-drift': `${e.driftX}px`,
                '--ember-peak': `${e.maxOpacity}`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes lampFloat {
          0%, 100% { translate: 0 0; }
          15%  { translate: 0 calc(var(--float-dist, 15px) * -0.3); }
          35%  { translate: 0 calc(var(--float-dist, 15px) * -0.85); }
          55%  { translate: 0 calc(var(--float-dist, 15px) * -1); }
          75%  { translate: 0 calc(var(--float-dist, 15px) * -0.55); }
          90%  { translate: 0 calc(var(--float-dist, 15px) * -0.15); }
        }

        @keyframes lampDrift {
          0%, 100% { translate: 0 0; }
          25%  { translate: calc(var(--drift-x, 8px) * 0.7) 0; }
          50%  { translate: calc(var(--drift-x, 8px) * -0.3) 0; }
          75%  { translate: calc(var(--drift-x, 8px) * -0.8) 0; }
          90%  { translate: calc(var(--drift-x, 8px) * 0.15) 0; }
        }

        @keyframes lampBreathe {
          0%, 100% { scale: 1; }
          50%      { scale: 1.15; }
        }

        @keyframes lampFlicker {
          0%   { opacity: 1; }
          12%  { opacity: 0.78; }
          18%  { opacity: 1; }
          30%  { opacity: 0.88; }
          35%  { opacity: 1; }
          48%  { opacity: 0.82; }
          52%  { opacity: 1; }
          63%  { opacity: 0.9; }
          67%  { opacity: 1; }
          78%  { opacity: 0.84; }
          82%  { opacity: 1; }
          91%  { opacity: 0.87; }
          95%  { opacity: 1; }
        }

        @keyframes glowPulse {
          0%, 100% { opacity: 0.6; scale: 1; }
          50%      { opacity: 1; scale: 1.2; }
        }

        @keyframes ringPulse {
          0%   { transform: scale(1); opacity: 0.3; }
          100% { transform: scale(3.5); opacity: 0; }
        }

        @keyframes sparkle {
          0%, 100% { opacity: 0; scale: 0; }
          20%  { opacity: 1; scale: 1.2; }
          50%  { opacity: 0.7; scale: 0.8; }
          75%  { opacity: 0.2; scale: 0.3; }
        }

        @keyframes atmosPulse {
          0%, 100% { opacity: 0.65; transform: translateX(-50%) scale(1); }
          50%      { opacity: 1; transform: translateX(-50%) scale(1.05); }
        }

        @keyframes emberRise {
          0% {
            translate: 0 0;
            opacity: 0;
            scale: 0.4;
          }
          8% {
            opacity: var(--ember-peak, 0.3);
            scale: 1;
          }
          35% {
            opacity: calc(var(--ember-peak, 0.3) * 0.7);
            translate: calc(var(--ember-drift, 0px) * 0.4) -100px;
          }
          65% {
            opacity: calc(var(--ember-peak, 0.3) * 0.3);
            translate: calc(var(--ember-drift, 0px) * 0.7) -160px;
            scale: 0.5;
          }
          100% {
            opacity: 0;
            translate: var(--ember-drift, 0px) -220px;
            scale: 0;
          }
        }
      `}</style>
    </>
  );
}
