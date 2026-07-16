'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function HanumanHero() {
  const IMAGE_PATH = "https://cgntcihiwlzwkurkkarr.supabase.co/storage/v1/object/public/broadcasts/Hanuman%20JI/Screenshot%202026-07-14%20221205.png";
  const [loaded, setLoaded] = useState(false);
  const [entered, setEntered] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full min-h-[300px] py-3 select-none">

      {/* ═══ Layer 0: Deep background aura — breathes WITH frame ═══ */}
      <div
        className="absolute w-[240px] h-[260px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 45%, rgba(245,158,11,0.14) 0%, rgba(220,90,10,0.06) 40%, transparent 70%)',
          animation: 'heroAuraBreathe 4s ease-in-out infinite',
        }}
      />

      {/* ═══ Layer 0.5: Subtle floating motes ═══ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-[2px] h-[2px] rounded-full bg-amber-400/40"
            style={{
              left: `${20 + i * 14}%`,
              top: `${15 + (i % 3) * 25}%`,
              animation: `moteFloat ${3 + i * 0.7}s ease-in-out infinite ${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* ═══ Layer 1: Frame + Image — ONE visual unit ═══ */}
      <div
        ref={frameRef}
        className="relative z-10 flex flex-col items-center"
        style={{
          transform: entered ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.92)',
          opacity: entered ? 1 : 0,
          transition: 'transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.8s ease-out',
        }}
      >

        {/* ── Golden Frame Shell ── */}
        <div
          className="relative p-[2.5px] rounded-t-full rounded-b-[18px]"
          style={{
            background: 'linear-gradient(180deg, #f5d78e 0%, #d4a030 25%, #b8860b 55%, #8b5e0a 80%, #6b3a00 100%)',
            boxShadow: '0 0 35px rgba(245,158,11,0.30), 0 0 70px rgba(245,158,11,0.10), inset 0 1px 0 rgba(255,235,180,0.5)',
            animation: 'frameBreathe 4s ease-in-out infinite',
          }}
        >

          {/* ── Highlight strip (top shine) ── */}
          <div
            className="absolute top-[1px] left-[15%] right-[15%] h-[1px] rounded-full pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,245,200,0.7), transparent)' }}
          />

          {/* ── Inner Dark Chamber ── */}
          <div
            className="relative overflow-hidden rounded-t-full rounded-b-[14px] w-[152px] h-[198px]"
            style={{ background: 'linear-gradient(180deg, #0d0e16 0%, #0a0b12 40%, #080910 100%)' }}
          >

            {/* Radial warm glow behind image — makes image feel EMBEDDED */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 50% 38%, rgba(255,180,50,0.10) 0%, rgba(200,100,20,0.04) 40%, transparent 68%)',
              }}
            />

            {/* The Image — object-contain, centered, fills the space naturally */}
            {IMAGE_PATH ? (
              <img
                src={IMAGE_PATH}
                alt="हनुमान जी"
                draggable={false}
                className={`
                  relative z-[1] w-full h-full object-contain
                  transition-all duration-[1.4s] ease-out
                  ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.93]'}
                `}
                onLoad={() => setLoaded(true)}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : null}

            {/* ═══ CRITICAL: Inner shadow MERGE layers ═══ */}
            {/* Top fade — image bleeds into dark top of frame */}
            <div
              className="absolute top-0 left-0 right-0 pointer-events-none z-[2]"
              style={{
                height: '22%',
                background: 'linear-gradient(180deg, #0d0e16 0%, rgba(13,14,22,0.6) 50%, transparent 100%)',
              }}
            />
            {/* Bottom fade — merges image into frame base */}
            <div
              className="absolute bottom-0 left-0 right-0 pointer-events-none z-[2]"
              style={{
                height: '28%',
                background: 'linear-gradient(0deg, #080910 0%, rgba(8,9,16,0.7) 45%, transparent 100%)',
              }}
            />
            {/* Left edge fade */}
            <div
              className="absolute top-0 bottom-0 left-0 pointer-events-none z-[2]"
              style={{
                width: '18%',
                background: 'linear-gradient(90deg, #0d0e16 0%, transparent 100%)',
              }}
            />
            {/* Right edge fade */}
            <div
              className="absolute top-0 bottom-0 right-0 pointer-events-none z-[2]"
              style={{
                width: '18%',
                background: 'linear-gradient(270deg, #0d0e16 0%, transparent 100%)',
              }}
            />

            {/* Inner golden rim — frame light bleeds INWARD onto image */}
            <div
              className="absolute inset-0 rounded-t-full rounded-b-[14px] pointer-events-none z-[3]"
              style={{
                boxShadow: 'inset 0 0 25px rgba(245,180,50,0.08), inset 0 0 6px rgba(245,180,50,0.05)',
              }}
            />

            {/* Corner accent glows — 4 points of golden light */}
            <div className="absolute top-[12%] left-[10%] w-4 h-4 rounded-full pointer-events-none z-[3]" style={{ background: 'radial-gradient(circle, rgba(255,210,100,0.10), transparent 70%)' }} />
            <div className="absolute top-[12%] right-[10%] w-4 h-4 rounded-full pointer-events-none z-[3]" style={{ background: 'radial-gradient(circle, rgba(255,210,100,0.10), transparent 70%)' }} />
          </div>
        </div>

        {/* ═══ MANTRA — TOUCHES the frame, not floating ═══ */}
        <div className="relative z-20 -mt-[6px] text-center px-6">
          {/* Golden connector — bridges frame to text */}
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <div className="w-5 h-px bg-gradient-to-r from-transparent to-amber-400/50" />
            <div
              className="w-[5px] h-[5px] rounded-full rotate-45"
              style={{
                background: 'linear-gradient(135deg, #f5d78e, #d4a030)',
                boxShadow: '0 0 6px rgba(245,158,11,0.5)',
              }}
            />
            <div className="w-5 h-px bg-gradient-to-l from-transparent to-amber-400/50" />
          </div>

          {/* Mantra lines */}
          <div
            className="space-y-[3px]"
            style={{
              animation: entered ? 'mantraReveal 0.8s ease-out 0.6s both' : 'none',
            }}
          >
            <p
              className="text-[9px] leading-[1.3] font-medium tracking-wide"
              style={{
                fontFamily: "'Nirmala UI','Devanagari Sangam MN','Mangal',sans-serif",
                color: 'rgba(245,215,140,0.85)',
                textShadow: '0 0 10px rgba(245,158,11,0.25), 0 1px 2px rgba(0,0,0,0.8)',
              }}
            >
              जय हनुमान ज्ञान गुण सागर।
            </p>
            <p
              className="text-[9px] leading-[1.3] font-medium tracking-wide"
              style={{
                fontFamily: "'Nirmala UI','Devanagari Sangam MN','Mangal',sans-serif",
                color: 'rgba(245,215,140,0.85)',
                textShadow: '0 0 10px rgba(245,158,11,0.25), 0 1px 2px rgba(0,0,0,0.8)',
              }}
            >
              जय कपीस तिहुँ लोक उजागर॥
            </p>
          </div>

          {/* Bottom dot terminator */}
          <div
            className="mt-1.5 mx-auto w-[3px] h-[3px] rounded-full"
            style={{
              background: '#d4a030',
              boxShadow: '0 0 8px rgba(245,158,11,0.6)',
            }}
          />
        </div>

      </div>

      {/* ═══ Keyframes ═══ */}
      <style>{`
        /* Frame + Aura synchronized breathing */
        @keyframes frameBreathe {
          0%, 100% {
            box-shadow:
              0 0 30px rgba(245,158,11,0.25),
              0 0 60px rgba(245,158,11,0.08),
              inset 0 1px 0 rgba(255,235,180,0.5);
            filter: brightness(1);
          }
          50% {
            box-shadow:
              0 0 50px rgba(245,158,11,0.40),
              0 0 100px rgba(245,158,11,0.15),
              inset 0 1px 0 rgba(255,235,180,0.6);
            filter: brightness(1.06);
          }
        }
        @keyframes heroAuraBreathe {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.12); opacity: 1; }
        }
        @keyframes mantraReveal {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes moteFloat {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-12px) scale(1.3); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
