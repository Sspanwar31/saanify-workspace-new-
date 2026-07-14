'use client';

import React, { useState, useRef } from 'react';

export default function GaneshaHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // कोमल 3D पैरालैक्स झुकाव (Tilt Effect)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    setRotate({
      x: y * -20, // 20 डिग्री तक झुकाव
      y: x * 20,
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full select-none overflow-visible">
      
      {/* ── 🚀 CSS ANIMATIONS ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bappa-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes aura-pulse {
          0%, 100% { opacity: 0.18; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(1.1); }
        }
        .anim-bappa {
          animation: bappa-float 4s ease-in-out infinite;
        }
        .anim-aura {
          animation: aura-pulse 3s ease-in-out infinite;
        }
      ` }} />

      {/* ── 1. DIVINE AURA (पीछे की केसरिया-पीली चमक) ── */}
      <div className="absolute w-44 h-44 rounded-full bg-gradient-to-r from-yellow-500/20 via-red-500/10 to-yellow-500/20 blur-3xl pointer-events-none anim-aura" />

      {/* ── 2. 3D TILT CONTAINER ── */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center overflow-visible"
        style={{
          perspective: '800px',
        }}
      >
        <div
          className="relative w-full h-full transition-transform duration-300 ease-out flex items-center justify-center overflow-visible anim-bappa"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale(${isHovered ? 1.08 : 1})`,
          }}
        >
          {/* Base Soft Shadow (कमल के नीचे की परछाई) */}
          <div 
            className="absolute bottom-1 w-28 h-4 rounded-full pointer-events-none transition-all duration-300" 
            style={{
              transform: 'translateZ(-20px)',
              background: 'radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)',
              filter: 'blur(4px)',
            }}
          />

          {/* ── 3. DETAILED CUTE BAPPA ILLUSTRATION (100% Symmetrical) ── */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://cgntcihiwlzwkurkkarr.supabase.co/storage/v1/object/public/broadcasts/GANESH%20JI/Screenshot_2026-07-13_071236-removebg-preview.png"
            alt="Lord Ganesha"
            className="w-full h-full object-contain drop-shadow-[0_15px_30px_rgba(251,191,36,0.35)]"
            style={{
              transform: 'translateZ(15px)',
            }}
          />

          {/* Golden specular shine effect on hover */}
          {isHovered && (
            <div 
              className="absolute inset-0 bg-gradient-to-tr from-yellow-500/0 via-white/10 to-yellow-500/0 pointer-events-none rounded-full"
              style={{
                transform: 'translateZ(20px)',
                mixBlendMode: 'overlay',
              }}
            />
          )}

        </div>
      </div>
    </div>
  );
}
