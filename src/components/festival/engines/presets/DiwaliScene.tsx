'use client';

import GoldenParticles from '../../animations/GoldenParticles';
import Shooting from '../effects/Shooting';

export default function DiwaliScene({ phase }: { phase?: string }) {
  console.log('DIWALI SCENE PHASE =', phase);

  const showFlash = phase === 'FLASH';

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[3]">

      {/* ⚡ 1. FLASH OVERLAY (0.5s Soft Fade Out) */}
      {showFlash && (
        <div 
          className="absolute inset-0 bg-white z-50 animate-[flashFade_0.5s_ease-out_forwards]"
        />
      )}

      {/* 🚀 2. FIREWORKS & ROCKETS (Clean Explosions - No Stuck Dhabba) */}
      <Shooting />

      {/* 🌟 3. CLEAN MICRO GOLD DUST PARTICLES */}
      <GoldenParticles preset="DIWALI" />

      {/* Flash animation keyframes */}
      <style jsx>{`
        @keyframes flashFade {
          0%   { opacity: 1; }
          100% { opacity: 0; display: none; }
        }
      `}</style>

    </div>
  );
}
