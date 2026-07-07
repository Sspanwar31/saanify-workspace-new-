'use client';

import React from 'react';

export default function ChristmasHero() {
  // ── 25 ब्लिंकिंग कलरफुल लाइट्स की सटीक पोजीशंस ──
  const lights = [
    { t: 22, l: 48, c: '#ef4444', s: 5, delay: '0s' },     // Red
    { t: 25, l: 53, c: '#fbbf24', s: 6, delay: '0.3s' },   // Gold
    { t: 30, l: 42, c: '#3b82f6', s: 5, delay: '0.6s' },   // Blue
    { t: 33, l: 56, c: '#22c55e', s: 6, delay: '0.1s' },   // Green
    { t: 28, l: 50, c: '#a855f7', s: 5, delay: '0.8s' },   // Purple
    { t: 36, l: 38, c: '#fbbf24', s: 6, delay: '0.2s' },
    { t: 39, l: 51, c: '#ef4444', s: 5, delay: '0.9s' },
    { t: 37, l: 61, c: '#3b82f6', s: 6, delay: '0.4s' },
    { t: 44, l: 34, c: '#22c55e', s: 6, delay: '0.5s' },
    { t: 46, l: 46, c: '#a855f7', s: 5, delay: '0.15s' },
    { t: 48, l: 58, c: '#fbbf24', s: 6, delay: '0.85s' },
    { t: 43, l: 66, c: '#ef4444', s: 5, delay: '0.35s' },
    { t: 52, l: 30, c: '#3b82f6', s: 6, delay: '0.7s' },
    { t: 54, l: 43, c: '#fbbf24', s: 6, delay: '0.25s' },
    { t: 56, l: 57, c: '#22c55e', s: 5, delay: '0.55s' },
    { t: 51, l: 68, c: '#ef4444', s: 6, delay: '0.75s' },
    { t: 60, l: 26, c: '#a855f7', s: 6, delay: '0.1s' },
    { t: 58, l: 40, c: '#ef4444', s: 5, delay: '0.6s' },
    { t: 62, l: 52, c: '#3b82f6', s: 6, delay: '0.3s' },
    { t: 59, l: 64, c: '#fbbf24', s: 5, delay: '0.9s' },
    { t: 61, l: 74, c: '#22c55e', s: 6, delay: '0.45s' },
    { t: 68, l: 22, c: '#fbbf24', s: 6, delay: '0.7s' },
    { t: 70, l: 37, c: '#a855f7', s: 5, delay: '0.2s' },
    { t: 67, l: 51, c: '#ef4444', s: 6, delay: '0.5s' },
    { t: 72, l: 65, c: '#3b82f6', s: 5, delay: '0.8s' },
  ];

  // ── कोमल दिव्य गॉड रेज़ (God Rays Config) ──
  const rays = [
    { angle: -28, width: 22, height: 190, delay: '0s' },
    { angle: -15, width: 18, height: 230, delay: '0.7s' },
    { angle: -5, width: 26, height: 260, delay: '1.4s' },
    { angle: 5, width: 26, height: 260, delay: '2.1s' },
    { angle: 15, width: 18, height: 230, delay: '2.8s' },
    { angle: 28, width: 22, height: 190, delay: '3.5s' },
  ];

  return (
    <div
      style={{
        position: 'relative',
        width: 300,
        height: 360,
        background: 'transparent',
      }}
    >
      {/* 🚀 इनलाइन हार्डवेयर-एक्सेलरेटेड सीएसएस एनीमेशन (Zero lag, 60fps render) */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes star-shimmer {
          0% { filter: drop-shadow(0 0 12px #fbbf24) drop-shadow(0 0 35px rgba(251,191,36,0.6)); transform: translateX(-50%) translateY(0px) scale(1) rotate(0deg); }
          50% { filter: drop-shadow(0 0 25px #fbbf24) drop-shadow(0 0 60px rgba(251,191,36,0.9)); transform: translateX(-50%) translateY(-6px) scale(1.08) rotate(3deg); }
          100% { filter: drop-shadow(0 0 12px #fbbf24) drop-shadow(0 0 35px rgba(251,191,36,0.6)); transform: translateX(-50%) translateY(0px) scale(1) rotate(0deg); }
        }
        @keyframes halo-pulse {
          0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.35; }
          50% { transform: translate(-50%, -50%) scale(1.25); opacity: 0.75; }
          100% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.35; }
        }
        @keyframes tree-breathe {
          0% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.02); }
          100% { transform: translateX(-50%) scale(1); }
        }
        @keyframes ray-fade {
          0% { opacity: 0.2; }
          50% { opacity: 0.65; }
          100% { opacity: 0.2; }
        }
        @keyframes bulb-twinkle {
          0% { opacity: 0.2; transform: translate(-50%, -50%) scale(0.7); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
          100% { opacity: 0.2; transform: translate(-50%, -50%) scale(0.7); }
        }
        .animate-star { animation: star-shimmer 4s ease-in-out infinite; }
        .animate-halo { animation: halo-pulse 3s ease-in-out infinite; }
        .animate-tree { animation: tree-breathe 4s ease-in-out infinite; }
        .animate-ray { animation: ray-fade 5s ease-in-out infinite; }
        .animate-bulb { animation: bulb-twinkle 1.8s ease-in-out infinite; }
      `}} />

      {/* ── 1. Star Halo (स्वर्णिम प्रकाश मंडल) ── */}
      <div
        className="animate-halo"
        style={{
          position: 'absolute',
          top: 50,
          left: '50%',
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(251,191,36,0.3) 0%, rgba(251,191,36,0.08) 50%, transparent 70%)',
          transform: 'translate(-50%,-50%)',
          pointerEvents: 'none',
          zIndex: 21,
        }}
      />

      {/* ── 2. The Golden Sparkle Star (स्वर्णिम चमकता सितारा) ── */}
      <div
        className="animate-star"
        style={{
          position: 'absolute',
          top: 18,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 22,
          pointerEvents: 'none',
        }}
      >
        <svg width="60" height="64" viewBox="0 0 24 24" fill="#fbbf24">
          <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" />
        </svg>
      </div>

      {/* ── 3. Atmospheric Rays (वायुमंडलीय कोमल किरणें) ── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none' }}>
        {rays.map((r, i) => (
          <div
            key={i}
            className="animate-ray"
            style={{
              position: 'absolute',
              top: '52px',
              left: `calc(50% - ${r.width / 2}px)`,
              width: r.width,
              height: r.height,
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
              background: 'linear-gradient(to bottom, rgba(251,191,36,0.18), rgba(251,191,36,0.02) 65%, transparent)',
              transformOrigin: 'top center',
              transform: `rotate(${r.angle}deg)`,
              animationDelay: r.delay,
            }}
          />
        ))}
      </div>

      {/* ── 4. The Vibrant Christmas Tree (सजीव गहरा फेस्टिव ट्री) ── */}
      <div
        className="animate-tree"
        style={{
          position: 'absolute',
          top: 42,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <svg width="240" height="280" viewBox="0 0 240 280">
          <defs>
            <linearGradient id="tree-grad-light" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="100%" stopColor="#16a34a" />
            </linearGradient>
            <linearGradient id="tree-grad-mid" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>
            <linearGradient id="tree-grad-dark" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#16a34a" />
              <stop offset="100%" stopColor="#14532d" />
            </linearGradient>
            <linearGradient id="trunk-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b1508" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
          </defs>

          {/* 🚀 सुधार: मटमैले शेड को हटाकर परतों पर कोमल स्वर्णिम बॉर्डर दी गई है */}
          {/* Layer 3: Bottom */}
          <path d="M120 195 Q18 221,18 248 L222 248 Q222 221,120 195Z" fill="url(#tree-grad-dark)" />
          <path d="M120 195 Q18 221,18 248 L222 248 Q222 221,120 195Z" fill="none" stroke="rgba(251,191,36,0.3)" strokeWidth="0.8" />
          
          <path d="M120 165 Q34 191,34 218 L206 218 Q206 191,120 165Z" fill="url(#tree-grad-dark)" />
          <path d="M120 165 Q34 191,34 218 L206 218 Q206 191,120 165Z" fill="none" stroke="rgba(251,191,36,0.25)" strokeWidth="0.8" />

          {/* Layer 2: Mid */}
          <path d="M120 138 Q46 163,46 188 L194 188 Q194 163,120 138Z" fill="url(#tree-grad-mid)" />
          <path d="M120 138 Q46 163,46 188 L194 188 Q194 163,120 138Z" fill="none" stroke="rgba(251,191,36,0.2)" strokeWidth="0.8" />
          
          <path d="M120 110 Q60 134,60 158 L180 158 Q180 134,120 110Z" fill="url(#tree-grad-mid)" />
          <path d="M120 110 Q60 134,60 158 L180 158 Q180 134,120 110Z" fill="none" stroke="rgba(251,191,36,0.18)" strokeWidth="0.8" />

          {/* Layer 1: Top */}
          <path d="M120 82 Q74 105,74 128 L166 128 Q166 105,120 82Z" fill="url(#tree-grad-light)" />
          <path d="M120 82 Q74 105,74 128 L166 128 Q166 105,120 82Z" fill="none" stroke="rgba(251,191,36,0.15)" strokeWidth="0.8" />
          
          <path d="M120 55 Q88 76,88 98 L152 98 Q152 76,120 55Z" fill="url(#tree-grad-light)" />
          <path d="M120 55 Q88 76,88 98 L152 98 Q152 76,120 55Z" fill="none" stroke="rgba(251,191,36,0.12)" strokeWidth="0.8" />
          
          <path d="M120 28 Q102 48,102 68 L138 68 Q138 48,120 28Z" fill="url(#tree-grad-light)" />
          <path d="M120 28 Q102 48,102 68 L138 68 Q138 48,120 28Z" fill="none" stroke="rgba(251,191,36,0.1)" strokeWidth="0.8" />

          {/* Trunk */}
          <rect x="100" y="244" width="40" height="28" rx="3" fill="url(#trunk-grad)" />
        </svg>
      </div>

      {/* ── 5. Pure React-Rendered Twinkling Bulbs (सजीव चमकदार लटकती लाइट्स) ── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 16, pointerEvents: 'none' }}>
        {lights.map((l, i) => (
          <div
            key={i}
            className="animate-bulb"
            style={{
              position: 'absolute',
              top: `${l.t}%`,
              left: `${l.l}%`,
              width: `${l.s}px`,
              height: `${l.s}px`,
              borderRadius: '50%',
              backgroundColor: l.c,
              // डबल लेयर सुगम आभा (Double-layer glow)
              boxShadow: `0 0 ${l.s * 2.5}px ${l.s * 0.8}px ${l.c}, 0 0 ${l.s * 5}px ${l.s * 1.5}px ${l.c}66`,
              animationDelay: l.delay,
            }}
          />
        ))}
      </div>

      {/* ── 6. Large Elegant Ornaments (सुंदर सजीव बड़े बॉल्स) ── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 15, pointerEvents: 'none' }}>
        {/* Red Ornament */}
        <div style={{
          position: 'absolute', top: '46%', left: '40%', width: 12, height: 12, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, #ff9e9e, #ef4444, #7f1d1d)',
          boxShadow: '0 4px 12px rgba(239,68,68,0.5)', transform: 'translate(-50%,-50%)',
        }} />
        {/* Gold Ornament */}
        <div style={{
          position: 'absolute', top: '38%', left: '58%', width: 11, height: 11, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, #fef08a, #fbbf24, #78350f)',
          boxShadow: '0 4px 12px rgba(251,191,36,0.5)', transform: 'translate(-50%,-50%)',
        }} />
        {/* Blue Ornament */}
        <div style={{
          position: 'absolute', top: '53%', left: '53%', width: 11, height: 11, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, #93c5fd, #3b82f6, #1e3a8a)',
          boxShadow: '0 4px 12px rgba(59,130,246,0.5)', transform: 'translate(-50%,-50%)',
        }} />
        {/* Purple Ornament */}
        <div style={{
          position: 'absolute', top: '61%', left: '33%', width: 10, height: 10, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, #e9d5ff, #a855f7, #581c87)',
          boxShadow: '0 4px 12px rgba(168,85,247,0.4)', transform: 'translate(-50%,-50%)',
        }} />
      </div>
    </div>
  );
}
