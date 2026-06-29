'use client';

import GoldenParticles from '../../animations/GoldenParticles';
import LuxuryGlow from '../effects/LuxuryGlow';
import BloomLighting from '../effects/BloomLighting';
import LuxuryRays from '../effects/LuxuryRays';
import RocketLaunch from '../effects/RocketLaunch';
import FireworkBurst from '../effects/FireworkBurst';

export default function DiwaliScene({
  phase,
}: {
  phase?: string;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">

      {/* 🚀 Rocket Launch Phase */}
      {phase === 'ROCKET' && (
        <RocketLaunch />
      )}

      {/* 🚀 Firework Burst Phase */}
      {phase === 'FIREWORK' && (
        <FireworkBurst />
      )}

      {/* 🚀 Ambient Phase */}
      {phase === 'AMBIENT' && (
        <>
          <LuxuryGlow />
          <LuxuryRays />
          <BloomLighting />
          <GoldenParticles preset="DIWALI" />
        </>
      )}

      {/* 🚀 Safe Fallback: Agar phase 'ACTIVE' ho ya undefined ho, to default Diwali ambient chalega */}
      {(!phase || phase === 'ACTIVE') && (
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
