'use client';

import React from 'react';

export default function RakhiHero() {
  return (
    <div className="relative flex items-center justify-center w-[260px] h-[200px] select-none pointer-events-none">
      
      {/* 🚀 इनलाइन सीएसएस एनीमेशन (No overwrite conflict) */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes rakhi-spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes rakhi-spin-reverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes thread-wave-left {
          0%, 100% { transform: rotate(0deg) skewY(0deg); }
          50% { transform: rotate(-3deg) skewY(-2deg); }
        }
        @keyframes thread-wave-right {
          0%, 100% { transform: rotate(0deg) skewY(0deg); }
          50% { transform: rotate(3deg) skewY(2deg); }
        }
        @keyframes center-pulse-glow {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 10px #dc2626); }
          50% { transform: scale(1.08); filter: drop-shadow(0 0 25px #fbbf24); }
        }
        .animate-rakhi-spin { animation: rakhi-spin-slow 15s linear infinite; }
        .animate-rakhi-reverse { animation: rakhi-spin-reverse 10s linear infinite; }
        .animate-thread-left { animation: thread-wave-left 3s ease-in-out infinite; transform-origin: right center; }
        .animate-thread-right { animation: thread-wave-right 3s ease-in-out infinite; transform-origin: left center; }
        .animate-center-glow { animation: center-pulse-glow 2.5s ease-in-out infinite; }
      `}} />

      <svg width="260" height="200" viewBox="0 0 260 200" className="overflow-visible">
        <defs>
          {/* रेशमी लाल-पीले धागे के लिए ग्रेडिएंट */}
          <linearGradient id="rakhi-thread-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(251,191,36,0)" />
            <stop offset="30%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#dc2626" />
            <stop offset="70%" stopColor="#db2777" />
            <stop offset="100%" stopColor="rgba(251,191,36,0)" />
          </linearGradient>

          {/* सोने का मैटेलिक ग्रेडिएंट */}
          <linearGradient id="rakhi-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5a2b" />
            <stop offset="25%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#fffbeb" />
            <stop offset="75%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#8b5a2b" />
          </linearGradient>

          {/* मोती के लिए सॉफ्ट ग्रेडिएंट */}
          <radialGradient id="pearl-grad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#f3f4f6" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </radialGradient>
        </defs>

        {/* ── 1. BACKGROUND GLOW ── */}
        <circle cx="130" cy="100" r="75" fill="rgba(251,191,36,0.06)" filter="blur(15px)" />

        {/* ── 2. SWAYING SILK THREADS (लहराते हुए धागे) ── */}
        {/* Left Thread */}
        <g className="animate-thread-left">
          <path d="M 10 100 Q 40 85, 70 105 T 130 100" fill="none" stroke="url(#rakhi-thread-grad)" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M 25 100 Q 55 90, 85 105 T 130 100" fill="none" stroke="url(#rakhi-thread-grad)" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
        </g>
        {/* Right Thread */}
        <g className="animate-thread-right">
          <path d="M 130 100 Q 190 115, 220 95 T 250 100" fill="none" stroke="url(#rakhi-thread-grad)" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M 130 100 Q 175 110, 205 90 T 235 100" fill="none" stroke="url(#rakhi-thread-grad)" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
        </g>

        {/* ── 3. ROTATING SILK PETALS & MANDALA (🚀 नेस्टेड: आउटर ट्रांसलेट + इनर स्पिन) ── */}
        <g transform="translate(130, 100)">
          <g className="animate-rakhi-spin">
            {/* 12 Overlapping Red Silk Petals */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 30 * Math.PI) / 180;
              const x = Math.cos(angle) * 44;
              const y = Math.sin(angle) * 44;
              return (
                <g key={i} transform={`translate(${x}, ${y}) rotate(${i * 30})`}>
                  <ellipse cx="0" cy="0" rx="8" ry="15" fill="#dc2626" />
                  <ellipse cx="0" cy="0" rx="8" ry="15" fill="none" stroke="#fbbf24" strokeWidth="0.8" />
                </g>
              );
            })}
          </g>
        </g>

        {/* ── 4. MIDDLE GOLDEN EMBOSSED RING (🚀 नेस्टेड: आउटर ट्रांसलेट + इनर रिवर्स स्पिन) ── */}
        <g transform="translate(130, 100)">
          <g className="animate-rakhi-reverse">
            <circle cx="0" cy="0" r="34" fill="url(#rakhi-gold)" stroke="#8b5a2b" strokeWidth="1" />
            <circle cx="0" cy="0" r="30" fill="#db2777" stroke="#fbbf24" strokeWidth="1.2" />

            {/* 8 Sparkling Pearl Beads */}
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * 45 * Math.PI) / 180;
              const px = Math.cos(angle) * 20;
              const py = Math.sin(angle) * 20;
              return (
                <circle key={i} cx={px} cy={py} r="4.5" fill="url(#pearl-grad)" stroke="#94a3b8" strokeWidth="0.5" />
              );
            })}
          </g>
        </g>

        {/* ── 5. SACRED COKAND CORES (🚀 नेस्टेड: आउटर ट्रांसलेट + इनर पल्स ग्लो) ── */}
        <g transform="translate(130, 100)">
          <g className="animate-center-glow">
            {/* Crimson Tilak Base */}
            <circle cx="0" cy="0" r="11" fill="#dc2626" stroke="#fbbf24" strokeWidth="1" />
            
            {/* Akshat (Rice grains) */}
            <ellipse cx="-2.5" cy="-2" rx="1" ry="2.5" fill="#fffbeb" transform="rotate(25 -2.5 -2)" />
            <ellipse cx="2.5" cy="2" rx="1" ry="2.5" fill="#fffbeb" transform="rotate(-25 2.5 2)" />
          </g>
        </g>
      </svg>
    </div>
  );
}
