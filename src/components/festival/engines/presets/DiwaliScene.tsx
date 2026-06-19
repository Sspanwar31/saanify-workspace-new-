'use client';

import GoldenParticles from '../../animations/GoldenParticles';

export default function DiwaliScene() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">

      {/* Luxury Gold Glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at center, rgba(255,215,0,0.18) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Secondary Warm Glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 80%, rgba(255,140,0,0.10) 0%, transparent 60%)',
        }}
      />

      {/* Golden Dust Particles */}
      <GoldenParticles preset="DIWALI" />

      {/* Static Diyas (Temporary) */}
      <div className="absolute bottom-8 left-10 text-5xl">
        🪔
      </div>

      <div className="absolute bottom-12 right-12 text-5xl">
        🪔
      </div>

      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-6xl">
        🪔
      </div>

      {/* Decorative Sparkles */}
      <div className="absolute top-20 left-1/3 text-3xl text-yellow-300">
        ✨
      </div>

      <div className="absolute top-32 right-1/4 text-2xl text-yellow-200">
        ✨
      </div>

    </div>
  );
}
