'use client';

import { useState, useEffect, memo } from 'react';

const HoliAmbient = memo(() => {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    // 🎨 6 Holi Gulal Colors — MATTE powder (no white shine)
    const colors = [
      { main: '#ff006e', mid: '#e60063', dark: '#b8004f' },  // गुलाबी
      { main: '#ffbe0b', mid: '#e6ab0a', dark: '#cc9909' },  // पीला
      { main: '#06d6a0', mid: '#05c090', dark: '#04aa80' },  // हरा
      { main: '#3a86ff', mid: '#3478e6', dark: '#2e6acc' },  // नीला
      { main: '#8338ec', mid: '#7632d4', dark: '#692cbc' },  // बैंगनी
      { main: '#fb5607', mid: '#e24e06', dark: '#c94605' },  // नारंगी
    ];

    // Irregular shapes (powder chunks)
    const shapes = [
      '42% 58% 55% 45% / 50% 42% 58% 50%',
      '55% 45% 40% 60% / 58% 55% 45% 42%',
      '48% 52% 60% 40% / 44% 56% 44% 56%',
      '60% 40% 50% 50% / 52% 48% 52% 48%',
      '44% 56% 48% 52% / 56% 44% 56% 44%',
      '52% 48% 44% 56% / 48% 52% 48% 52%',
      '38% 62% 52% 48% / 54% 46% 54% 46%',
      '56% 44% 46% 54% / 46% 54% 46% 54%',
      '46% 54% 58% 42% / 42% 58% 46% 54%',
      '54% 46% 42% 58% / 58% 42% 54% 46%',
    ];

    // Generate 75 particles with size distribution
    const generated = Array.from({ length: 75 }, (_, i) => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];

      const sizeRoll = Math.random();
      let size: number;
      let blurAmount: number;
      let baseOpacity: number;

      if (sizeRoll < 0.4) {
        size = Math.random() * 3 + 2.5;
        blurAmount = 0.3;
        baseOpacity = 0.55;
      } else if (sizeRoll < 0.8) {
        size = Math.random() * 5 + 6.5; // Slightly larger for better contrast
        blurAmount = 0.8;
        baseOpacity = 0.75;
      } else {
        size = Math.random() * 12 + 14;
        blurAmount = 3;
        baseOpacity = 0.3;
      }

      return {
        id: i,
        size,
        heightRatio: 0.65 + Math.random() * 0.7,
        duration: Math.random() * 4 + 3.5, // Slightly faster, lively fall
        delay: -(Math.random() * 8),
        left: Math.random() * 100,
        drift: Math.random() * 50 - 25,
        swayAmount: Math.random() * 25 + 8,
        tumble: Math.random() * 60 - 30,
        color,
        shape,
        blur: blurAmount,
        opacity: baseOpacity,
        // Z-Index layer 2 ke upar distributed rahega
        zIndex: Math.random() > 0.5 ? 'z-[9998]' : 'z-[9997]'
      };
    });
    setSchedules(generated); // set to schedules/particles
    setParticles(generated);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <style>{`
        @keyframes gulal-powder-fall {
          0% {
            transform: translateY(-15px) translateX(0) rotate(0deg) scale(0.8);
            opacity: 0;
          }
          5% {
            opacity: var(--base-o);
            transform: translateY(2vh) translateX(0) rotate(0deg) scale(1);
          }
          15% {
            transform: translateY(15vh) translateX(calc(var(--sway) * 0.5px)) rotate(calc(var(--tumble) * 0.2deg)) scale(1);
          }
          30% {
            transform: translateY(30vh) translateX(calc(var(--sway) * -0.35px)) rotate(calc(var(--tumble) * 0.45deg)) scale(0.98);
          }
          50% {
            transform: translateY(50vh) translateX(calc(var(--sway) * 0.25px)) rotate(calc(var(--tumble) * 0.7deg)) scale(0.95);
            opacity: calc(var(--base-o) * 0.8);
          }
          70% {
            transform: translateY(70vh) translateX(calc(var(--sway) * -0.15px)) rotate(calc(var(--tumble) * 0.85deg)) scale(0.92);
            opacity: calc(var(--base-o) * 0.5);
          }
          85% {
            transform: translateY(85vh) translateX(calc(var(--drift) * 0.1px)) rotate(calc(var(--tumble) * 0.95deg)) scale(0.9);
            opacity: calc(var(--base-o) * 0.25);
          }
          100% {
            transform: translateY(110vh) translateX(calc(var(--drift) * 0.05px)) rotate(var(--tumble)) scale(0.85);
            opacity: 0;
          }
        }

        /* 🚀 NEW: Gulal Smoke Clouds Slow Floating Animations */
        @keyframes smoke-float-1 {
          0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 0.05; }
          50% { transform: translate(5%, -4%) scale(1.08) rotate(45deg); opacity: 0.09; }
        }
        @keyframes smoke-float-2 {
          0%, 100% { transform: translate(0, 0) scale(1.05) rotate(0deg); opacity: 0.04; }
          50% { transform: translate(-4%, 5%) scale(0.95) rotate(-35deg); opacity: 0.07; }
        }
        @keyframes smoke-float-3 {
          0%, 100% { transform: translate(0, 0) scale(0.98) rotate(0deg); opacity: 0.05; }
          50% { transform: translate(3%, 3%) scale(1.05) rotate(25deg); opacity: 0.08; }
        }
      `}</style>

      {/* ━━━ 🚀 NEW: 3 LARGE HARDWARE ACCELERATED HOLI SMOKE CLOUDS ━━━ */}
      
      {/* 1. Pink/Magenta Mist (Top Left) */}
      <div 
        className="absolute -top-[15%] -left-[10%] w-[60vw] h-[60vw] rounded-full mix-blend-screen pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255,0,110,0.55) 0%, rgba(230,0,99,0.2) 50%, transparent 75%)',
          filter: 'blur(100px)',
          animation: 'smoke-float-1 30s ease-in-out infinite',
        }}
      />

      {/* 2. Saffron/Yellow Mist (Bottom Right) */}
      <div 
        className="absolute -bottom-[20%] -right-[10%] w-[55vw] h-[55vw] rounded-full mix-blend-screen pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(251,86,7,0.45) 0%, rgba(255,190,11,0.18) 55%, transparent 75%)',
          filter: 'blur(120px)',
          animation: 'smoke-float-2 25s ease-in-out infinite',
        }}
      />

      {/* 3. Teal/Cyan Mist (Center Left) */}
      <div 
        className="absolute top-[30%] -left-[15%] w-[50vw] h-[50vw] rounded-full mix-blend-screen pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(6,214,160,0.4) 0%, rgba(58,134,255,0.15) 50%, transparent 75%)',
          filter: 'blur(110px)',
          animation: 'smoke-float-3 28s ease-in-out infinite',
        }}
      />

      {/* Falling Gulal Powder Chunks */}
      {particles.map(p => (
        <div
          key={p.id}
          className={`absolute will-change-transform ${p.zIndex}`}
          style={{
            width: p.size,
            height: p.size * p.heightRatio,
            left: `${p.left}%`,
            top: '-4%',
            background: `radial-gradient(ellipse at 40% 35%, ${p.color.main}, ${p.color.mid} 55%, ${p.color.dark} 100%)`,
            borderRadius: p.shape,
            filter: `blur(${p.blur}px)`,
            opacity: 0,
            animation: `gulal-powder-fall ${p.duration}s ${p.delay}s ease-in-out infinite`,
            ['--drift' as string]: p.drift,
            ['--sway' as string]: p.swayAmount,
            ['--tumble' as string]: p.tumble,
            ['--base-o' as string]: p.opacity,
          }}
        />
      ))}
    </div>
  );
});

HoliAmbient.displayName = 'HoliAmbient';
export default HoliAmbient;
