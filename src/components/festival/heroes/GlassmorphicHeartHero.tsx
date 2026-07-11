'use client';

import React, { useState, useRef } from 'react';

export default function GlassmorphicHeartHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  // माउस हिलाने पर 3D झुकाव (Tilt Effect)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: y * -20, y: x * 20 });
  };

  const handleMouseLeave = () => {
    setHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full select-none overflow-visible">
      
      {/* ── CSS KEYFRAMES FOR LIVE ANIMATION ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes moon-pulse {
          0%, 100% { transform: scale(1) translate(-50%, -50%); opacity: 0.15; }
          50% { transform: scale(1.08) translate(-50%, -50%); opacity: 0.25; }
        }
        @keyframes mascot-bob-left {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-2px) rotate(1.5deg); }
        }
        @keyframes mascot-bob-right {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-2.2px) rotate(-1.5deg); transform-origin: center; }
        }
        @keyframes heart-rise-one {
          0% { transform: translate(-50%, 0) scale(0.5); opacity: 0; }
          20% { opacity: 0.8; }
          100% { transform: translate(-100%, -40px) scale(1); opacity: 0; }
        }
        @keyframes heart-rise-two {
          0% { transform: translate(-50%, 0) scale(0.5); opacity: 0; }
          20% { opacity: 0.8; }
          100% { transform: translate(100%, -45px) scale(0.9); opacity: 0; }
        }
        @keyframes tail-wag {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(15deg); }
        }
        .anim-moon { animation: moon-pulse 4s ease-in-out infinite; transform-origin: 0 0; }
        .anim-boy { animation: mascot-bob-left 3s ease-in-out infinite; transform-origin: 65px 125px; }
        .anim-girl { animation: mascot-bob-right 3s ease-in-out infinite 0.2s; transform-origin: 135px 125px; }
        .anim-heart-1 { animation: heart-rise-one 2.5s ease-in-out infinite; transform-origin: center; }
        .anim-heart-2 { animation: heart-rise-two 2.8s ease-in-out infinite 1s; transform-origin: center; }
        .anim-tail { animation: tail-wag 1.5s ease-in-out infinite; transform-origin: 48px 135px; }
      ` }} />

      {/* ── LAYER 1: Ambient Backdrop Glow ── */}
      <div
        className="absolute w-52 h-52 rounded-full pointer-events-none anim-moon"
        style={{
          top: '50%', left: '50%',
          background: 'radial-gradient(circle, rgba(244,63,94,0.2) 0%, rgba(251,191,36,0.1) 45%, transparent 70%)',
        }}
      />

      {/* ── LAYER 2: 3D Tilt Container ── */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleMouseLeave}
        className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center cursor-pointer overflow-visible"
        style={{ perspective: '800px' }}
      >
        <div
          className="relative w-full h-full transition-transform duration-300 ease-out flex items-center justify-center overflow-visible"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${hovered ? 1.05 : 1})`,
          }}
        >
          {/* Base Soft Shadow */}
          <div
            className="absolute bottom-2 w-36 h-6 rounded-full pointer-events-none transition-opacity duration-300"
            style={{
              transform: 'translateZ(-30px)',
              background: 'radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 70%)',
              filter: 'blur(5px)',
            }}
          />

          {/* ── HIGH-END ROMANTIC VECTOR SCENE ── */}
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full overflow-visible drop-shadow-[0_10px_25px_rgba(244,63,94,0.2)]"
            style={{ transform: 'translateZ(10px)' }}
          >
            <defs>
              {/* Moon Glow Gradient */}
              <radialGradient id="moon-g" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fffae6" />
                <stop offset="40%" stopColor="#ffecb3" />
                <stop offset="100%" stopColor="rgba(251,191,36,0)" />
              </radialGradient>

              {/* Boy Bear Body Gradient */}
              <linearGradient id="bear-g" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e3af92" />
                <stop offset="100%" stopColor="#966d54" />
              </linearGradient>

              {/* Girl Bunny Body Gradient */}
              <linearGradient id="bunny-g" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#ffd1df" />
              </linearGradient>
            </defs>

            {/* 1. THE GLOWING FULL MOON (पृष्ठभूमि में चाँद) */}
            <circle cx="100" cy="90" r="48" fill="url(#moon-g)" opacity="0.85" />

            {/* 2. THE HILL (घास की छोटी सी पहाड़ी) */}
            <path 
              d="M15 155 C 60 142, 140 142, 185 155 L 185 180 L 15 180 Z" 
              fill="rgba(26,20,54,0.8)" 
              stroke="rgba(244,63,94,0.2)"
              strokeWidth="1.5"
            />
            {/* Tiny grass sprout */}
            <path d="M155 146 C152 142, 151 138, 154 139 C157 140, 156 144, 155 146 Z" fill="#ec4899" opacity="0.7"/>

            {/* 3. BOY BEAR (प्यारा नन्हा भालू - बाईं तरफ) */}
            <g className="anim-boy">
              {/* Tail */}
              <circle cx="48" cy="132" r="5" fill="#966d54" className="anim-tail" />
              {/* Body */}
              <ellipse cx="65" cy="128" rx="14" ry="16" fill="url(#bear-g)" stroke="#422919" strokeWidth="1" />
              {/* Feet */}
              <ellipse cx="56" cy="141" rx="5" ry="3.5" fill="#80563f" />
              <ellipse cx="74" cy="141" rx="5" ry="3.5" fill="#80563f" />
              
              {/* Head */}
              <circle cx="68" cy="108" r="15" fill="url(#bear-g)" stroke="#422919" strokeWidth="1" />
              
              {/* Bear Ears */}
              <circle cx="56" cy="97" r="5.5" fill="#966d54" stroke="#422919" strokeWidth="1" />
              <circle cx="56" cy="97" r="2.8" fill="#ffd1df" />
              <circle cx="80" cy="97" r="5.5" fill="#966d54" stroke="#422919" strokeWidth="1" />
              <circle cx="80" cy="97" r="2.8" fill="#ffd1df" />

              {/* Eyes (Looking right, happy) */}
              <ellipse cx="67" cy="106" rx="1.5" ry="2.2" fill="#121124" />
              <ellipse cx="74" cy="106" rx="1.5" ry="2.2" fill="#121124" />
              <circle cx="67.5" cy="105.2" r="0.6" fill="#ffffff" />
              <circle cx="74.5" cy="105.2" r="0.6" fill="#ffffff" />

              {/* Snout & Smile */}
              <ellipse cx="71" cy="112" rx="4.5" ry="3.2" fill="#fcf0e8" />
              <circle cx="71" cy="110.2" r="1.5" fill="#2d170c" />
              <path d="M69 113.2 Q71 115, 73 113.2" stroke="#2d170c" strokeWidth="1" strokeLinecap="round" fill="none" />

              {/* Cheerful blushing cheeks */}
              <ellipse cx="63" cy="110" rx="2.5" ry="1.5" fill="#f43f5e" opacity="0.45" />

              {/* Holding Arm (Left) */}
              <ellipse cx="76" cy="126" rx="5.5" ry="4" fill="#966d54" stroke="#422919" strokeWidth="0.8" />
            </g>

            {/* 4. GIRL BUNNY (प्यारी बनी खरगोश - दाईं तरफ) */}
            <g className="anim-girl">
              {/* Body (Cute Dress) */}
              <path d="M121 140 L126 120 L144 120 L149 140 Z" fill="#f43f5e" stroke="#5c061e" strokeWidth="1" />
              {/* Feet */}
              <ellipse cx="127" cy="141" rx="5" ry="3.5" fill="#ffd1df" stroke="#5c061e" strokeWidth="0.8" />
              <ellipse cx="143" cy="141" rx="5" ry="3.5" fill="#ffd1df" stroke="#5c061e" strokeWidth="0.8" />
              
              {/* Head */}
              <circle cx="135" cy="108" r="14.5" fill="url(#bunny-g)" stroke="#5c061e" strokeWidth="1" />
              
              {/* Long Bunny Ears */}
              <g transform="rotate(-10, 126, 96)">
                <rect x="123" y="74" width="6" height="20" rx="3" fill="#ffffff" stroke="#5c061e" strokeWidth="1" />
                <rect x="124.5" y="78" width="3" height="14" rx="1.5" fill="#ffb3c6" />
              </g>
              <g transform="rotate(15, 144, 96)">
                <rect x="141" y="74" width="6" height="20" rx="3" fill="#ffffff" stroke="#5c061e" strokeWidth="1" />
                <rect x="142.5" y="78" width="3" height="14" rx="1.5" fill="#ffb3c6" />
              </g>

              {/* Minnie Ribbon/Bow on left ear */}
              <path d="M121 89 L126 91 L121 93 Z" fill="#f43f5e" />
              <path d="M131 89 L126 91 L131 93 Z" fill="#f43f5e" />
              <circle cx="126" cy="91" r="1.5" fill="#ffffff" />

              {/* Eyes with eyelashes */}
              <ellipse cx="127" cy="106" rx="1.5" ry="2.2" fill="#121124" />
              <ellipse cx="134" cy="106" rx="1.5" ry="2.2" fill="#121124" />
              <circle cx="126.5" cy="105.2" r="0.6" fill="#ffffff" />
              <circle cx="133.5" cy="105.2" r="0.6" fill="#ffffff" />
              {/* Eyelashes */}
              <path d="M124.5 104 C124.5 104, 125 102.5, 126 103" stroke="#121124" strokeWidth="0.8" strokeLinecap="round" />
              <path d="M136.5 104 C136.5 104, 136 102.5, 135 103" stroke="#121124" strokeWidth="0.8" strokeLinecap="round" />

              {/* Nose & Smile */}
              <ellipse cx="130.5" cy="111" rx="1.5" ry="1" fill="#f43f5e" />
              <path d="M129 113 Q130.5 114.5, 132 113" stroke="#5c061e" strokeWidth="0.8" fill="none" />

              {/* Rosy Cheeks */}
              <ellipse cx="138" cy="110" rx="2.5" ry="1.5" fill="#f43f5e" opacity="0.45" />

              {/* Holding Arm (Right) */}
              <ellipse cx="124" cy="126" rx="5.5" ry="4" fill="#ffffff" stroke="#5c061e" strokeWidth="0.8" />
            </g>

            {/* 5. HANDS JOINED DETAIL (दोनों के हाथ जुड़ने का स्थान) */}
            {/* Soft pink heart popping where they meet */}
            <path 
              d="M100 126 C100 126, 99 123.5, 96.5 123.5 C94 123.5, 92.5 125.5, 92.5 127.5 C92.5 129.5, 96.5 132.5, 100 134 C103.5 132.5, 107.5 129.5, 107.5 127.5 C107.5 125.5, 106 123.5, 103.5 123.5 C101 123.5, 100 126, 100 126 Z" 
              fill="#fb7185" 
              className="animate-pulse"
              style={{ transformOrigin: '100px 128px' }}
            />

            {/* ── 6. FLOATING HEARTS (हवा में उड़ते जादुई दिल) ── */}
            <g className="anim-heart-1" style={{ transformOrigin: '92px 115px' }}>
              <path d="M92 115 C92 115, 91 113, 89 113 C87 113, 86 114.5, 86 116 C86 118, 89 120.5, 92 122 C95 120.5, 98 118, 98 116 C98 114.5, 97 113, 95 113 C93 113, 92 115, 92 115 Z" fill="#f43f5e" />
            </g>
            <g className="anim-heart-2" style={{ transformOrigin: '108px 110px' }}>
              <path d="M108 110 C108 110, 107 108.5, 105.5 108.5 C104 108.5, 103 109.5, 103 111 C103 112.5, 105.5 114.5, 108 115.5 C110.5 114.5, 113 112.5, 113 111 C113 109.5, 112 108.5, 110.5 108.5 C109 108.5, 108 110, 108 110 Z" fill="#fbbf24" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
