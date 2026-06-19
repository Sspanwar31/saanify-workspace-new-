'use client';

import GoldenParticles from '../../animations/GoldenParticles';

export default function DiwaliScene() {

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">

      {/* Luxury Dark Glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at center, rgba(255,180,0,0.15) 0%, transparent 70%)'
        }}
      />

      {/* Golden Dust */}
      <GoldenParticles preset="DIWALI" />

      {/* Diyas */}
      <div className="absolute bottom-8 left-10 text-5xl">
        🪔
      </div>

      <div className="absolute bottom-20 right-20 text-4xl">
        🪔
      </div>

      <div className="absolute top-20 left-1/3 text-3xl">
        ✨
      </div>

    </div>
  );
}
