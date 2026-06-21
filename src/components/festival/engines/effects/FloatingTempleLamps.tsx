'use client';

import { useEffect, useRef, useCallback } from 'react';

// Deterministic random — har render pe same positions, no flicker
function sr(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export default function FloatingTempleLamps() {
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Lamp Data Generation ── */
  const lamps = Array.from({ length: 26 }, (_, i) => ({
    id: i,
    left: sr(i * 7 + 3) * 94 + 3,
    bottom: 2 + sr(i * 13 + 5) * 52,
    size: 6 + sr(i * 17 + 11) * 28,
    floatDur: 5 + sr(i * 23 + 7) * 10,
    floatDist: 8 + sr(i * 29 + 13) * 35,
    glowDur: 2.5 + sr(i * 31 + 17) * 5,
    breatheDur: 3 + sr(i * 37 + 19) * 7,
    hue: -20 + sr(i * 41 + 23) * 40,
    driftX: (sr(i * 43 + 29) - 0.5) * 25,
    driftDur: 4 + sr(i * 71 + 53) * 9,
    delay: sr(i * 47 + 31) * 10,
    layer: Math.floor(sr(i * 53 + 37) * 3),
    flickerDur: 0.4 + sr(i * 59 + 41) * 2,
    baseOpacity: 0.3 + sr(i * 73 + 59) * 0.7,
    sparkles: Array.from(
      { length: 2 + Math.floor(sr(i * 79 + 61) * 6) },
      (_, j) => ({
        angle: sr(i * 83 + j * 97 + 67) * Math.PI * 2,
        dist: 0.7 + sr(i * 89 + j * 101 + 71) * 1.8,
        size: 1 + sr(i * 97 + j * 103 + 79) * 2.5,
        dur: 1.5 + sr(i * 107 + j * 109 + 83) * 4,
        delay: sr(i * 113 + j * 127 + 89) * 3,
      })
    ),
  }));

  /* ── Rising Embers ── */
  const embers = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: sr(i * 131 + 151) * 100,
    size: 1.5 + sr(i * 137 + 157) * 3,
    dur: 7 + sr(i * 139 + 163) * 11,
    delay: sr(i * 149 + 167) * 14,
    driftX: (sr(i * 151 + 173) - 0.5) * 45,
    maxOpacity: 0.25 + sr(i * 157 + 179) * 0.55,
  }));

  /* ── Mouse Parallax ── */
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

  const layerPS = [5, 13, 24]; // parallax strength per layer
  const layerBlur = [1.8, 0.6, 0]; // depth-of-field blur

  return (
    <>
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-hidden pointer-events-none select-none"
        style={{ '--mx': '0', '--my': '0' } as React.CSSProperties}
      >
        {/* ══════ Atmospheric Base Glow ══════ */}
        <div
          className="absolute bottom-0 left-1/2 pointer-events-none"
          style={{
            width: '140%',
            height: '60%',
            transform: 'translateX(-50%)',
            background:
              'radial-gradient(ellipse at 50% 100%, rgba(255,155,35,0.22) 0%, rgba(255,95,15,0.07) 45%, transparent 72%)',
            filter: 'blur(55px)',
            animation: 'atmosPulse 9s ease-in-out infinite',
          }}
        />
        <div
          className="absolute bottom-[8%] left-[25%] pointer-events-none"
          style={{
            width: '55%',
            height: '45%',
            background:
              'radial-gradient(ellipse, rgba(255,115,15,0.09) 0%, transparent 65%)',
            filter: 'blur(65px)',
            animation: 'atmosPulse 12s ease-in-out 4s infinite',
          }}
        />
        <div
          className="absolute bottom-[15%] right-[15%] pointer-events-none"
          style={{
            width: '35%',
            height: '35%',
            background:
              'radial-gradient(ellipse, rgba(255,180,60,0.07) 0%, transparent 60%)',
            filter: 'blur(50px)',
            animation: 'atmosPulse 10s ease-in-out 2s infinite',
          }}
        />

        {/* ══════ LAMPS ══════ */}
        {lamps.map((l) => {
          const ps = layerPS[l.layer];
          const blur = layerBlur[l.layer];
          return (
            /* ── Layer 0: Parallax Wrapper ── */
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
              {/* ── Layer 1: X-Axis Drift ── */}
              <div
                style={
                  {
                    animation: `lampDrift ${l.driftDur}s ease-in-out ${l.delay}s infinite`,
                    '--drift-x': `${l.driftX}px`,
                  } as React.CSSProperties
                }
              >
                {/* ── Layer 2: Y-Float + Breathe + Flicker ── */}
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
                  {/* Core — main lamp body */}
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

                  {/* Hot-spot highlight */}
                  <div
                    className="absolute rounded-full"
                    style={{
                      width: '35%',
                      height: '35%',
                      top: '18%',
                      left: '20%',
                      background:
                        'radial-gradient(circle, rgba(255,255,240,0.9) 0%, rgba(255,240,180,0.3) 60%, transparent 100%)',
                      filter: `blur(${Math.max(0.5, l.size * 0.06)}px)`,
                    }}
                  />

                  {/* Inner glow ring */}
                  <div
                    className="absolute rounded-full"
                    style={{
                      inset: '-40%',
                      background: `radial-gradient(circle,
                        rgba(255,195,65,0.45) 0%,
                        rgba(255,140,0,0.12) 55%,
                        transparent 80%)`,
                      filter: `blur(${Math.max(1, l.size * 0.28)}px) hue-rotate(${l.hue}deg)`,
                      animation: `glowPulse ${l.glowDur}s ease-in-out ${l.delay}s infinite`,
                    }}
                  />

                  {/* Outer atmospheric glow */}
                  <div
                    className="absolute rounded-full"
                    style={{
                      inset: '-100%',
                      background: `radial-gradient(circle,
                        rgba(255,145,25,0.1) 0%,
                        rgba(255,95,0,0.03) 45%,
                        transparent 68%)`,
                      filter: `blur(${Math.max(2, l.size * 0.45)}px) hue-rotate(${l.hue}deg)`,
                      animation: `glowPulse ${l.glowDur * 1.5}s ease-in-out ${l.delay + 0.9}s infinite`,
                    }}
                  />

                  {/* Expanding light ring */}
                  <div
                    className="absolute rounded-full"
                    style={{
                      inset: '-25%',
                      border: '1px solid rgba(255,200,80,0.12)',
                      animation: `ringPulse ${l.floatDur * 0.7}s ease-out ${l.delay + 2}s infinite`,
                    }}
                  />

                  {/* Second ring — offset timing */}
                  <div
                    className="absolute rounded-full"
                    style={{
                      inset: '-15%',
                      border: '1px solid rgba(255,220,120,0.08)',
                      animation: `ringPulse ${l.floatDur * 0.9}s ease-out ${l.delay + 5}s infinite`,
                    }}
                  />

                  {/* ✨ Sparkles */}
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
                        boxShadow: '0 0 3px rgba(255,200,80,0.9), 0 0 6px rgba(255,160,40,0.4)',
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

        {/* ══════ RISING EMBERS ══════ */}
        {embers.map((e) => (
          <div
            key={`em-${e.id}`}
            className="absolute pointer-events-none rounded-full"
            style={
              {
                left: `${e.left}%`,
                bottom: '-3%',
                width: `${e.size}px`,
                height: `${e.size}px`,
                background:
                  'radial-gradient(circle, #ffcc02, rgba(255,140,0,0.5))',
                boxShadow: '0 0 4px rgba(255,160,30,0.5), 0 0 8px rgba(255,100,0,0.2)',
                animation: `emberRise ${e.dur}s ease-out ${e.delay}s infinite`,
                '--ember-drift': `${e.driftX}px`,
                '--ember-peak': `${e.maxOpacity}`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* ══════ KEYFRAMES ══════ */}
      <style jsx>{`
        /* Y-axis organic float — asymmetric keyframes for natural feel */
        @keyframes lampFloat {
          0%, 100% { translate: 0 0; }
          15%  { translate: 0 calc(var(--float-dist, 20px) * -0.3); }
          35%  { translate: 0 calc(var(--float-dist, 20px) * -0.85); }
          55%  { translate: 0 calc(var(--float-dist, 20px) * -1); }
          75%  { translate: 0 calc(var(--float-dist, 20px) * -0.55); }
          90%  { translate: 0 calc(var(--float-dist, 20px) * -0.15); }
        }

        /* X-axis drift — independent from Y for Lissajous paths */
        @keyframes lampDrift {
          0%, 100% { translate: 0 0; }
          25%  { translate: calc(var(--drift-x, 10px) * 0.7) 0; }
          50%  { translate: calc(var(--drift-x, 10px) * -0.3) 0; }
          75%  { translate: calc(var(--drift-x, 10px) * -0.8) 0; }
          90%  { translate: calc(var(--drift-x, 10px) * 0.15) 0; }
        }

        /* Scale breathing — separate CSS property, no transform conflict */
        @keyframes lampBreathe {
          0%, 100% { scale: 1; }
          50%      { scale: 1.2; }
        }

        /* Flame flicker — stepped for sharp on/off like real fire */
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

        /* Glow intensity pulse */
        @keyframes glowPulse {
          0%, 100% { opacity: 0.6; scale: 1; }
          50%      { opacity: 1; scale: 1.3; }
        }

        /* Expanding ring of light */
        @keyframes ringPulse {
          0%   { transform: scale(1); opacity: 0.35; }
          100% { transform: scale(4); opacity: 0; }
        }

        /* Sparkle twinkle */
        @keyframes sparkle {
          0%, 100% { opacity: 0; scale: 0; }
          20%  { opacity: 1; scale: 1.3; }
          50%  { opacity: 0.8; scale: 0.9; }
          75%  { opacity: 0.3; scale: 0.4; }
        }

        /* Background atmosphere breathing */
        @keyframes atmosPulse {
          0%, 100% { opacity: 0.65; transform: translateX(-50%) scale(1); }
          50%      { opacity: 1; transform: translateX(-50%) scale(1.07); }
        }

        /* Ember rise with drift + fade */
        @keyframes emberRise {
          0% {
            translate: 0 0;
            opacity: 0;
            scale: 0.4;
          }
          8% {
            opacity: var(--ember-peak, 0.4);
            scale: 1;
          }
          40% {
            opacity: calc(var(--ember-peak, 0.4) * 0.8);
            translate: calc(var(--ember-drift, 0px) * 0.4) -220px;
          }
          70% {
            opacity: calc(var(--ember-peak, 0.4) * 0.4);
            translate: calc(var(--ember-drift, 0px) * 0.75) -420px;
            scale: 0.5;
          }
          100% {
            opacity: 0;
            translate: var(--ember-drift, 0px) -600px;
            scale: 0;
          }
        }
      `}</style>
    </>
  );
}
