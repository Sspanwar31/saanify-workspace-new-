'use client';

import RiverReflection from '../effects/RiverReflection';
import ArghyaReflection from '../effects/ArghyaReflection';

export default function ChhathSunriseScene() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">

      {/* Sunrise Glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2"
        style={{
          width: '700px',
          height: '300px',
          background:
            'radial-gradient(circle, rgba(255,220,120,.9) 0%, rgba(255,180,60,.4) 45%, transparent 80%)',
          filter: 'blur(40px)',
        }}
      />

      {/* River Reflection */}
      <RiverReflection />

      {/* Water Glow Layer */}
      <div
        className="absolute bottom-0 w-full h-[35%]"
        style={{
          background:
            'linear-gradient(to top, rgba(255,180,60,.18), transparent)',
        }}
      />

      {/* Floating Golden Dust */}
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            bottom: `${Math.random() * 45}%`,
            width: `${2 + Math.random() * 4}px`,
            height: `${2 + Math.random() * 4}px`,
            background: '#FFD36A',
            opacity: 0.5,
            animation: `floatDust ${8 + Math.random() * 10}s linear infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}

      {/* Water Sparkles */}
      {Array.from({ length: 25 }).map((_, i) => (
        <div
          key={`sparkle-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            bottom: `${5 + Math.random() * 25}%`,
            width: '3px',
            height: '3px',
            background: '#FFF5CC',
            boxShadow: '0 0 12px #FFD36A',
            animation: `sparkle ${2 + Math.random() * 4}s ease-in-out infinite`,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes floatDust {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(-200px);
          }
        }

        @keyframes sparkle {
          0%,100% {
            opacity: .2;
          }

          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
