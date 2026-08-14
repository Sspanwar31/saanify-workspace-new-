'use client';

import GoldenParticles from '../../animations/GoldenParticles';
import LuxuryGlow from '../effects/LuxuryGlow';
import BloomLighting from '../effects/BloomLighting';
import LuxuryRays from '../effects/LuxuryRays';
import Shooting from '../effects/Shooting';

export default function DiwaliScene({ phase }: { phase?: string }) {
  console.log('DIWALI SCENE PHASE =', phase);

  const showFlash = phase === 'FLASH';

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[3]">

      {/* ✅ FLASH — White flash overlay at start */}
      {showFlash && (
        <div 
          className="absolute inset-0 bg-white z-50"
          style={{ 
            animation: 'flashFade 0.6s ease-out forwards' 
          }}
        />
      )}

      {/* 🚀 🎆 ALWAYS ACTIVE ON DASHBOARD: Rockets, Fireworks, Gold Particles & Luxury Glow */}
      <Shooting />
      <LuxuryGlow />
      <LuxuryRays />
      <BloomLighting />
      <GoldenParticles preset="DIWALI" />

      {/* Flash animation keyframes */}
      <style jsx>{`
        @keyframes flashFade {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>

    </div>
  );
}
