'use client';

import GoldenParticles from '../../animations/GoldenParticles';
import LuxuryGlow from '../effects/LuxuryGlow';
import BloomLighting from '../effects/BloomLighting';
import LuxuryRays from '../effects/LuxuryRays';
import Shooting from '../effects/Shooting';

export default function DiwaliScene({ phase }: { phase?: string }) {
  console.log('DIWALI SCENE PHASE =', phase);

  // ✅ ACCUMULATION LOGIC — Purana wala rehta hai, naya add hota hai
  const showFlash    = phase === 'FLASH';
 const showShooting = phase === 'SHOOTING' || phase === 'HANDOVER'; 
  const showAmbient  = phase === 'HANDOVER' || phase === 'AMBIENT';

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
      
      {/* ✅ AMBIENT — HANDOVER se shuru, AMBIENT me bhi rehta */}
      {showAmbient && (
        <>
          <LuxuryGlow />
          <LuxuryRays />
          <BloomLighting />
          <GoldenParticles preset="DIWALI" />
        </>
      )}

      {/* Flash animation keyframes (inline daal diya, external CSS ki zaroorat nahi) */}
      <style jsx>{`
        @keyframes flashFade {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>

    </div>
  );
}
