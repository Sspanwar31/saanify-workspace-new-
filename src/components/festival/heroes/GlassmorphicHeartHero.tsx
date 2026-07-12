'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

export default function GlassmorphicHeartHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; duration: number; delay: number; opacity: number }>>([]);
  const rafRef = useRef<number>(0);
  const targetTilt = useRef({ x: 0, y: 0 });
  const currentTilt = useRef({ x: 0, y: 0 });

  // Generate floating particles once
  useEffect(() => {
    const p = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 6 + 4,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.5 + 0.2,
    }));
    setParticles(p);
  }, []);

  // Smooth spring-like tilt interpolation
  const animate = useCallback(() => {
    const spring = 0.08;
    const damping = 0.85;
    currentTilt.current.x += (targetTilt.current.x - currentTilt.current.x) * spring;
    currentTilt.current.y += (targetTilt.current.y - currentTilt.current.y) * spring;
    currentTilt.current.x *= damping;
    currentTilt.current.y *= damping;
    setTilt({ x: currentTilt.current.x, y: currentTilt.current.y });
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    targetTilt.current = { x: y * -18, y: x * 18 };
    setMousePos({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    });
  };

  const handleMouseLeave = () => {
    setHovered(false);
    targetTilt.current = { x: 0, y: 0 };
  };

  return (
    <div className="relative flex items-center justify-center w-full h-full select-none">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float-soft {
          0%, 100% { transform: translateY(0px) scale(1); opacity: var(--p-opacity); }
          50% { transform: translateY(-12px) scale(1.1); opacity: calc(var(--p-opacity) * 1.5); }
        }
        @keyframes hero-bob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes shimmer-move {
          0% { transform: translateX(-100%) translateY(-100%) rotate(25deg); }
          100% { transform: translateX(200%) translateY(200%) rotate(25deg); }
        }
        @keyframes heart-float-1 {
          0% { transform: translateY(0) scale(0.8) rotate(0deg); opacity: 0; }
          15% { opacity: 0.9; }
          85% { opacity: 0.6; }
          100% { transform: translateY(-60px) scale(1.1) rotate(12deg); opacity: 0; }
        }
        @keyframes heart-float-2 {
          0% { transform: translateY(0) scale(0.7) rotate(0deg); opacity: 0; }
          15% { opacity: 0.8; }
          85% { opacity: 0.5; }
          100% { transform: translateY(-50px) scale(0.9) rotate(-10deg); opacity: 0; }
        }
        @keyframes heart-float-3 {
          0% { transform: translateY(0) scale(0.6) rotate(0deg); opacity: 0; }
          15% { opacity: 0.7; }
          85% { opacity: 0.4; }
          100% { transform: translateY(-55px) scale(1) rotate(8deg); opacity: 0; }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        @keyframes ring-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes subtle-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.015); }
        }
        .hero-bob { animation: hero-bob 4s ease-in-out infinite; }
        .shimmer-bar { animation: shimmer-move 3.5s ease-in-out infinite; }
        .glow-pulse { animation: glow-pulse 3s ease-in-out infinite; }
        .ring-spin { animation: ring-rotate 20s linear infinite; }
        .subtle-breathe { animation: subtle-breathe 4s ease-in-out infinite; }
      ` }} />

      {/* ── AMBIENT GLOW LAYERS ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="glow-pulse absolute rounded-full" style={{
          width: '280px', height: '280px',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(244,63,94,0.18) 0%, rgba(251,113,133,0.08) 40%, transparent 70%)',
          filter: 'blur(30px)',
        }} />
        <div className="glow-pulse absolute rounded-full" style={{
          width: '200px', height: '200px',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(251,191,36,0.1) 0%, transparent 60%)',
          filter: 'blur(25px)',
          animationDelay: '1.5s',
        }} />
      </div>

      {/* ── FLOATING PARTICLES ── */}
      <div className="absolute inset-0 pointer-events-none overflow-visible" aria-hidden="true">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: p.id % 3 === 0 ? '#f43f5e' : p.id % 3 === 1 ? '#fbbf24' : '#fb7185',
              opacity: p.opacity,
              ['--p-opacity' as string]: p.opacity,
              animation: `float-soft ${p.duration}s ease-in-out infinite ${p.delay}s`,
              filter: 'blur(0.5px)',
            }}
          />
        ))}
      </div>

      {/* ── 3D TILT CONTAINER ── */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleMouseLeave}
        className="relative cursor-pointer"
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative transition-[filter] duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${hovered ? 1.04 : 1})`,
            filter: hovered ? 'brightness(1.05)' : 'brightness(1)',
          }}
        >

          {/* ── GLASS CARD ── */}
          <div className="relative w-56 h-56 sm:w-72 sm:h-72 rounded-[2rem] overflow-hidden subtle-breathe"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 50%, rgba(251,113,133,0.06) 100%)',
              backdropFilter: 'blur(24px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: `
                0 8px 32px rgba(244,63,94,0.12),
                0 2px 8px rgba(0,0,0,0.08),
                inset 0 1px 0 rgba(255,255,255,0.2),
                inset 0 -1px 0 rgba(255,255,255,0.05)
              `,
              transform: 'translateZ(0px)',
            }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ borderRadius: 'inherit' }}>
              <div className="shimmer-bar absolute" style={{
                width: '60%', height: '60%',
                top: '-30%', left: '-30%',
                background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.08) 55%, transparent 60%)',
                filter: 'blur(2px)',
              }} />
            </div>

            {/* Mouse-following light */}
            {hovered && (
              <div className="absolute inset-0 pointer-events-none transition-opacity duration-300" style={{
                background: `radial-gradient(350px circle at ${mousePos.x}% ${mousePos.y}%, rgba(255,255,255,0.06), transparent 60%)`,
              }} />
            )}

            {/* ── SVG ILLUSTRATION ── */}
            <div className="absolute inset-0 flex items-center justify-center hero-bob">
              <svg viewBox="0 0 240 240" className="w-[85%] h-[85%]" style={{ transform: 'translateZ(15px)' }}>
                <defs>
                  {/* Premium Gradients */}
                  <linearGradient id="moon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fff9e6" />
                    <stop offset="50%" stopColor="#ffecb3" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.3" />
                  </linearGradient>
                  <linearGradient id="moon-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.1" />
                  </linearGradient>
                  <linearGradient id="bear-body" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#e8b89a" />
                    <stop offset="100%" stopColor="#a67a5e" />
                  </linearGradient>
                  <linearGradient id="bear-head" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f0c4a8" />
                    <stop offset="100%" stopColor="#b8886a" />
                  </linearGradient>
                  <linearGradient id="bunny-body" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#fce4ec" />
                  </linearGradient>
                  <linearGradient id="dress-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fb7185" />
                    <stop offset="100%" stopColor="#e11d48" />
                  </linearGradient>
                  <linearGradient id="heart-center" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff6b8a" />
                    <stop offset="100%" stopColor="#f43f5e" />
                  </linearGradient>
                  <linearGradient id="hill-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#1a1440" />
                    <stop offset="100%" stopColor="#0f0a2e" />
                  </linearGradient>
                  <radialGradient id="blush" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                  </radialGradient>
                  {/* Soft shadow filter */}
                  <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                    <feOffset dx="0" dy="4" />
                    <feComponentTransfer><feFuncA type="linear" slope="0.15" /></feComponentTransfer>
                    <feMerge>
                      <feMergeNode />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  {/* Glow filter for heart */}
                  <filter id="heart-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
                    <feColorMatrix type="matrix" values="1 0 0 0 0  0 0.2 0.3 0 0  0 0 0.3 0 0  0 0 0 0.6 0" />
                    <feMerge>
                      <feMergeNode />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  {/* Star glow */}
                  <filter id="star-glow" x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
                  </filter>
                </defs>

                {/* ── STARS ── */}
                <circle cx="40" cy="35" r="1.2" fill="#fbbf24" opacity="0.7" filter="url(#star-glow)" />
                <circle cx="195" cy="28" r="1" fill="#fbbf24" opacity="0.6" filter="url(#star-glow)" />
                <circle cx="170" cy="55" r="0.8" fill="#ffffff" opacity="0.5" filter="url(#star-glow)" />
                <circle cx="55" cy="60" r="0.9" fill="#ffffff" opacity="0.4" filter="url(#star-glow)" />
                <circle cx="30" cy="80" r="0.7" fill="#fbbf24" opacity="0.5" filter="url(#star-glow)" />
                <circle cx="210" cy="75" r="1.1" fill="#fbbf24" opacity="0.4" filter="url(#star-glow)" />

                {/* ── MOON WITH RING ── */}
                <g className="ring-spin" style={{ transformOrigin: '120px 80px' }}>
                  <circle cx="120" cy="80" r="52" fill="none" stroke="url(#moon-ring)" strokeWidth="0.5" strokeDasharray="4 6" opacity="0.5" />
                </g>
                <circle cx="120" cy="80" r="42" fill="url(#moon-grad)" opacity="0.85" />
                {/* Moon craters (subtle) */}
                <circle cx="110" cy="72" r="4" fill="rgba(217,170,80,0.15)" />
                <circle cx="128" cy="85" r="3" fill="rgba(217,170,80,0.12)" />
                <circle cx="118" cy="90" r="2.5" fill="rgba(217,170,80,0.1)" />

                {/* ── HILL ── */}
                <path d="M10 175 C50 158, 100 152, 120 155 C140 158, 190 158, 230 175 L230 210 L10 210 Z" fill="url(#hill-grad)" />
                <path d="M10 175 C50 158, 100 152, 120 155 C140 158, 190 158, 230 175" fill="none" stroke="rgba(244,63,94,0.15)" strokeWidth="1" />
                {/* Grass details */}
                <path d="M45 170 C44 166, 42 163, 44 164 C46 165, 45 168, 45 170Z" fill="#2dd4bf" opacity="0.4" />
                <path d="M180 169 C179 165, 177 162, 179 163 C181 164, 180 167, 180 169Z" fill="#2dd4bf" opacity="0.35" />
                <path d="M100 163 C99 159, 97 156, 99 157 C101 158, 100 161, 100 163Z" fill="#2dd4bf" opacity="0.3" />

                {/* ── BOY BEAR ── */}
                <g filter="url(#soft-shadow)">
                  {/* Tail */}
                  <ellipse cx="50" cy="152" rx="4.5" ry="4" fill="#a67a5e" transform="rotate(-20, 50, 152)" />

                  {/* Body */}
                  <ellipse cx="72" cy="148" rx="16" ry="18" fill="url(#bear-body)" />

                  {/* Belly patch */}
                  <ellipse cx="74" cy="150" rx="9" ry="10" fill="#f5ddd0" opacity="0.7" />

                  {/* Feet */}
                  <ellipse cx="62" cy="164" rx="6" ry="4" fill="#8b6245" rx="3" />
                  <ellipse cx="82" cy="164" rx="6" ry="4" fill="#8b6245" rx="3" />
                  {/* Toe lines */}
                  <path d="M60 163 L60 165" stroke="#6b4830" strokeWidth="0.6" strokeLinecap="round" />
                  <path d="M63 163 L63 165.5" stroke="#6b4830" strokeWidth="0.6" strokeLinecap="round" />
                  <path d="M80 163 L80 165" stroke="#6b4830" strokeWidth="0.6" strokeLinecap="round" />
                  <path d="M83 163 L83 165.5" stroke="#6b4830" strokeWidth="0.6" strokeLinecap="round" />

                  {/* Left arm (down) */}
                  <ellipse cx="57" cy="146" rx="5" ry="8" fill="#a67a5e" transform="rotate(10, 57, 146)" />

                  {/* Right arm (reaching toward bunny) */}
                  <ellipse cx="88" cy="142" rx="5" ry="9" fill="#a67a5e" transform="rotate(-25, 88, 142)" />
                  {/* Paw */}
                  <circle cx="92" cy="134" r="4" fill="#c4956e" />

                  {/* Head */}
                  <circle cx="76" cy="122" r="17" fill="url(#bear-head)" />

                  {/* Ears */}
                  <circle cx="63" cy="109" r="6.5" fill="#a67a5e" />
                  <circle cx="63" cy="109" r="3.5" fill="#f5ddd0" />
                  <circle cx="89" cy="109" r="6.5" fill="#a67a5e" />
                  <circle cx="89" cy="109" r="3.5" fill="#f5ddd0" />

                  {/* Eyes — looking right toward bunny */}
                  <ellipse cx="71" cy="120" rx="2" ry="2.8" fill="#1a1030" />
                  <ellipse cx="82" cy="120" rx="2" ry="2.8" fill="#1a1030" />
                  {/* Eye highlights */}
                  <circle cx="72" cy="119" r="0.9" fill="#ffffff" />
                  <circle cx="83" cy="119" r="0.9" fill="#ffffff" />
                  <circle cx="70.5" cy="121" r="0.4" fill="#ffffff" opacity="0.6" />

                  {/* Eyebrows (subtle, happy) */}
                  <path d="M68 116 Q71 114.5, 74 116" stroke="#6b4830" strokeWidth="0.8" fill="none" strokeLinecap="round" />
                  <path d="M79 116 Q82 114.5, 85 116" stroke="#6b4830" strokeWidth="0.8" fill="none" strokeLinecap="round" />

                  {/* Snout */}
                  <ellipse cx="77" cy="127" rx="5.5" ry="4" fill="#f5ddd0" />
                  <ellipse cx="77" cy="125.5" rx="2" ry="1.5" fill="#4a2a18" />
                  {/* Smile */}
                  <path d="M74 129 Q77 132, 80 129" stroke="#4a2a18" strokeWidth="1" strokeLinecap="round" fill="none" />

                  {/* Blush */}
                  <ellipse cx="66" cy="125" rx="4" ry="2.5" fill="url(#blush)" />
                </g>

                {/* ── GIRL BUNNY ── */}
                <g filter="url(#soft-shadow)">
                  {/* Body with dress */}
                  <path d="M142 175 L148 148 L172 148 L178 175 Z" fill="url(#dress-grad)" />
                  {/* Dress collar / top */}
                  <ellipse cx="160" cy="148" rx="14" ry="5" fill="#fce4ec" />
                  {/* Dress details - little bow */}
                  <path d="M156 152 L160 154 L156 156Z" fill="#ffffff" opacity="0.6" />
                  <path d="M164 152 L160 154 L164 156Z" fill="#ffffff" opacity="0.6" />

                  {/* Feet */}
                  <ellipse cx="148" cy="176" rx="5.5" ry="3.5" fill="#fce4ec" />
                  <ellipse cx="172" cy="176" rx="5.5" ry="3.5" fill="#fce4ec" />

                  {/* Left arm (reaching toward bear) */}
                  <ellipse cx="146" cy="142" rx="5" ry="9" fill="#ffffff" transform="rotate(25, 146, 142)" />
                  {/* Paw */}
                  <circle cx="142" cy="134" r="3.5" fill="#fce4ec" />

                  {/* Right arm (down, holding skirt) */}
                  <ellipse cx="174" cy="150" rx="5" ry="8" fill="#ffffff" transform="rotate(-10, 174, 150)" />

                  {/* Head */}
                  <circle cx="160" cy="125" r="16" fill="url(#bunny-body)" />

                  {/* Long bunny ears */}
                  <g>
                    <path d="M150 113 Q146 88, 152 72 Q156 80, 154 113Z" fill="#ffffff" stroke="#e8b0c4" strokeWidth="0.8" />
                    <path d="M151 110 Q148 90, 153 78 Q155 85, 153 110Z" fill="#ffb3c6" opacity="0.6" />
                  </g>
                  <g>
                    <path d="M166 111 Q170 86, 164 70 Q160 78, 162 111Z" fill="#ffffff" stroke="#e8b0c4" strokeWidth="0.8" />
                    <path d="M165 108 Q168 88, 163 76 Q161 83, 163 108Z" fill="#ffb3c6" opacity="0.6" />
                  </g>

                  {/* Bow on left ear */}
                  <path d="M146 88 L150 91 L146 94Z" fill="#f43f5e" />
                  <path d="M154 88 L150 91 L154 94Z" fill="#f43f5e" />
                  <circle cx="150" cy="91" r="1.8" fill="#ffffff" />

                  {/* Eyes — looking left toward bear */}
                  <ellipse cx="153" cy="123" rx="2" ry="2.8" fill="#1a1030" />
                  <ellipse cx="164" cy="123" rx="2" ry="2.8" fill="#1a1030" />
                  {/* Eye highlights */}
                  <circle cx="152" cy="122" r="0.9" fill="#ffffff" />
                  <circle cx="163" cy="122" r="0.9" fill="#ffffff" />
                  <circle cx="153.5" cy="124" r="0.4" fill="#ffffff" opacity="0.6" />

                  {/* Eyelashes */}
                  <path d="M150 121 Q150.5 119, 151.5 120" stroke="#1a1030" strokeWidth="0.8" strokeLinecap="round" />
                  <path d="M166 121 Q165.5 119, 164.5 120" stroke="#1a1030" strokeWidth="0.8" strokeLinecap="round" />

                  {/* Eyebrows */}
                  <path d="M150 119 Q153 117.5, 156 119" stroke="#c4808f" strokeWidth="0.7" fill="none" strokeLinecap="round" />
                  <path d="M161 119 Q164 117.5, 167 119" stroke="#c4808f" strokeWidth="0.7" fill="none" strokeLinecap="round" />

                  {/* Nose */}
                  <ellipse cx="158.5" cy="128" rx="1.8" ry="1.2" fill="#f43f5e" />

                  {/* Smile */}
                  <path d="M156 130.5 Q158.5 133, 161 130.5" stroke="#c4808f" strokeWidth="0.8" fill="none" strokeLinecap="round" />

                  {/* Blush */}
                  <ellipse cx="168" cy="128" rx="4" ry="2.5" fill="url(#blush)" />
                  <ellipse cx="150" cy="128" rx="3" ry="2" fill="url(#blush)" opacity="0.5" />
                </g>

                {/* ── HANDS MEETING — GLOWING HEART ── */}
                <g filter="url(#heart-glow)">
                  <path
                    d="M117 130 C117 130, 115.5 126.5, 112.5 126.5 C109.5 126.5, 107.5 129, 107.5 131.5 C107.5 135, 113 139, 117 141 C121 139, 126.5 135, 126.5 131.5 C126.5 129, 124.5 126.5, 121.5 126.5 C118.5 126.5, 117 130, 117 130 Z"
                    fill="url(#heart-center)"
                  />
                  {/* Heart highlight */}
                  <ellipse cx="113" cy="129" rx="2" ry="1.5" fill="#ffffff" opacity="0.35" transform="rotate(-20, 113, 129)" />
                </g>

                {/* ── FLOATING HEARTS ── */}
                <g style={{ animation: 'heart-float-1 3s ease-in-out infinite', transformOrigin: '100px 115px' }}>
                  <path d="M100 115 C100 115, 99 112.5, 97 112.5 C95 112.5, 93.5 114, 93.5 115.8 C93.5 118.5, 97 121, 100 122.5 C103 121, 106.5 118.5, 106.5 115.8 C106.5 114, 105 112.5, 103 112.5 C101 112.5, 100 115, 100 115Z" fill="#f43f5e" opacity="0.8" />
                </g>
                <g style={{ animation: 'heart-float-2 3.5s ease-in-out infinite 0.8s', transformOrigin: '130px 108px' }}>
                  <path d="M130 108 C130 108, 129 106, 127.5 106 C126 106, 125 107.2, 125 108.5 C125 110.5, 127.5 112.5, 130 113.5 C132.5 112.5, 135 110.5, 135 108.5 C135 107.2, 134 106, 132.5 106 C131 106, 130 108, 130 108Z" fill="#fbbf24" opacity="0.7" />
                </g>
                <g style={{ animation: 'heart-float-3 4s ease-in-out infinite 1.6s', transformOrigin: '88px 105px' }}>
                  <path d="M88 105 C88 105, 87.2 103.5, 86 103.5 C84.8 103.5, 84 104.5, 84 105.5 C84 107, 86 108.5, 88 109.2 C90 108.5, 92 107, 92 105.5 C92 104.5, 91.2 103.5, 90 103.5 C88.8 103.5, 88 105, 88 105Z" fill="#fb7185" opacity="0.6" />
                </g>
                <g style={{ animation: 'heart-float-1 3.2s ease-in-out infinite 2.2s', transformOrigin: '140px 100px' }}>
                  <path d="M140 100 C140 100, 139.3 98.5, 138.2 98.5 C137.1 98.5, 136.2 99.5, 136.2 100.5 C136.2 102, 138 103.5, 140 104.2 C142 103.5, 143.8 102, 143.8 100.5 C143.8 99.5, 142.9 98.5, 141.8 98.5 C140.7 98.5, 140 100, 140 100Z" fill="#fda4af" opacity="0.5" />
                </g>
              </svg>
            </div>
          </div>

          {/* ── BOTTOM REFLECTION/GLOW ── */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-5 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse, rgba(244,63,94,0.2) 0%, transparent 70%)',
              filter: 'blur(8px)',
              transform: `translateZ(-20px) translateX(-50%) scaleX(${hovered ? 1.1 : 1})`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
