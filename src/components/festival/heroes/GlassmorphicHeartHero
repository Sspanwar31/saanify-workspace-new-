'use client';

import React, { useState, useEffect, useRef } from 'react';

interface GlassmorphicHeartHeroProps {
  onOpenLetter: () => void;
  partnerName?: string;
}

export default function GlassmorphicHeartHero({
  onOpenLetter,
  partnerName = "Someone Special",
}: GlassmorphicHeartHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [shine, setShine] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  // माउस मूवमेंट के आधार पर 3D झुकाव (Tilt) और चमक (Shine) की गणना
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // कार्ड के सापेक्ष माउस की स्थिति (-0.5 से 0.5 के बीच)
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    // 3D रोटेशन लिमिट्स
    setRotate({
      x: y * -25, // X-axis पर 25 डिग्री तक झुकाव
      y: x * 25,  // Y-axis पर 25 डिग्री तक झुकाव
    });

    // ग्लास रिफ्लेक्शन की स्थिति (0% से 100% के बीच)
    setShine({
      x: (x + 0.5) * 100,
      y: (y + 0.5) * 100,
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // माउस हटने पर दिल को वापस सामान्य स्थिति में लाना
    setRotate({ x: 0, y: 0 });
    setShine({ x: 50, y: 50 });
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[#020512] text-white px-4">
      
      {/* ── 1. AMBIENT BACKGROUND GLOWS ── */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-pink-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />
      
      {/* ── 2. CONSTANT FLOATING PARTICLES ── */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/3 left-1/3 w-2 h-2 bg-pink-400 rounded-full animate-ping delay-100" />
        <div className="absolute top-2/3 right-1/4 w-3 h-3 bg-red-400/50 rounded-full animate-bounce duration-1000" />
        <div className="absolute bottom-1/3 left-1/4 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
      </div>

      {/* ── 3. HERO CONTENT CONTAINER ── */}
      <div className="z-10 text-center max-w-lg mx-auto flex flex-col items-center">
        
        {/* Soft Warm Subtitle */}
        <p className="text-pink-300/80 font-medium tracking-[0.25em] text-xs sm:text-sm uppercase mb-4 animate-pulse">
          A Magical Gift For You
        </p>

        {/* ── 4. 3D GLASS HEART PORTAL ── */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={handleMouseLeave}
          onClick={onOpenLetter}
          className="relative w-72 h-72 sm:w-80 sm:h-80 cursor-pointer flex items-center justify-center group select-none mb-10"
          style={{
            perspective: '1000px',
          }}
        >
          {/* Back Glowing Shadow Layer (गहरे रंग का बैक-ग्लो) */}
          <div 
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-red-600 to-pink-500 opacity-20 blur-3xl transition-transform duration-500 scale-95"
            style={{
              transform: `translateZ(-40px) scale(${isHovered ? 1.15 : 1})`,
            }}
          />

          {/* MAIN 3D TILT BODY */}
          <div
            className="relative w-full h-full transition-all duration-300 ease-out flex items-center justify-center"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
            }}
          >
            {/* SVG MASKED GLASS HEART PORTAL */}
            <svg
              viewBox="0 0 100 100"
              className="absolute w-full h-full drop-shadow-[0_20px_50px_rgba(219,39,119,0.3)] filter"
              style={{ transform: 'translateZ(20px)' }}
            >
              <defs>
                {/* दिल की क्लिपिंग मास्क (ग्लास के अंदर तत्वों को रखने के लिए) */}
                <clipPath id="heart-clip">
                  <path d="M50 85 C15 55, 5 35, 5 22 C5 10, 20 5, 35 12 C50 25, 50 25, 50 25 C50 25, 50 25, 65 12 C80 5, 95 10, 95 22 C95 35, 85 55, 50 85 Z" />
                </clipPath>

                {/* रिफ्लेक्टिव शाइन लीनियर ग्रेडिएंट */}
                <linearGradient id="shine-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.01)" />
                  <stop offset={`${shine.x - 20}%`} stopColor="rgba(255,255,255,0.0)" />
                  <stop offset={`${shine.x}%`} stopColor="rgba(255,255,255,0.22)" />
                  <stop offset={`${shine.x + 20}%`} stopColor="rgba(255,255,255,0.0)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.01)" />
                </linearGradient>

                {/* ग्लास एज बॉर्डर ग्रेडिएंट */}
                <linearGradient id="edge-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255, 255, 255, 0.4)" />
                  <stop offset="40%" stopColor="rgba(219, 39, 119, 0.15)" />
                  <stop offset="100%" stopColor="rgba(251, 191, 36, 0.45)" />
                </linearGradient>
              </defs>

              {/* ── GLASS BODY FILL (Frosted Glass Effect) ── */}
              <path
                d="M50 85 C15 55, 5 35, 5 22 C5 10, 20 5, 35 12 C50 25, 50 25, 50 25 C50 25, 50 25, 65 12 C80 5, 95 10, 95 22 C95 35, 85 55, 50 85 Z"
                fill="rgba(255, 255, 255, 0.03)"
                className="backdrop-blur-[24px]"
                style={{
                  backdropFilter: 'blur(24px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                }}
              />

              {/* ── SHIMMER SHINE LAYER (Dynamic light reflection) ── */}
              <path
                d="M50 85 C15 55, 5 35, 5 22 C5 10, 20 5, 35 12 C50 25, 50 25, 50 25 C50 25, 50 25, 65 12 C80 5, 95 10, 95 22 C95 35, 85 55, 50 85 Z"
                fill="url(#shine-grad)"
                className="transition-all duration-100"
              />

              {/* ── MINI FLOATING HEART (Inside Glass Portal) ── */}
              <g clipPath="url(#heart-clip)">
                {/* धड़कता हुआ गर्म लाल कोर */}
                <circle 
                  cx="50" 
                  cy="40" 
                  r={isHovered ? '10' : '8'} 
                  fill="rgba(220, 38, 38, 0.35)" 
                  className="transition-all duration-700 blur-[6px] animate-pulse"
                />
                <circle 
                  cx="50" 
                  cy="40" 
                  r="4" 
                  fill="rgba(255, 255, 255, 0.85)" 
                  className="blur-[1px]"
                />
              </g>

              {/* ── OUTER GLOSSY BORDER (The elegant bezel) ── */}
              <path
                d="M50 85 C15 55, 5 35, 5 22 C5 10, 20 5, 35 12 C50 25, 50 25, 50 25 C50 25, 50 25, 65 12 C80 5, 95 10, 95 22 C95 35, 85 55, 50 85 Z"
                fill="none"
                stroke="url(#edge-grad)"
                strokeWidth="0.8"
                className="opacity-90"
              />
            </svg>

            {/* 3D Label overlaying closely inside the heart (3D गहराई के साथ) */}
            <div 
              className="absolute z-20 flex flex-col items-center pointer-events-none transition-transform duration-300"
              style={{
                transform: 'translateZ(35px)',
              }}
            >
              <span className="text-xs font-semibold tracking-[0.3em] uppercase text-pink-300/90 drop-shadow-md">
                Touch
              </span>
              <span className="text-[10px] tracking-[0.1em] text-white/50 uppercase mt-1">
                To Reveal
              </span>
            </div>
          </div>
        </div>

        {/* ── 5. HERO TEXT & INVITATION ── */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-b from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
          For {partnerName}
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 font-light mb-8 max-w-sm tracking-wide leading-relaxed">
          यह काँच का चमकता दिल आपकी यादों और एक खास संदेश को संजोए हुए है। इसे खोलकर महसूस करें।
        </p>

        {/* ── 6. GLASSMORPHIC CTA BUTTON ── */}
        <button
          onClick={onOpenLetter}
          className="relative px-8 py-3.5 rounded-full overflow-hidden group transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(244,63,94,0.15)]"
        >
          {/* Frosted Button BG */}
          <div className="absolute inset-0 bg-white/[0.04] backdrop-blur-[12px] border border-white/[0.12] rounded-full transition-colors group-hover:bg-white/[0.08]" />
          
          {/* Subtle Pink highlight overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
          
          {/* Button Label */}
          <span className="relative z-10 text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-pink-100 transition-colors group-hover:text-white flex items-center gap-2">
            Open Message
            <svg 
              className="w-4 h-4 text-pink-300 transform transition-transform group-hover:translate-x-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </span>
        </button>

      </div>
    </div>
  );
}
