'use client';

import GoldenParticles from '../../animations/GoldenParticles';
import LuxuryGlow from '../effects/LuxuryGlow';
import BloomLighting from '../effects/BloomLighting';
import LuxuryRays from '../effects/LuxuryRays';
import Shooting from '../effects/Shooting';

export default function DiwaliScene({ phase }: { phase?: string }) {
  console.log('DIWALI SCENE PHASE =', phase);

  const showFlash = phase === 'FLASH';

  const showShooting =
    phase === 'SHOOTING';

  const showCelebration =
    phase === 'HANDOVER';

  const showAmbient =
    phase === 'AMBIENT';

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">

      {/* ✅ FLASH — White flash overlay */}
      {showFlash && (
        <div 
          className="absolute inset-0 bg-white z-50"
          style={{ 
            animation: 'flashFade 0.6s ease-out forwards' 
          }}
        />
      )}

     {/* SHOOTING — merged rocket + explosion */}
      {showShooting && <Shooting />}
      
      {/* Greeting ke piche luxury light */}
      {showCelebration && (
        <>
          <LuxuryGlow />
          <LuxuryRays />
          <BloomLighting />
        </>
      )}

      {/* Greeting close hone ke baad sirf particles */}
      {showAmbient && (
        <>
          <GoldenParticles preset="DIWALI" />
        </>
      )}

      {/* Flash animation keyframes (inline daal diyo, external CSS ki zaroorat nahi) */}
      <style jsx>{`
        @keyframes flashFade {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>

    </div>
  );
}
