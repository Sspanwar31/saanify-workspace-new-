'use client';

import GoldenParticles from '../../animations/GoldenParticles';
import LuxuryGlow from '../effects/LuxuryGlow';
import BloomLighting from '../effects/BloomLighting';
import LuxuryRays from '../effects/LuxuryRays';
import Shooting from '../effects/Shooting';

export default function DiwaliScene({ phase }: { phase?: string }) {
  console.log('DIWALI SCENE PHASE =', phase);

  const currentPhase = (phase || 'AMBIENT').toUpperCase().trim();

  const isFlash = currentPhase === 'FLASH';
  const isShooting = currentPhase === 'SHOOTING';

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[3]">

      {/* ⚡ 1. FLASH: When entering dashboard after intro */}
      {isFlash && (
        <div 
          className="absolute inset-0 bg-white z-50 animate-[flashFade_0.6s_ease-out_forwards]"
        />
      )}

      {/* 🚀 2. ROCKETS & FIREWORKS: Bursts on dashboard after intro */}
      {(isShooting || currentPhase === 'AMBIENT') && <Shooting />}
      
      {/* 🌟 3. ALWAYS ACTIVE ON DASHBOARD: Gold Particles, Luxury Rays & Glow */}
      <LuxuryGlow />
      <LuxuryRays />
      <BloomLighting />
      <GoldenParticles preset="DIWALI" />

      {/* Flash Keyframes */}
      <style jsx>{`
        @keyframes flashFade {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>

    </div>
  );
}
