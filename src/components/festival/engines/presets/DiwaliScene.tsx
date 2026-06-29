'use client';

import GoldenParticles from '../../animations/GoldenParticles';
import LuxuryGlow from '../effects/LuxuryGlow';
import BloomLighting from '../effects/BloomLighting';
import LuxuryRays from '../effects/LuxuryRays';
import RocketLaunch from '../effects/RocketLaunch';
import FireworkBurst from '../effects/FireworkBurst';

export default function DiwaliScene({ phase }: { phase?: string }) {
  console.log('DIWALI PHASE =', phase);

  // Phase ka history track karo — pehle wala bhi dikhe
  const showRocket = phase === 'ROCKET' || phase === 'FIREWORK' || phase === 'HANDOVER';
  const showFirework = phase === 'FIREWORK' || phase === 'HANDOVER';
  const showAmbient = phase === 'HANDOVER';  // ✅ HANDOVER pe ambient shuru

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">

      {/* ✅ FLASH — White flash effect */}
      {phase === 'FLASH' && (
        <div className="absolute inset-0 bg-white animate-pulse" />
      )}

      {/* ✅ ROCKET — Rocket launch, FIREWORK/HANDOVER me bhi rehta hai */}
      {showRocket && <RocketLaunch />}

      {/* ✅ FIREWORK — Sirf FIREWORK aur HANDOVER me dikhta hai */}
      {showFirework && <FireworkBurst />}

      {/* ✅ HANDOVER pe ambient effects aate hain */}
      {showAmbient && (
        <>
          <LuxuryGlow />
          <LuxuryRays />
          <BloomLighting />
          <GoldenParticles preset="DIWALI" />
        </>
      )}

    </div>
  );
}
