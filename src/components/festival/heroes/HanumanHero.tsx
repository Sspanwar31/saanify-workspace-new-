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
    <div className="relative flex flex-col items-center justify-center w-full h-full min-h-[260px] py-1 select-none">

      {/* ═══ Layer 0: Deep background aura — breathes WITH frame ═══ */}
      <div
        className="absolute w-[200px] h-[220px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 45%, rgba(245,158,11,0.15) 0%, rgba(220,90,10,0.05) 45%, transparent 70%)',
          animation: 'heroAuraBreathe 4s ease-in-out infinite',
        }}
      />

      {/* ═══ Layer 0.5: Subtle floating motes ═══ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute w-[2px] h-[2px] rounded-full bg-amber-400/40"
            style={{
              left: `${25 + i * 13}%`,
              top: `${20 + (i % 2) * 20}%`,
              animation: `moteFloat ${3.5 + i * 0.6}s ease-in-out infinite ${i * 0.4}s`,
            }}
          />
        ))}
      </div>

      {/* ═══ Layer 1: Frame + Image — ONE visual unit ═══ */}
      <div
        ref={frameRef}
        className="relative z-10 flex flex-col items-center"
        style={{
          transform: entered ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.94)',
          opacity: entered ? 1 : 0,
          transition: 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.8s ease-out',
        }}
      >

        {/* ── Golden Frame Shell (Size optimized for better comfort) ── */}
        <div
          className="relative p-[2.5px] rounded-t-full rounded-b-[16px]"
          style={{
            background: 'linear-gradient(180deg, #f5d78e 0%, #d4a030 25%, #b8860b 55%, #8b5e0a 80%, #6b3a00 100%)',
            boxShadow: '0 0 30px rgba(245,158,11,0.25), 0 0 60px rgba(245,158,11,0.08), inset 0 1px 0 rgba(255,235,180,0.5)',
            animation: 'frameBreathe 4s ease-in-out infinite',
          }}
        >

          {/* ── Highlight strip (top shine) ── */}
          <div
            className="absolute top-[1px] left-[15%] right-[15%] h-[1px] rounded-full pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,245,200,0.7), transparent)' }}
          />

          {/* ── Inner Dark Chamber (Reduced size to fit everything gracefully) ── */}
          <div
            className="relative overflow-hidden rounded-t-full rounded-b-[12px] w-[130px] h-[166px]"
            style={{ background: 'linear-gradient(180deg, #0d0e16 0%, #0a0b12 40%, #080910 100%)' }}
          >

            {/* Radial warm glow behind image */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 50% 38%, rgba(255,180,50,0.12) 0%, rgba(200,100,20,0.04) 40%, transparent 68%)',
              }}
            />

            {/* The Image — Added comfortable scale to prevent left-right and top-bottom touch */}
            {IMAGE_PATH ? (
              <img
                src={IMAGE_PATH}
                alt="हनुमान जी"
                draggable={false}
                className={`
                  relative z-[1] w-full h-full object-contain
                  transition-all duration-[1.4s] ease-out
                  ${loaded ? 'opacity-100 scale-[0.85]' : 'opacity-0 scale-[0.78]'}
                `}
                onLoad={() => setLoaded(true)}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : null}

            {/* ═══ Edge Soft Fades ═══ */}
            {/* Top fade */}
            <div
              className="absolute top-0 left-0 right-0 pointer-events-none z-[2]"
              style={{
                height: '18%',
                background: 'linear-gradient(180deg, #0d0e16 0%, rgba(13,14,22,0.5) 60%, transparent 100%)',
              }}
            />
            {/* Bottom fade */}
            <div
              className="absolute bottom-0 left-0 right-0 pointer-events-none z-[2]"
              style={{
                height: '22%',
                background: 'linear-gradient(0deg, #080910 0%, rgba(8,9,16,0.6) 50%, transparent 100%)',
              }}
            />
            {/* Left edge fade (Reduced to show more mantra details) */}
            <div
              className="absolute top-0 bottom-0 left-0 pointer-events-none z-[2]"
              style={{
                width: '10%',
                background: 'linear-gradient(90deg, #0d0e16 0%, transparent 100%)',
              }}
            />
            {/* Right edge fade (Reduced) */}
            <div
              className="absolute top-0 bottom-0 right-0 pointer-events-none z-[2]"
              style={{
                width: '10%',
                background: 'linear-gradient(270deg, #0d0e16 0%, transparent 100%)',
              }}
            />

            {/* Inner golden rim */}
            <div
              className="absolute inset-0 rounded-t-full rounded-b-[12px] pointer-events-none z-[3]"
              style={{
                boxShadow: 'inset 0 0 20px rgba(245,180,50,0.08)',
              }}
            />
          </div>
        </div>

        {/* ═══ MANTRA — Optimized spacing & High Contrast ═══ */}
        <div className="relative z-20 -mt-[4px] text-center px-6">
          {/* Golden connector */}
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <div className="w-4 h-px bg-gradient-to-r from-transparent to-amber-400/40" />
            <div
              className="w-[4px] h-[4px] rounded-full rotate-45"
              style={{
                background: 'linear-gradient(135deg, #f5d78e, #d4a030)',
                boxShadow: '0 0 6px rgba(245,158,11,0.5)',
              }}
            />
            <div className="w-4 h-px bg-gradient-to-l from-transparent to-amber-400/40" />
          </div>

          {/* Mantra lines (High Contrast & Bigger font) */}
          <div
            className="space-y-[4px]"
            style={{
              animation: entered ? 'mantraReveal 0.8s ease-out 0.5s both' : 'none',
            }}
          >
            <p
              className="text-[10.5px] leading-[1.3] font-semibold tracking-wide"
              style={{
                fontFamily: "'Nirmala UI','Devanagari Sangam MN','Mangal',sans-serif",
                color: '#ffedd5', // Warm high-contrast peach white
                textShadow: '0 0 12px rgba(245,158,11,0.6), 0 2px 4px rgba(0,0,0,0.95)',
              }}
            >
              जय हनुमान ज्ञान गुण सागर।
            </p>
            <p
              className="text-[10.5px] leading-[1.3] font-semibold tracking-wide"
              style={{
                fontFamily: "'Nirmala UI','Devanagari Sangam MN','Mangal',sans-serif",
                color: '#ffedd5',
                textShadow: '0 0 12px rgba(245,158,11,0.6), 0 2px 4px rgba(0,0,0,0.95)',
              }}
            >
              जय कपीस तिहुँ लोक उजागर॥
            </p>
          </div>

          {/* Bottom dot terminator */}
          <div
            className="mt-2 mx-auto w-[3px] h-[3px] rounded-full"
            style={{
              background: '#d4a030',
              boxShadow: '0 0 8px rgba(245,158,11,0.6)',
            }}
          />
        </div>

      </div>

      {/* ═══ Keyframes ═══ */}
      <style>{`
        @keyframes frameBreathe {
          0%, 100% {
            box-shadow:
              0 0 25px rgba(245,158,11,0.22),
              0 0 50px rgba(245,158,11,0.06),
              inset 0 1px 0 rgba(255,235,180,0.4);
            filter: brightness(1);
          }
          50% {
            box-shadow:
              0 0 45px rgba(245,158,11,0.35),
              0 0 85px rgba(245,158,11,0.12),
              inset 0 1px 0 rgba(255,235,180,0.5);
            filter: brightness(1.04);
          }
        }
        @keyframes heroAuraBreathe {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        @keyframes mantraReveal {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes moteFloat {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-10px) scale(1.3); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
